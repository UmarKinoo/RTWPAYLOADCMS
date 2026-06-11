import type { Payload } from 'payload'
import { sendEmail } from '@/lib/email'
import { candidateModerationReminderEmailTemplate } from '@/lib/email-templates'
import { getModeratorEmails } from '@/lib/admin/moderator-emails'
import { moderationQueueWhere } from '@/lib/candidates/profile-status'
import { getServerSideURL } from '@/utilities/getURL'
import { defaultLocale } from '@/i18n/config'

const REMINDER_COOLDOWN_MS = 20 * 60 * 60 * 1000 // 20 hours between digest emails
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000 // 24h+ waiting

export async function sendCandidateModerationReminders(
  payload: Payload,
): Promise<{ sent: boolean; pendingCount: number; reason?: string }> {
  const result = await payload.find({
    collection: 'candidates',
    where: moderationQueueWhere(),
    sort: 'moderation.submittedAt',
    limit: 500,
    depth: 0,
    overrideAccess: true,
  })

  const pendingCount = result.totalDocs
  if (pendingCount === 0) {
    return { sent: false, pendingCount: 0, reason: 'queue_empty' }
  }

  const now = Date.now()
  const oldestSubmitted = result.docs
    .map((c) => c.moderation?.submittedAt || c.createdAt)
    .filter(Boolean)
    .map((d) => new Date(String(d)).getTime())
    .sort((a, b) => a - b)[0]

  if (!oldestSubmitted || now - oldestSubmitted < STALE_THRESHOLD_MS) {
    return { sent: false, pendingCount, reason: 'not_stale_yet' }
  }

  const recentlyReminded = result.docs.some((c) => {
    const last = c.moderation?.lastReminderSentAt
    if (!last) return false
    return now - new Date(last).getTime() < REMINDER_COOLDOWN_MS
  })

  if (recentlyReminded) {
    return { sent: false, pendingCount, reason: 'reminder_cooldown' }
  }

  const emails = await getModeratorEmails(payload)
  if (emails.length === 0) {
    return { sent: false, pendingCount, reason: 'no_moderator_emails' }
  }

  const oldestHours = Math.floor((now - oldestSubmitted) / (60 * 60 * 1000))
  const queueUrl = `${getServerSideURL()}/${defaultLocale}/moderator/candidates/pending`
  const html = candidateModerationReminderEmailTemplate({
    pendingCount,
    oldestHours,
    queueUrl,
  })

  const emailResult = await sendEmail({
    to: emails,
    subject: `Reminder: ${pendingCount} candidate profile${pendingCount === 1 ? '' : 's'} awaiting review`,
    html,
  })

  if (!emailResult.success) {
    return { sent: false, pendingCount, reason: 'email_failed' }
  }

  const reminderAt = new Date().toISOString()
  await Promise.all(
    result.docs.map((c) =>
      payload.update({
        collection: 'candidates',
        id: c.id,
        data: {
          moderation: {
            ...(c.moderation || {}),
            lastReminderSentAt: reminderAt,
          },
        },
        overrideAccess: true,
      }),
    ),
  )

  return { sent: true, pendingCount }
}
