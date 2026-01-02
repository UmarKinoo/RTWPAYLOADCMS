// This file is no longer needed - Suspense is now in the page component
// Keeping for backwards compatibility but it just passes through
'use client'

import { CandidateDashboardContent } from './CandidateDashboardContent'
import type { Candidate } from '@/payload-types'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'

interface CandidateDashboardWrapperProps {
  candidate: Candidate
  unreadNotificationsCount?: number
  notifications?: CandidateNotification[]
}

export function CandidateDashboardWrapper(props: CandidateDashboardWrapperProps) {
  // Just pass through - Suspense is handled at page level
  return <CandidateDashboardContent {...props} />
}

