import type { Payload } from 'payload'
import type { Interview, Employer, Candidate } from '@/payload-types'
import { sendEmail } from '@/lib/email'
import { interviewModerationReviewEmailTemplate } from '@/lib/email-templates'
import { getInterviewNotificationEmails } from '@/lib/admin/moderator-emails'
import { getServerSideURL } from '@/utilities/getURL'
import { defaultLocale } from '@/i18n/config'

function interviewQueueUrl(): string {
  return `${getServerSideURL()}/${defaultLocale}/moderator/interviews/pending`
}

async function resolveEmployer(
  payload: Payload,
  interview: Interview,
): Promise<Employer> {
  if (typeof interview.employer === 'object' && interview.employer) {
    return interview.employer
  }
  return payload.findByID({
    collection: 'employers',
    id: interview.employer as number,
    depth: 0,
    overrideAccess: true,
  })
}

async function resolveCandidate(
  payload: Payload,
  interview: Interview,
): Promise<Candidate> {
  if (typeof interview.candidate === 'object' && interview.candidate) {
    return interview.candidate
  }
  return payload.findByID({
    collection: 'candidates',
    id: interview.candidate as number,
    depth: 0,
    overrideAccess: true,
  })
}

/**
 * Email moderators when an employer submits a new interview request (pending approval).
 */
export async function notifyModeratorsForInterviewRequest(
  payload: Payload,
  interview: Interview,
): Promise<{ sent: boolean; reason?: string }> {
  if (interview.status !== 'pending') {
    return { sent: false, reason: 'not_pending' }
  }

  const emails = await getInterviewNotificationEmails(payload)
  if (emails.length === 0) {
    console.warn('[interview-moderation-notify] No moderator/admin emails configured')
    return { sent: false, reason: 'no_moderator_emails' }
  }

  const [employer, candidate] = await Promise.all([
    resolveEmployer(payload, interview),
    resolveCandidate(payload, interview),
  ])

  const employerName = employer.companyName || employer.email || 'Employer'
  const candidateName = `${candidate.firstName} ${candidate.lastName}`

  const html = interviewModerationReviewEmailTemplate({
    employerName,
    candidateName,
    jobPosition: interview.jobPosition ?? undefined,
    jobLocation: interview.jobLocation ?? undefined,
    salary: interview.salary ?? undefined,
    scheduledAt: String(interview.scheduledAt),
    queueUrl: interviewQueueUrl(),
  })

  const result = await sendEmail({
    to: emails,
    subject: `Interview request: ${employerName} → ${candidateName}`,
    html,
  })

  if (!result.success) {
    console.error('[interview-moderation-notify] Email failed:', result.error)
    return { sent: false, reason: 'email_failed' }
  }

  return { sent: true }
}
