import { redirect } from 'next/navigation'
import { getCurrentCandidate } from '@/lib/candidate'
import { getUser } from '@/lib/auth'
import { getCandidateNotifications } from '@/lib/payload/candidate-notifications'
import { CandidateNotificationsPage } from '@/components/candidate/notifications/CandidateNotificationsPage'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
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

  const notifications = await getCandidateNotifications(candidate.id)

  return <CandidateNotificationsPage candidate={candidate} notifications={notifications} />
}

