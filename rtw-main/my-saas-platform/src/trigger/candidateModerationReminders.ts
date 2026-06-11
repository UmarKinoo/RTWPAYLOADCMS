import { schedules } from '@trigger.dev/sdk/v3'
import { getPayload } from 'payload'
import config from '@payload-config'
import { sendCandidateModerationReminders } from '@/lib/admin/candidate-moderation-reminders'

export const candidateModerationRemindersTask = schedules.task({
  id: 'candidate-moderation-reminders',
  cron: '0 9 * * *',
  run: async () => {
    const payload = await getPayload({ config })
    return sendCandidateModerationReminders(payload)
  },
})
