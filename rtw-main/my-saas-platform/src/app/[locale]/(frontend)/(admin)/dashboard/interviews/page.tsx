import { getLocale } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getCandidateInterviews } from '@/lib/payload/interviews'
import { CandidateInterviewsPage } from '@/components/candidate/interviews/CandidateInterviewsPage'

export const dynamic = 'force-dynamic'

export default async function InterviewsPage() {
  const userType = await getCurrentUserType()
  const locale = await getLocale()

  if (!userType) {
    await redirectToLogin(locale)
    throw new Error('Redirect')
  }

  if (userType.kind !== 'candidate' && userType.kind !== 'admin') {
    await redirectToDashboard(locale)
    throw new Error('Redirect')
  }

  if (userType.kind === 'admin') {
    await redirectToDashboard(locale)
    throw new Error('Redirect')
  }

  const candidate = userType.candidate

  // Only fetch non-pending interviews (candidates only see approved interviews)
  // excludePending is the default behavior, so no need to pass it
  const interviews = await getCandidateInterviews(candidate.id)

  return <CandidateInterviewsPage candidate={candidate} interviews={interviews} />
}

