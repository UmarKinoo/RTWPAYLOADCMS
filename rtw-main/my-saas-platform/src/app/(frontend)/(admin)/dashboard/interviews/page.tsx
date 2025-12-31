import { redirect } from 'next/navigation'
import { getCurrentCandidate } from '@/lib/candidate'
import { getUser } from '@/lib/auth'
import { getCandidateInterviews } from '@/lib/payload/interviews'
import { CandidateInterviewsPage } from '@/components/candidate/interviews/CandidateInterviewsPage'

export const dynamic = 'force-dynamic'

export default async function InterviewsPage() {
  const user = await getUser()

  if (!user) {
    redirect('/login')
  }

  if (user.collection !== 'candidates') {
    redirect('/dashboard')
  }

  const candidate = await getCurrentCandidate()

  if (!candidate) {
    redirect('/register')
  }

  // Verify email matches
  if (candidate.email !== user.email) {
    redirect('/login')
  }

  // Only fetch non-pending interviews (candidates only see approved interviews)
  const interviews = await getCandidateInterviews(candidate.id, { excludePending: true })

  return <CandidateInterviewsPage candidate={candidate} interviews={interviews} />
}

