import { schedules, task } from '@trigger.dev/sdk/v3'
import { scanIncompleteCandidates } from './scanIncompleteCandidates'
import { runFollowUpWorkflow } from '@/readybot/workflows/followUpWorkflow'
import { runInboundReplyWorkflow } from '@/readybot/workflows/inboundReplyWorkflow'
import { runMemoryCompactionWorkflow } from '@/readybot/workflows/memoryCompactionWorkflow'
import { getReadyBotPayload } from '@/readybot/lib/getReadyBotPayload'
import { loadReadyBotSettings, recordAutomatedFollowUpRun } from '@/lib/readybot/settings'
import { isReadyBotEnabled } from '@/lib/readybot/isReadyBotEnabled'

const disabled = { skipped: true, reason: 'READYBOT_ENABLED is off' }

export const scanIncompleteCandidatesTask = schedules.task({
  id: 'readybot-scan-incomplete',
  cron: '*/15 * * * *',
  run: async () => {
    if (!isReadyBotEnabled()) return disabled
    return scanIncompleteCandidates({ source: 'scheduled' })
  },
})

export const sendFollowUpsTask = schedules.task({
  id: 'readybot-send-followups',
  cron: '0 9 * * *',
  run: async () => {
    if (!isReadyBotEnabled()) return disabled
    const payload = await getReadyBotPayload()
    const settings = await loadReadyBotSettings(payload)
    if (!settings.automatedFollowUpEnabled) {
      return { processed: 0, sent: 0, skipped: true, reason: 'Automated follow-ups disabled' }
    }
    const result = await runFollowUpWorkflow()
    await recordAutomatedFollowUpRun(payload)
    return result
  },
})

export const processInboundWhatsAppReplyTask = task({
  id: 'readybot-process-inbound',
  run: async (payload: {
    candidateId: string | number
    replyText: string
    externalMessageId?: string
    fromPhone?: string
  }) => {
    if (!isReadyBotEnabled()) return disabled
    await runInboundReplyWorkflow({
      candidateId: payload.candidateId,
      replyText: payload.replyText,
      externalMessageId: payload.externalMessageId,
      fromPhone: payload.fromPhone,
    })
    const messageCount = await import('@/readybot/tools/payloadTool').then(async (t) => {
      const { getReadyBotPayload } = await import('@/readybot/lib/getReadyBotPayload')
      const p = await getReadyBotPayload()
      const msgs = await t.getCandidateMessages({ payload: p }, payload.candidateId, 5)
      return msgs.docs.length
    })
    if (messageCount >= 3) {
      await runMemoryCompactionWorkflow(payload.candidateId)
    }
    return { ok: true }
  },
})

// Re-export for webhook dynamic import
export { processInboundWhatsAppReplyTask as processInboundWhatsAppReply }

export { candidateModerationRemindersTask } from './candidateModerationReminders'
