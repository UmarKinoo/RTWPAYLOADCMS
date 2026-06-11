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
  const status = doc.profileStatus ?? 'pending_review'
  return Boolean(
    doc.termsAccepted &&
      doc.phoneVerified &&
      isInModerationQueue(status),
  )
}

/**
 * Notify moderators when a candidate enters the review queue (after phone verify or resubmit).
 */
export async function notifyModeratorsForCandidate(
  payload: Payload,
  candidateOrId: Candidate | number | string,
  options?: { force?: boolean },
): Promise<{ sent: boolean; reason?: string }> {
  const id =
    typeof candidateOrId === 'object' ? candidateOrId.id : Number(candidateOrId)

  if (!Number.isFinite(id)) {
    return { sent: false, reason: 'invalid_candidate_id' }
  }

  const fresh = await payload.findByID({
    collection: 'candidates',
    id,
    depth: 0,
    overrideAccess: true,
  })

  if (!candidateReadyForModerationQueue(fresh)) {
    console.warn('[candidate-moderation-notify] Not ready for queue', {
      id: fresh.id,
      termsAccepted: fresh.termsAccepted,
      phoneVerified: fresh.phoneVerified,
      profileStatus: fresh.profileStatus,
    })
    return { sent: false, reason: 'not_ready_for_queue' }
  }

  if (fresh.moderation?.moderatorNotifiedAt && !options?.force) {
    return { sent: false, reason: 'already_notified' }
  }

  const emails = getModeratorEmails()
  if (emails.length === 0) {
    console.warn('[candidate-moderation-notify] No moderator emails configured')
    return { sent: false, reason: 'no_moderator_emails' }
  }

  const { reviewUrl, queueUrl } = moderationUrls(fresh.id)
  const html = candidateModerationReviewEmailTemplate({
    candidateName: `${fresh.firstName} ${fresh.lastName}`,
    jobTitle: fresh.jobTitle,
    location: fresh.location,
    nationality: fresh.nationality,
    phone: fresh.phone,
    email: fresh.email,
    reviewUrl,
    queueUrl,
  })

  const result = await sendEmail({
    to: emails,
    subject: `Review candidate profile: ${fresh.firstName} ${fresh.lastName}`,
    html,
  })

  if (!result.success) {
    console.error('[candidate-moderation-notify] Email failed:', result.error)
    return { sent: false, reason: 'email_failed' }
  }

  const now = new Date().toISOString()
  try {
    await payload.update({
      collection: 'candidates',
      id: fresh.id,
      data: {
        moderation: {
          ...(fresh.moderation || {}),
          submittedAt: fresh.moderation?.submittedAt || now,
          moderatorNotifiedAt: now,
        },
      },
      overrideAccess: true,
      context: { disableRevalidate: true },
    })
  } catch (error) {
    console.error('[candidate-moderation-notify] Failed to stamp moderatorNotifiedAt:', error)
    // Email was sent — do not treat as full failure
  }

  return { sent: true }
}
