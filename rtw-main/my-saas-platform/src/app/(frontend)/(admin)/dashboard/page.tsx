import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentCandidate } from '@/lib/candidate'
import { getCurrentEmployer } from '@/lib/employer'
import { CandidateDashboard } from '@/components/candidate/CandidateDashboard'
import { getUser } from '@/lib/auth'
import { getUnreadNotificationCount, getCandidateNotifications } from '@/lib/payload/candidate-notifications'

export const dynamic = 'force-dynamic'

export default async function Dashboard() {
  // Check if user is authenticated first
  const user = await getUser()
  
  if (!user) {
    redirect('/login')
  }

  // Determine user type based on collection
  const userCollection = user.collection

  // Route based on user type
  if (userCollection === 'candidates') {
    const candidate = await getCurrentCandidate()

    // SECURITY: If candidate exists, verify it belongs to the authenticated user
    if (candidate) {
      // Double-check email matches (additional security layer)
      if (candidate.email !== user.email) {
        console.error('SECURITY ALERT: Dashboard access denied - email mismatch', {
          candidateEmail: candidate.email,
          userEmail: user.email,
          candidateId: candidate.id,
          userId: user.id,
        })
        redirect('/login')
      }
    }

    // If user exists but no candidate profile, redirect to registration
    if (!candidate) {
      redirect('/register')
    }

    // Fetch notifications data
    const [unreadNotificationsCount, notifications] = await Promise.all([
      getUnreadNotificationCount(candidate.id),
      getCandidateNotifications(candidate.id),
    ])

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <CandidateDashboard
          candidate={candidate}
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />
      </Suspense>
    )
  } else if (userCollection === 'employers') {
    const employer = await getCurrentEmployer()

    // SECURITY: If employer exists, verify it belongs to the authenticated user
    if (employer) {
      // Double-check email matches (additional security layer)
      if (employer.email !== user.email) {
        console.error('SECURITY ALERT: Dashboard access denied - email mismatch', {
          employerEmail: employer.email,
          userEmail: user.email,
          employerId: employer.id,
          userId: user.id,
        })
        redirect('/login')
      }
    }

    // If user exists but no employer profile, redirect to employer registration
    if (!employer) {
      redirect('/employer/register')
    }

    // Redirect to employer dashboard
    redirect('/employer/dashboard')
  } else {
    // Unknown user type, redirect to login
    console.warn('Unknown user collection:', userCollection)
    redirect('/login')
  }
}
