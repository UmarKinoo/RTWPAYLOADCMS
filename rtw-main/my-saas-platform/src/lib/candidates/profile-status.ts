/**
 * Candidate profile moderation — visibility on the public website.
 * Separate from ReadyBot screeningStatus (AI data completion).
 */

export const CANDIDATE_PROFILE_STATUSES = [
  'pending_review',
  'approved',
  'rejected',
  'needs_changes',
] as const

export type CandidateProfileStatus = (typeof CANDIDATE_PROFILE_STATUSES)[number]

export const MODERATION_QUEUE_STATUSES: CandidateProfileStatus[] = [
  'pending_review',
  'needs_changes',
]

export const DEFAULT_PROFILE_STATUS: CandidateProfileStatus = 'pending_review'

export const CANDIDATES_PER_PAGE = 9

/** Payload `where` for public candidate listings */
export function publicCandidateWhere() {
  return {
    termsAccepted: { equals: true as const },
    profileStatus: { equals: 'approved' as const },
  }
}

/** Merge extra clauses with public visibility rules */
export function publicCandidateAndWhere(clauses: Record<string, unknown>[]) {
  return {
    and: [
      { termsAccepted: { equals: true } },
      { profileStatus: { equals: 'approved' } },
      ...clauses,
    ],
  }
}

/** Candidates ready for moderator review */
export function moderationQueueWhere() {
  return {
    and: [
      { termsAccepted: { equals: true } },
      { phoneVerified: { equals: true } },
      { profileStatus: { in: MODERATION_QUEUE_STATUSES } },
    ],
  }
}

export function isInModerationQueue(status: string | null | undefined): boolean {
  return MODERATION_QUEUE_STATUSES.includes(status as CandidateProfileStatus)
}

export function profileStatusLabel(status: string | null | undefined): string {
  switch (status) {
    case 'pending_review':
      return 'Pending review'
    case 'approved':
      return 'Approved'
    case 'rejected':
      return 'Rejected'
    case 'needs_changes':
      return 'Needs changes'
    default:
      return status || 'Unknown'
  }
}
