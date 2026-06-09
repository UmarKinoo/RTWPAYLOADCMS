import type { ScreeningState } from '../types/ScreeningState'
import { getReadyBotPayload } from '../lib/getReadyBotPayload'
import { parseCandidateReply } from '../services/parseCandidateReply'
import { validateExtractedData } from '../services/validateExtractedData'
import { createHumanReviewTask } from '../services/createHumanReviewTask'
import { runMemoryCompactionWorkflow } from './memoryCompactionWorkflow'
import {
  getCandidate,
  getCandidateMemory,
  getCandidateMessages,
  findActiveScreeningTask,
  updateScreeningTask,
  updateCandidateScreeningMeta,
  saveCandidateMessage,
  updateCandidateSafeFields,
  setCandidateOptedOut,
  getLatestScreeningResult,
  type ReadyBotPayloadContext,
} from '../tools/payloadTool'
import { createWorkflowTrace } from '../tools/workflowTrace'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import { buildCandidateProfileContext } from '../services/buildCandidateProfileContext'
import { getReadyBotModel } from '../lib/openaiClient'
import { sendWhatsAppMessage, isWhatsAppConfigured } from '../tools/whatsappTool'
import { resolveWhatsAppNumber } from '../lib/candidateReadyBot'
import { generateScreeningMessage } from '../services/generateScreeningMessage'
import { detectMissingFields } from '../services/detectMissingFields'
import { filterSafeExtractedFields } from '../tools/permissionTool'
import { readyBotTerminalLog } from '../tools/terminalLog'
import { agentEventService } from '../agent/agentEventService'
import { permissionEngine } from '../agent/permissionEngine'
import { compactionPipeline } from '../agent/compactionPipeline'
import { runInboundReplyAgent } from '../agent/inboundReplyAgent'
import { loadReadyBotSettings } from '@/lib/readybot/settings'

const STOP_PATTERN = /\b(stop|unsubscribe|opt\s*out)\b/i

