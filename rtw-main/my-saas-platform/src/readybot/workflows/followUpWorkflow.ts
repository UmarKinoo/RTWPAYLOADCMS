import { getReadyBotPayload } from '../lib/getReadyBotPayload'
import { getReadyBotFields, resolveWhatsAppNumber } from '../lib/candidateReadyBot'
import { generateScreeningMessage } from '../services/generateScreeningMessage'
import { detectMissingFields } from '../services/detectMissingFields'
import {
  updateScreeningTask,
  saveCandidateMessage,
  markCandidateUnresponsive,
  getCandidate,
  type ReadyBotPayloadContext,
} from '../tools/payloadTool'
import { createWorkflowTrace } from '../tools/workflowTrace'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import { isWhatsAppConfigured, sendWhatsAppMessage } from '../tools/whatsappTool'

const FOLLOW_UP_MS = 2 * 24 * 60 * 60 * 1000
const MAX_ATTEMPTS = 3

export async function runFollowUpWorkflow(): Promise<{ processed: number; sent: number }> {
  const payload = await getReadyBotPayload()
  const ctx: ReadyBotPayloadContext = { payload }
  const cutoff = new Date(Date.now() - FOLLOW_UP_MS).toISOString()

  const batchTrace = createWorkflowTrace(ctx, {
    workflowName: 'followup_batch',
    phase: 'followup',
  })

  const tasks = await batchTrace.runTool({
    step: 'Load tasks awaiting follow-up',
    toolUsed: 'payload.find(candidate-screening-tasks)',
    fn: () =>
      payload.find({
        collection: 'candidate-screening-tasks',
        where: {
          and: [
            { status: { equals: 'awaiting_reply' } },
            { lastSentAt: { less_than: cutoff } },
          ],
        },
        limit: 50,
        overrideAccess: true,
        depth: 0,
      }),
    detail: { cutoff },
    resultDetail: (r) => ({ count: r.docs.length }),
  })

  let processed = 0
  let sent = 0

  for (const task of tasks.docs) {
    processed++
    const attemptCount = (task.attemptCount ?? 0) + 1
    const candidateId =
      typeof task.candidate === 'object' ? task.candidate?.id : task.candidate
    if (!candidateId) continue

    const candidate = await getCandidate(ctx, candidateId)
    const trace = batchTrace.forCandidate(candidateId, candidateLabelFromDoc(candidate))
    trace.screeningTaskId = task.id

    if (attemptCount >= MAX_ATTEMPTS) {
      await trace.runTool({
        step: 'Max follow-ups — mark unresponsive',
        toolUsed: 'markCandidateUnresponsive',
        fn: () => markCandidateUnresponsive(ctx, candidateId),
        detail: { attemptCount, max: MAX_ATTEMPTS },
      })
      continue
    }

    const rb = getReadyBotFields(candidate)
    if (!rb.whatsappOptIn) {
      await trace.log({
        step: 'Skipped — no WhatsApp opt-in',
        toolUsed: 'followUpWorkflow',
        status: 'skipped',
      })
      continue
    }

    const wa = resolveWhatsAppNumber(candidate)
    if (!wa || !isWhatsAppConfigured()) {
      await trace.log({
        step: 'Skipped — WhatsApp not configured or no number',
        toolUsed: 'followUpWorkflow',
        status: 'skipped',
        detail: { hasNumber: !!wa, configured: isWhatsAppConfigured() },
      })
      continue
    }

    const missing = detectMissingFields(candidate)
    const { messageBody } = await generateScreeningMessage(candidate, missing, { trace })

    const result = await trace.runTool({
      step: `Send follow-up #${attemptCount}`,
      toolUsed: 'sendWhatsAppMessage',
      fn: () => sendWhatsAppMessage({ to: wa, body: messageBody }),
      resultDetail: (r) => ({ sent: r.success }),
    })

    if (result.success) {
      sent++
      await trace.runTool({
        step: 'Log follow-up message',
        toolUsed: 'saveCandidateMessage',
        fn: () =>
          saveCandidateMessage(ctx, {
            candidate: candidateId,
            screeningTask: task.id,
            channel: 'whatsapp',
            direction: 'outbound',
            to: wa,
            body: messageBody,
            externalMessageId: result.externalMessageId,
            status: 'sent',
            sentAt: new Date().toISOString(),
          }),
      })
    }

    await trace.runTool({
      step: 'Update task attempt count + next follow-up',
      toolUsed: 'updateScreeningTask',
      fn: () =>
        updateScreeningTask(ctx, task.id, {
          attemptCount,
          lastSentAt: new Date().toISOString(),
          nextFollowUpAt: new Date(Date.now() + FOLLOW_UP_MS).toISOString(),
          messageBody,
        }),
    })
  }

  await batchTrace.log({
    step: 'Follow-up batch complete',
    toolUsed: 'followUpWorkflow',
    status: 'success',
    detail: { processed, sent },
  })

  return { processed, sent }
}
