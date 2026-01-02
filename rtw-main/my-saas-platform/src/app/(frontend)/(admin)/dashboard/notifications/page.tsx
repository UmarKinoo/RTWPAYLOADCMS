import { redirect } from 'next/navigation'
import { getCurrentUserType } from '@/lib/currentUserType'
import { getCandidateNotifications } from '@/lib/payload/candidate-notifications'
import { CandidateNotificationsPage } from '@/components/candidate/notifications/CandidateNotificationsPage'

export const dynamic = 'force-dynamic'

export default async function NotificationsPage() {
  const userType = await getCurrentUserType()

  if (!userType) {
    redirect('/login')
  }

  // Allow candidates and admins (admin can view candidate pages)
  if (userType.kind !== 'candidate' && userType.kind !== 'admin') {
    redirect('/dashboard')
  }

  // If admin, redirect to dashboard (admin doesn't have candidate notifications)
  if (userType.kind === 'admin') {
    redirect('/dashboard')
  }

  const candidate = userType.candidate

  const notifications = await getCandidateNotifications(candidate.id)

  return <CandidateNotificationsPage candidate={candidate} notifications={notifications} />
}

