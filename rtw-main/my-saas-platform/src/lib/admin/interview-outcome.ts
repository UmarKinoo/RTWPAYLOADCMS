import type { Interview } from '@/payload-types'

export type InterviewOutcomeActor = 'candidate' | 'moderator' | 'employer' | 'system'
export type InterviewOutcomeAction =
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'accepted'
  | 'completed'

export type InterviewOutcomeEntry = {
  at: string
  actor: InterviewOutcomeActor
  action: InterviewOutcomeAction
  reason?: string
  note?: string
  id?: string
}

export function appendInterviewOutcome(
  interview: Pick<Interview, 'outcomeHistory'> | null | undefined,
  entry: Omit<InterviewOutcomeEntry, 'id'>,
): InterviewOutcomeEntry[] {
  const prev = Array.isArray(interview?.outcomeHistory)
    ? (interview!.outcomeHistory as InterviewOutcomeEntry[])
    : []
  return [
    ...prev.map((row) => ({
      at: row.at,
      actor: row.actor,
      action: row.action,
      reason: row.reason || undefined,
      note: row.note || undefined,
      id: row.id,
    })),
    {
      at: entry.at,
      actor: entry.actor,
      action: entry.action,
      reason: entry.reason,
      note: entry.note,
    },
  ]
}

export function formatOutcomeActor(actor: string | null | undefined): string {
  switch (actor) {
    case 'candidate':
      return 'Candidate'
    case 'moderator':
      return 'Moderator'
    case 'employer':
      return 'Employer'
    case 'system':
      return 'System'
    default:
      return 'Unknown'
  }
}

export function formatOutcomeAction(action: string | null | undefined): string {
  switch (action) {
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'cancelled':
      return 'Cancelled'
    case 'accepted':
      return 'Accepted'
    case 'completed':
      return 'Completed'
    default:
      return action || 'Updated'
  }
}
