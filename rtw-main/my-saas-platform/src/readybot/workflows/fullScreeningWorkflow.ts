/**
 * Full pipeline: CV → understand → role fit → screening result → contact → (replies handled elsewhere)
 */
import type { ScreeningState } from '../types/ScreeningState'
import { getReadyBotPayload } from '../lib/getReadyBotPayload'
import {
  getReadyBotFields,
  isExcludedFromReadyBot,
  resolveWhatsAppNumber,
} from '../lib/candidateReadyBot'
import { detectMissingFields, hasNoMissingFields } from '../services/detectMissingFields'
import { generateScreeningMessage } from '../services/generateScreeningMessage'
import { buildCvSummary, compareCandidateToRole, getModelUsedLabel } from '../services/compareRoleFit'
import { buildCandidateProfileContext } from '../services/buildCandidateProfileContext'
import { createHumanReviewTask } from '../services/createHumanReviewTask'
import {
  getCandidate,
  createScreeningTask,
  updateScreeningTask,
  updateCandidateScreeningMeta,
  findActiveScreeningTask,
  createScreeningResult,
  upsertCandidateMemory,
  saveCandidateMessage,
  type ReadyBotPayloadContext,
} from '../tools/payloadTool'
import { createWorkflowTrace, type WorkflowTrace } from '../tools/workflowTrace'
import { isWhatsAppConfigured, sendWhatsAppTemplate, sendWhatsAppMessage } from '../tools/whatsappTool'
import { isLlmConfigured } from '../tools/llmTool'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import { readyBotTerminalLog } from '../tools/terminalLog'
import { agentEventService } from '../agent/agentEventService'
import { permissionEngine } from '../agent/permissionEngine'

// Tools Sarah is allowed to use in the background scan — anything not listed is blocked
const SCAN_ALLOWED_TOOLS = [
  'save_memory',
  'update_candidate_score',
  'send_whatsapp_message',
  'create_agent_task',
  'update_agent_task',
]

const SCAN_AGENT_CTX = {
  permissionMode: 'allowed-tools-only' as const,
  allowedTools: SCAN_ALLOWED_TOOLS,
}

export type FullScreeningOptions = {
  jobPostingId?: string | number
  targetRoleTitle?: string
  skipOutbound?: boolean
  trace?: WorkflowTrace
}

