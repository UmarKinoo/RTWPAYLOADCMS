import { redirect } from 'next/navigation'
import { getCurrentUserType } from '@/lib/currentUserType'
import { getCandidateInterviews } from '@/lib/payload/interviews'
import { CandidateInterviewsPage } from '@/components/candidate/interviews/CandidateInterviewsPage'

export const dynamic = 'force-dynamic'

export default async function InterviewsPage() {
  const userType = await getCurrentUserType()

  if (!userType) {
    redirect('/login')
  }

  // Allow candidates and admins (admin can view candidate pages)
  if (userType.kind !== 'candidate' && userType.kind !== 'admin') {
    redirect('/dashboard')
  }

  // If admin, we need to handle differently - for now, redirect to dashboard
  // In the future, you might want to allow admin to view specific candidate interviews
  if (userType.kind === 'admin') {
    redirect('/dashboard')
  }

  const candidate = userType.candidate

  // Only fetch non-pending interviews (candidates only see approved interviews)
  // excludePending is the default behavior, so no need to pass it
  const interviews = await getCandidateInterviews(candidate.id)

  return <CandidateInterviewsPage candidate={candidate} interviews={interviews} />
}