export async function runInboundReplyWorkflow(args: {
  candidateId: string | number
  replyText: string
  externalMessageId?: string
  fromPhone?: string
  rawPayload?: unknown
}): Promise<ScreeningState> {
  const payload = await getReadyBotPayload()
  const ctx: ReadyBotPayloadContext = { payload }
  const state: ScreeningState = {
    candidateId: String(args.candidateId),
    missingFields: [],
    latestMessage: args.replyText,
    auditTrail: [],
  }

  const candidate = await getCandidate(ctx, args.candidateId)
  const candidateLabel = candidateLabelFromDoc(candidate)
  const trace = createWorkflowTrace(ctx, {
    workflowName: 'inboundReply',
    phase: 'inbound',
    candidateId: args.candidateId,
    candidateLabel,
  })

  state.candidateProfile = buildCandidateProfileContext(candidate)

  readyBotTerminalLog(`[Inbound] ${candidateLabel} → "${args.replyText.slice(0, 120)}"`)
  void agentEventService.recordEvent('candidate_message', { text: args.replyText.slice(0, 500), from: args.fromPhone }, { candidateId: String(args.candidateId) })

  await trace.log({
    step: '① Inbound WhatsApp reply received',
    toolUsed: 'inboundReplyWorkflow',
    status: 'started',
    detail: { preview: args.replyText.slice(0, 200), from: args.fromPhone },
  })

  if (STOP_PATTERN.test(args.replyText)) {
    await trace.runTool({
      step: 'Process STOP / opt-out',
      toolUsed: 'setCandidateOptedOut',
      fn: () => setCandidateOptedOut(ctx, args.candidateId),
    })
    state.nextAction = 'stop'
    void agentEventService.recordEvent('status_change', { status: 'opted_out', reason: 'STOP keyword received' }, { candidateId: String(args.candidateId) })
    await trace.log({
      step: 'Pipeline ended — candidate opted out',
      toolUsed: 'inboundReplyWorkflow',
      status: 'success',
      detail: { nextAction: state.nextAction },
    })
    return state
  }

  const task = await trace.runTool({
    step: '② Find active screening task',
    toolUsed: 'findActiveScreeningTask',
    fn: () => findActiveScreeningTask(ctx, args.candidateId),
    resultDetail: (t) => ({ found: !!t, taskId: t?.id }),
  })

  if (task) {
    state.taskId = String(task.id)
    trace.screeningTaskId = task.id
    await trace.runTool({
      step: 'Save inbound message + update task',
      toolUsed: 'saveCandidateMessage + updateScreeningTask',
      fn: async () => {
        await saveCandidateMessage(ctx, {
          candidate: args.candidateId,
          screeningTask: task.id,
          channel: 'whatsapp',
          direction: 'inbound',
          from: args.fromPhone,
          body: args.replyText,
          externalMessageId: args.externalMessageId,
          status: 'received',
          receivedAt: new Date().toISOString(),
          rawPayload: args.rawPayload,
        })
        await updateScreeningTask(ctx, task.id, {
          status: 'reply_received',
          replyReceivedAt: new Date().toISOString(),
          replyText: args.replyText,
        })
      },
    })
  }

  await trace.runTool({
    step: 'Update candidate last reply meta',
    toolUsed: 'updateCandidateScreeningMeta',
    fn: () =>
      updateCandidateScreeningMeta(ctx, args.candidateId, {
        lastReplyAt: new Date().toISOString(),
        screeningStatus: 'info_received',
      }),
  })

  // ── Agentic path (flag: useAgenticReply) ──────────────────────────────────
  const settings = await loadReadyBotSettings(payload)
  if (settings.useAgenticReply || process.env.READYBOT_USE_AGENTIC_REPLY === '1') {
    await trace.log({ step: '③ Agentic reply path (inboundReplyAgent)', toolUsed: 'inboundReplyAgent', status: 'running' })

    try {
      const agentResult = await runInboundReplyAgent({
        candidateId: args.candidateId,
        replyText: args.replyText,
      })

      // Send reply via WhatsApp
      const wa = resolveWhatsAppNumber(candidate)
      if (isWhatsAppConfigured() && wa && agentResult.reply) {
        const sent = await sendWhatsAppMessage({ to: wa, body: agentResult.reply })
        if (sent.success) {
          readyBotTerminalLog(`[Sarah agent → ${candidateLabel}] "${agentResult.reply.slice(0, 80)}"`)
          void agentEventService.recordEvent('bot_message', { body: agentResult.reply.slice(0, 500), to: wa, agent: 'inboundReplyAgent' }, { candidateId: String(args.candidateId) })
          if (task) {
            await saveCandidateMessage(ctx, {
              candidate: args.candidateId,
              screeningTask: task.id,
              channel: 'whatsapp',
              direction: 'outbound',
              to: wa,
              body: agentResult.reply,
              status: 'sent',
              sentAt: new Date().toISOString(),
            })
          }
        }
      }

      // Route to human review if needed
      if (agentResult.requiresHumanReview) {
        await createHumanReviewTask(ctx, {
          candidateId: args.candidateId,
          screeningTaskId: task?.id,
          reason: agentResult.humanReviewReason ?? 'Agent flagged for review',
          suggestedUpdate: { replyText: args.replyText, toolsUsed: agentResult.toolsUsed },
          trace,
        })
        await updateCandidateScreeningMeta(ctx, args.candidateId, { screeningStatus: 'needs_human_review' })
        state.nextAction = 'human_review'
      } else {
        state.nextAction = 'update_profile'
      }

      // Compact memory
      await compactionPipeline.compact({ candidateId: args.candidateId, permissionMode: 'workspace-write' })

      await trace.log({ step: '⑨ Agentic reply complete', toolUsed: 'inboundReplyAgent', status: 'success', detail: { toolsUsed: agentResult.toolsUsed, requiresHumanReview: agentResult.requiresHumanReview } })
      return state
    } catch (err) {
      readyBotTerminalLog(`[Sarah agent ERROR] ${String(err)} — falling back to classic pipeline`)
      await trace.log({ step: 'Agentic path failed — falling back', toolUsed: 'inboundReplyAgent', status: 'error', errorMessage: String(err) })
      // Fall through to classic pipeline below
    }
  }
  // ── End agentic path ───────────────────────────────────────────────────────

  const memory = await trace.runTool({
    step: '③ Load candidate memory',
    toolUsed: 'getCandidateMemory',
    fn: () => getCandidateMemory(ctx, args.candidateId),
    resultDetail: (m) => ({ hasMemory: !!m }),
  })

  const missing = detectMissingFields(candidate)
  state.missingFields = missing.map((m) => m.field)

  const latestScreening = await getLatestScreeningResult(ctx, args.candidateId)
  const recommendedQuestions = (latestScreening?.recommendedQuestions as { question: string }[] | undefined)
    ?.map((q) => q.question) ?? []
  const fitSummary = (latestScreening?.fitSummary as string | undefined) ?? undefined

  const messagesResult = await getCandidateMessages(ctx, args.candidateId, 8)
  const recentMessages = messagesResult.docs
    .reverse()
    .map((m) => ({
      direction: m.direction as 'inbound' | 'outbound',
      body: String(m.body ?? ''),
    }))

  await trace.log({
    step: '④ Detect missing fields on profile',
    toolUsed: 'detectMissingFields',
    status: 'success',
    detail: { missing: state.missingFields },
  })

  const extraction = await parseCandidateReply({
    replyText: args.replyText,
    missingFields: state.missingFields,
    memorySummary: memory?.conversationSummary ?? memory?.cvSummary ?? undefined,
    candidateProfile: state.candidateProfile,
    trace,
  })

  if (extraction) {
    state.extractedData = extraction
    state.confidenceScore = extraction.confidence
    if (task) {
      await trace.runTool({
        step: 'Store extraction on screening task',
        toolUsed: 'updateScreeningTask',
        fn: () =>
          updateScreeningTask(ctx, task.id, {
            extractedData: extraction,
            confidenceScore: extraction.confidence,
          }),
      })
    }
  }

  await compactionPipeline.compact({
    candidateId: args.candidateId,
    permissionMode: 'workspace-write',
  })

  if (!extraction) {
    await createHumanReviewTask(ctx, {
      candidateId: args.candidateId,
      screeningTaskId: task?.id,
      reason: 'Could not parse reply (LLM off or failed)',
      suggestedUpdate: { replyText: args.replyText },
      trace,
    })
    state.nextAction = 'human_review'
    await trace.log({
      step: 'Pipeline ended — parse failed',
      toolUsed: 'inboundReplyWorkflow',
      status: 'success',
      detail: { nextAction: state.nextAction },
    })
    return state
  }

  await trace.log({
    step: '⑤ Validate extracted fields',
    toolUsed: 'validateExtractedData',
    status: 'running',
    detail: { confidence: extraction.confidence },
  })

  // Tool-level gate via Agent OS permissionEngine (allowed-tools-only mode for screening agent)
  const updateToolDecl = {
    name: 'update_candidate_profile',
    description: 'Update candidate profile fields from screening extraction',
    riskLevel: 'medium' as const,
    requiredPermissionMode: 'workspace-write' as const,
    requiresHumanApproval: false,
    handler: async () => ({}),
  }
  const agentCtx = {
    permissionMode: 'allowed-tools-only' as const,
    allowedTools: ['update_candidate_profile', 'send_whatsapp_message', 'save_screening_answer', 'save_memory', 'update_agent_task'],
    candidateId: String(args.candidateId),
  }
  const toolGate = await permissionEngine.checkPermission(updateToolDecl, agentCtx)
  if (!toolGate.granted) {
    await createHumanReviewTask(ctx, {
      candidateId: args.candidateId,
      screeningTaskId: task?.id,
      reason: `Agent OS permission denied: ${toolGate.reason}`,
      suggestedUpdate: { extraction, fields: extraction.fields },
      trace,
    })
    state.nextAction = 'human_review'
    return state
  }

  const permission = filterSafeExtractedFields(extraction.fields)
  void agentEventService.recordEvent('permission_decision', { allowed: permission.allowed, reason: permission.allowed ? 'safe fields' : (permission as { reason?: string }).reason ?? 'blocked' }, { candidateId: String(args.candidateId) })
  await trace.log({
    step: 'Permission check (safe fields only)',
    toolUsed: 'filterSafeExtractedFields',
    status: permission.allowed ? 'success' : 'skipped',
    detail: {
      allowed: permission.allowed,
      reason: permission.allowed ? undefined : permission.reason,
    },
  })

  const validation = validateExtractedData(extraction)
  await trace.log({
    step: 'Validation result',
    toolUsed: 'validateExtractedData',
    status: validation.canAutoApply ? 'success' : 'skipped',
    detail: { canAutoApply: validation.canAutoApply, reasons: validation.reasons },
  })

  if (validation.canAutoApply) {
    const update = await trace.runTool({
      step: '⑥ Auto-update candidate profile',
      toolUsed: 'updateCandidateSafeFields',
      fn: () => updateCandidateSafeFields(ctx, args.candidateId, extraction.fields),
      resultDetail: (u) => ({
        success: u.success,
        applied: u.success ? Object.keys(u.applied ?? {}) : [],
      }),
    })

    if (update.success) {
      state.nextAction = 'update_profile'
      void agentEventService.recordEvent('profile_update', { fields: Object.keys((update as { applied?: Record<string, unknown> }).applied ?? {}), auto: true }, { candidateId: String(args.candidateId) })
      const refreshed = await getCandidate(ctx, args.candidateId)
      const stillMissing = detectMissingFields(refreshed)
      const wa = resolveWhatsAppNumber(candidate)

      if (stillMissing.length > 0 && isWhatsAppConfigured() && wa && task) {
        const { messageBody } = await generateScreeningMessage(refreshed, stillMissing, {
          recommendedQuestions,
          fitSummary,
          recentMessages,
          memorySummary: memory?.conversationSummary ?? undefined,
          cvSummary: memory?.cvSummary ?? undefined,
          trace,
        })
        await trace.runTool({
          step: '⑦ Send follow-up WhatsApp (still missing fields)',
          toolUsed: 'sendWhatsAppMessage',
          fn: async () => {
            const sent = await sendWhatsAppMessage({ to: wa, body: messageBody })
            if (sent.success) {
              void agentEventService.recordEvent('bot_message', { body: messageBody.slice(0, 500), to: wa, success: true }, { candidateId: String(args.candidateId) })
              await saveCandidateMessage(ctx, {
                candidate: args.candidateId,
                screeningTask: task.id,
                channel: 'whatsapp',
                direction: 'outbound',
                to: wa,
                body: messageBody,
                status: 'sent',
                sentAt: new Date().toISOString(),
              })
            }
            return sent
          },
        })
      } else if (stillMissing.length === 0) {
        await trace.runTool({
          step: 'Mark profile verified + complete task',
          toolUsed: 'updateCandidateScreeningMeta',
          fn: async () => {
            await updateCandidateScreeningMeta(ctx, args.candidateId, {
              screeningStatus: 'verified',
            })
            if (task) {
              await updateScreeningTask(ctx, task.id, {
                status: 'completed',
                completedAt: new Date().toISOString(),
              })
            }
          },
        })
      }

      await trace.log({
        step: '⑨ Inbound pipeline complete (auto-applied)',
        toolUsed: 'inboundReplyWorkflow',
        status: 'success',
        modelUsed: getReadyBotModel(),
        confidence: extraction.confidence,
        detail: { nextAction: state.nextAction, workflowRunId: trace.runId },
      })
      return state
    }

    await trace.log({
      step: 'Auto-update failed',
      toolUsed: 'updateCandidateSafeFields',
      status: 'error',
      detail: { reason: update.reason },
    })
  }

  await createHumanReviewTask(ctx, {
    candidateId: args.candidateId,
    screeningTaskId: task?.id,
    reason: validation.reasons.join('; ') || 'Review required',
    suggestedUpdate: { extraction, fields: extraction.fields },
    trace,
  })
  void agentEventService.recordEvent('status_change', { status: 'needs_human_review', reason: validation.reasons.join('; ') || 'Review required' }, { candidateId: String(args.candidateId) })
  await trace.runTool({
    step: 'Flag candidate needs human review',
    toolUsed: 'updateCandidateScreeningMeta',
    fn: async () => {
      await updateCandidateScreeningMeta(ctx, args.candidateId, {
        screeningStatus: 'needs_human_review',
      })
      if (task) {
        await updateScreeningTask(ctx, task.id, { status: 'needs_human_review' })
      }
    },
  })

  // Always reply to the candidate so the conversation feels natural
  const stillMissing = detectMissingFields(candidate)
  const wa = resolveWhatsAppNumber(candidate)
  if (stillMissing.length > 0 && isWhatsAppConfigured() && wa) {
    const { messageBody } = await generateScreeningMessage(candidate, stillMissing, {
      recommendedQuestions,
      fitSummary,
      recentMessages,
      memorySummary: memory?.conversationSummary ?? undefined,
      cvSummary: memory?.cvSummary ?? undefined,
      trace,
    })
    await trace.runTool({
      step: '⑦ Send follow-up WhatsApp (human review path)',
      toolUsed: 'sendWhatsAppMessage',
      fn: async () => {
        const sent = await sendWhatsAppMessage({ to: wa, body: messageBody })
        if (sent.success) {
          readyBotTerminalLog(`[Sarah → ${candidateLabel}] "${messageBody.slice(0, 120)}"`)
          await saveCandidateMessage(ctx, {
            candidate: args.candidateId,
            screeningTask: task?.id,
            channel: 'whatsapp',
            direction: 'outbound',
            to: wa,
            body: messageBody,
            status: 'sent',
            sentAt: new Date().toISOString(),
          })
        } else {
          readyBotTerminalLog(`[Sarah → ${candidateLabel}] SEND FAILED: ${sent.error}`)
        }
        return sent
      },
    })
  }

  state.nextAction = 'human_review'
  await trace.log({
    step: '⑨ Inbound pipeline complete (human review)',
    toolUsed: 'inboundReplyWorkflow',
    status: 'success',
    detail: { nextAction: state.nextAction, workflowRunId: trace.runId },
  })
  return state
}
