import type { Payload } from 'payload'
import type { Candidate } from '@/payload-types'
import { sendEmail } from '@/lib/email'
import { candidateModerationReviewEmailTemplate } from '@/lib/email-templates'
import { getModeratorEmails } from '@/lib/admin/moderator-emails'
import { isInModerationQueue } from '@/lib/candidates/profile-status'
import { getServerSideURL } from '@/utilities/getURL'
import { defaultLocale } from '@/i18n/config'

function moderationUrls(candidateId: number) {
  const base = getServerSideURL()
  const locale = defaultLocale
  return {
    reviewUrl: `${base}/${locale}/moderator/profiles/candidate/${candidateId}`,
    queueUrl: `${base}/${locale}/moderator/candidates/pending`,
  }
}

export function candidateReadyForModerationQueue(doc: Candidate): boolean {
  return Boolean(
    doc.termsAccepted &&
      doc.phoneVerified &&
      isInModerationQueue(doc.profileStatus as string | undefined),
  )
}

/**
 * Notify moderators when a candidate enters the review queue (after phone verify or resubmit).
 */
export async function notifyModeratorsForCandidate(
  payload: Payload,
  candidate: Candidate,
  options?: { force?: boolean },
): Promise<{ sent: boolean; reason?: string }> {
  if (!candidateReadyForModerationQueue(candidate)) {
    return { sent: false, reason: 'not_ready_for_queue' }
  }

  if (candidate.moderation?.moderatorNotifiedAt && !options?.force) {
    return { sent: false, reason: 'already_notified' }
  }

  const emails = getModeratorEmails()
  if (emails.length === 0) {
    console.warn('[candidate-moderation-notify] No moderator emails configured')
    return { sent: false, reason: 'no_moderator_emails' }
  }

  const { reviewUrl, queueUrl } = moderationUrls(candidate.id)
  const html = candidateModerationReviewEmailTemplate({
    candidateName: `${candidate.firstName} ${candidate.lastName}`,
    jobTitle: candidate.jobTitle,
    location: candidate.location,
    nationality: candidate.nationality,
    reviewUrl,
    queueUrl,
  })

  const result = await sendEmail({
    to: emails,
    subject: `Review candidate profile: ${candidate.firstName} ${candidate.lastName}`,
    html,
  })

  if (!result.success) {
    console.error('[candidate-moderation-notify] Email failed:', result.error)
    return { sent: false, reason: 'email_failed' }
  }

  const now = new Date().toISOString()
  await payload.update({
    collection: 'candidates',
    id: candidate.id,
    data: {
      moderation: {
        ...(candidate.moderation || {}),
        submittedAt: candidate.moderation?.submittedAt || now,
        moderatorNotifiedAt: now,
      },
    },
    overrideAccess: true,
  })

  return { sent: true }
}