export async function runFullScreeningWorkflow(
  candidateId: string | number,
  options: FullScreeningOptions = {},
): Promise<ScreeningState> {
  const payload = await getReadyBotPayload()
  const ctx: ReadyBotPayloadContext = { payload }
  const state: ScreeningState = {
    candidateId: String(candidateId),
    jobPostingId: options.jobPostingId != null ? String(options.jobPostingId) : undefined,
    targetRoleTitle: options.targetRoleTitle,
    missingFields: [],
    auditTrail: [],
  }

  const candidate = await getCandidate(ctx, candidateId)
  const candidateLabel = candidateLabelFromDoc(candidate)
  const trace =
    options.trace ??
    createWorkflowTrace(ctx, {
      workflowName: 'fullScreening',
      phase: 'screening',
      candidateId,
      candidateLabel,
    })

  state.candidateProfile = buildCandidateProfileContext(candidate)
  const rb = getReadyBotFields(candidate)

  await trace.log({
    step: '① Pipeline started (CV → role fit → outreach)',
    toolUsed: 'fullScreeningWorkflow',
    status: 'started',
    detail: {
      jobPostingId: options.jobPostingId ?? null,
      skipOutbound: options.skipOutbound ?? false,
    },
  })

  if (isExcludedFromReadyBot(candidate)) {
    await trace.log({
      step: 'Stopped — candidate opted out',
      toolUsed: 'fullScreeningWorkflow',
      status: 'skipped',
    })
    state.nextAction = 'stop'
    return state
  }

  await trace.log({
    step: '② Build candidate profile context',
    toolUsed: 'buildCandidateProfileContext',
    status: 'success',
  })

  const cvSummary = await buildCvSummary(ctx, candidateId, trace)
  state.cvSummary = cvSummary
  if (cvSummary) {
    const memGate = await permissionEngine.checkPermission(
      { name: 'save_memory', description: 'Save CV summary to candidate memory', riskLevel: 'medium', requiredPermissionMode: 'workspace-write', requiresHumanApproval: false, handler: async () => ({}) },
      { ...SCAN_AGENT_CTX, candidateId: String(candidateId) },
    )
    if (memGate.granted) await trace.runTool({
      step: 'Store CV summary in candidate memory',
      toolUsed: 'upsertCandidateMemory',
      fn: () =>
        upsertCandidateMemory(ctx, candidateId, {
          cvSummary,
          profileSummary: cvSummary.slice(0, 2000),
        }),
      resultDetail: () => ({ summaryLength: cvSummary.length }),
    })
    state.auditTrail.push({ step: 'cv_extracted', length: cvSummary.length })
  }

  const jobPostingId =
    options.jobPostingId ??
    (process.env.READYBOT_DEFAULT_JOB_POSTING_ID
      ? Number(process.env.READYBOT_DEFAULT_JOB_POSTING_ID)
      : undefined)

  let roleTitle = options.targetRoleTitle || candidate.jobTitle || 'Profile completion'
  if (isLlmConfigured()) {
    const fit = await compareCandidateToRole(ctx, {
      candidateId,
      jobPostingId,
      targetRoleTitle: options.targetRoleTitle,
      cvSummary,
      trace,
    })
    if (fit.success && fit.result) {
      state.roleFit = fit.result
      roleTitle = fit.jobTitle
      state.missingFields = [
        ...new Set([
          ...detectMissingFields(candidate).map((m) => m.field),
          ...fit.result.gaps,
        ]),
      ]

      const scoreGate = await permissionEngine.checkPermission(
        { name: 'update_candidate_score', description: 'Save role-fit score', riskLevel: 'medium', requiredPermissionMode: 'workspace-write', requiresHumanApproval: false, handler: async () => ({}) },
        { ...SCAN_AGENT_CTX, candidateId: String(candidateId) },
      )
      const resultDoc = scoreGate.granted ? await trace.runTool({
        step: '③ Persist screening result (role fit)',
        toolUsed: 'createScreeningResult',
        fn: () =>
          createScreeningResult(ctx, {
            candidate: candidateId,
            jobPosting: jobPostingId,
            targetRoleTitle: roleTitle,
            fitScore: fit.result!.fitScore,
            fitSummary: fit.result!.fitSummary,
            gaps: fit.result!.gaps.map((g) => ({ gap: g })),
            recommendedQuestions: fit.result!.recommendedQuestions.map((q) => ({
              question: q,
            })),
            cvSummary,
            profileUnderstanding: state.candidateProfile,
            status: fit.result!.needsHumanReview ? 'needs_human_review' : 'ready_to_contact',
            modelUsed: getModelUsedLabel(),
          }),
        resultDetail: (doc) => ({
          fitScore: fit.result!.fitScore,
          resultId: doc.id,
        }),
      }) : null
      state.screeningResultId = resultDoc?.id
      void agentEventService.recordEvent('score_update', { fitScore: fit.result!.fitScore, modelUsed: getModelUsedLabel() ?? 'unknown' }, { candidateId: String(candidateId) })
      state.auditTrail.push({
        step: 'screening_result',
        id: resultDoc?.id,
        fitScore: fit.result.fitScore,
      })

      if (fit.result.needsHumanReview) {
        await createHumanReviewTask(ctx, {
          candidateId,
          reason: fit.result.reason || 'Role fit requires human review',
          suggestedUpdate: { roleFit: fit.result, cvSummary },
          trace,
        })
        await trace.runTool({
          step: 'Update candidate screening meta (needs review)',
          toolUsed: 'updateCandidateScreeningMeta',
          fn: () =>
            updateCandidateScreeningMeta(ctx, candidateId, {
              screeningStatus: 'needs_human_review',
              screeningSummary: fit.result!.fitSummary,
              screeningConfidence: fit.result!.fitScore / 100,
              lastScreenedAt: new Date().toISOString(),
            }),
        })
        state.nextAction = 'human_review'
        await trace.log({
          step: 'Pipeline ended — human review (role fit)',
          toolUsed: 'fullScreeningWorkflow',
          status: 'success',
          detail: { nextAction: state.nextAction },
        })
        return state
      }
    } else if (!fit.success) {
      await trace.log({
        step: 'Role fit comparison failed',
        toolUsed: 'compareRoleFitWithLlm',
        status: 'error',
        errorMessage: fit.error,
      })
    }
  }

  const missing = detectMissingFields(candidate)
  if (state.missingFields.length === 0) {
    state.missingFields = missing.map((m) => m.field)
  }

  await trace.runTool({
    step: '④ Detect missing profile fields',
    toolUsed: 'detectMissingFields',
    fn: async () => {
      await updateCandidateScreeningMeta(ctx, candidateId, {
        missingFields: state.missingFields.map((f) => ({ field: f })),
        lastScreenedAt: new Date().toISOString(),
        screeningSummary: state.roleFit?.fitSummary,
        screeningConfidence: state.roleFit ? state.roleFit.fitScore / 100 : undefined,
      })
      return state.missingFields
    },
    resultDetail: (fields) => ({ missingCount: fields.length, fields }),
  })

  if (hasNoMissingFields(candidate) && !state.roleFit?.gaps?.length) {
    await trace.runTool({
      step: 'Mark candidate verified',
      toolUsed: 'updateCandidateScreeningMeta',
      fn: () =>
        updateCandidateScreeningMeta(ctx, candidateId, { screeningStatus: 'verified' }),
    })
    state.nextAction = 'stop'
    await trace.log({
      step: 'Pipeline ended — profile complete',
      toolUsed: 'fullScreeningWorkflow',
      status: 'success',
      detail: { nextAction: state.nextAction },
    })
    return state
  }

  const existing = await trace.runTool({
    step: 'Check for active screening task',
    toolUsed: 'findActiveScreeningTask',
    fn: () => findActiveScreeningTask(ctx, candidateId),
    resultDetail: (t) => ({ found: !!t, taskId: t?.id }),
  })
  if (existing) {
    state.taskId = String(existing.id)
    state.nextAction = 'wait_for_reply'
    await trace.log({
      step: 'Pipeline ended — awaiting reply on existing task',
      toolUsed: 'fullScreeningWorkflow',
      status: 'skipped',
      screeningTaskId: existing.id,
      detail: { nextAction: state.nextAction },
    })
    return state
  }

  const waNumber = resolveWhatsAppNumber(candidate)
  const channel =
    rb.preferredContactChannel === 'email'
      ? 'email'
      : rb.whatsappOptIn && waNumber
        ? 'whatsapp'
        : 'email'
  state.channel = channel

  await trace.log({
    step: '⑤ Choose outreach channel',
    toolUsed: 'resolveWhatsAppNumber',
    status: 'success',
    detail: { channel, whatsapp: waNumber ?? null, optIn: rb.whatsappOptIn },
  })

  const questions = state.roleFit?.recommendedQuestions ?? []
  const { messageBody, messageTemplate } = await generateScreeningMessage(candidate, missing, {
    fitSummary: state.roleFit?.fitSummary,
    recommendedQuestions: questions,
    trace,
  })

  if (channel === 'whatsapp' && (!rb.whatsappOptIn || !waNumber)) {
    await createHumanReviewTask(ctx, {
      candidateId,
      reason: 'WhatsApp opt-in or number missing',
      suggestedUpdate: { messageBody, missingFields: state.missingFields },
      trace,
    })
    await updateCandidateScreeningMeta(ctx, candidateId, { screeningStatus: 'needs_human_review' })
    state.nextAction = 'human_review'
    await trace.log({
      step: 'Pipeline ended — human review (WhatsApp)',
      toolUsed: 'fullScreeningWorkflow',
      status: 'success',
      detail: { nextAction: state.nextAction },
    })
    return state
  }

  const taskPayload = {
    candidate: candidateId,
    jobPosting: jobPostingId,
    screeningResult: state.screeningResultId,
    status: 'pending' as const,
    channel,
    missingFields: state.missingFields.map((f) => ({ field: f })),
    messageTemplate,
    messageBody,
    attemptCount: 0,
  }
  readyBotTerminalLog('⑥ Create screening task (pre-flight)', {
    candidateId,
    label: candidateLabel,
    screeningResultId: state.screeningResultId ?? null,
    jobPostingId: jobPostingId ?? null,
    channel,
    missingFieldCount: state.missingFields.length,
    missingFieldsSample: state.missingFields.slice(0, 5),
  })

  const task = await trace.runTool({
    step: '⑥ Create screening task',
    toolUsed: 'createScreeningTask',
    fn: () =>
      createScreeningTask(ctx, {
        ...taskPayload,
      }),
    resultDetail: (t) => ({ taskId: t.id }),
  })
  state.taskId = String(task.id)
  trace.screeningTaskId = task.id

  let outboundStatus: 'pending' | 'message_sent' = 'pending'
  let externalId: string | undefined

  const waGate = await permissionEngine.checkPermission(
    { name: 'send_whatsapp_message', description: 'Send WhatsApp outreach to candidate', riskLevel: 'high', requiredPermissionMode: 'ask-before-edit', requiresHumanApproval: true, handler: async () => ({}) },
    { ...SCAN_AGENT_CTX, candidateId: String(candidateId) },
  )

  if (!options.skipOutbound && channel === 'whatsapp' && isWhatsAppConfigured() && waNumber && waGate.granted) {
    const useTemplate = true
    const sent = await trace.runTool({
      step: '⑦ Send WhatsApp outreach',
      toolUsed: useTemplate ? 'sendWhatsAppTemplate' : 'sendWhatsAppMessage',
      fn: () =>
        useTemplate
          ? sendWhatsAppTemplate({
              to: waNumber,
              templateName: messageTemplate || 'profile_completion_v1',
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: candidate.firstName || 'there' },
                  ],
                },
              ],
            })
          : sendWhatsAppMessage({ to: waNumber, body: messageBody }),
      detail: { template: messageTemplate || 'profile_completion_v1' },
      resultDetail: (r) => ({ sent: r.success, externalMessageId: r.externalMessageId }),
    })
    if (!sent.success) {
      readyBotTerminalLog(`[Outbound FAILED → ${candidateLabel}] ${sent.error}`)
      await trace.log({
        step: 'WhatsApp send failed',
        toolUsed: useTemplate ? 'sendWhatsAppTemplate' : 'sendWhatsAppMessage',
        status: 'error',
        errorMessage: sent.error,
      })
    } else {
      readyBotTerminalLog(`[Outbound → ${candidateLabel}] template:${messageTemplate || 'profile_completion_v1'} ✓ id:${sent.externalMessageId}`)
      void agentEventService.recordEvent('bot_message', { type: 'template', template: messageTemplate || 'profile_completion_v1', to: waNumber, success: true, externalMessageId: sent.externalMessageId }, { candidateId: String(candidateId) })
      if (!useTemplate) {
        void agentEventService.recordEvent('bot_message', { type: 'session', to: waNumber, success: true }, { candidateId: String(candidateId) })
      }
      outboundStatus = 'message_sent'
      externalId = sent.externalMessageId
      await trace.runTool({
        step: 'Log outbound message record',
        toolUsed: 'saveCandidateMessage',
        fn: () =>
          saveCandidateMessage(ctx, {
            candidate: candidateId,
            screeningTask: task.id,
            channel: 'whatsapp',
            direction: 'outbound',
            to: waNumber,
            body: messageBody,
            externalMessageId: externalId,
            status: 'sent',
            sentAt: new Date().toISOString(),
          }),
      })
    }
  } else {
    await trace.log({
      step: '⑦ Outbound skipped (config/channel)',
      toolUsed: 'sendWhatsAppTemplate',
      status: 'skipped',
      detail: {
        skipOutbound: options.skipOutbound,
        channel,
        whatsappConfigured: isWhatsAppConfigured(),
      },
    })
  }

  await trace.runTool({
    step: '⑧ Update task + candidate status',
    toolUsed: 'updateScreeningTask + updateCandidateScreeningMeta',
    fn: async () => {
      await updateScreeningTask(ctx, task.id, {
        status: outboundStatus === 'message_sent' ? 'awaiting_reply' : 'pending',
        lastSentAt: outboundStatus === 'message_sent' ? new Date().toISOString() : undefined,
      })
      await updateCandidateScreeningMeta(ctx, candidateId, {
        screeningStatus: outboundStatus === 'message_sent' ? 'awaiting_reply' : 'incomplete',
        lastContactedAt:
          outboundStatus === 'message_sent' ? new Date().toISOString() : undefined,
      })
      if (state.screeningResultId) {
        await ctx.payload.update({
          collection: 'screening-results',
          id: state.screeningResultId,
          data: {
            status: outboundStatus === 'message_sent' ? 'contacted' : 'ready_to_contact',
            screeningTask: task.id,
          } as never,
          overrideAccess: true,
        })
      }
    },
    resultDetail: () => ({ outboundStatus }),
  })

  state.nextAction = outboundStatus === 'message_sent' ? 'wait_for_reply' : 'send_message'

  await trace.log({
    step: '⑨ Pipeline complete',
    toolUsed: 'fullScreeningWorkflow',
    status: 'success',
    screeningTaskId: task.id,
    detail: { outboundStatus, channel, nextAction: state.nextAction, workflowRunId: trace.runId },
  })

  return state
}
