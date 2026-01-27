import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUserType } from '@/lib/currentUserType'
import { CandidateDashboardContent } from '@/components/candidate/CandidateDashboardContent'
import { getUnreadNotificationCount, getCandidateNotifications } from '@/lib/payload/candidate-notifications'

export const dynamic = 'force-dynamic'

type DashboardProps = {
  params: Promise<{ locale: string }>
}

export default async function Dashboard({ params }: DashboardProps) {
  const { locale } = await params
  const timestamp = process.env.NODE_ENV === 'development' ? new Date().toISOString() : ''
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DASHBOARD ${timestamp}] Page render started`)
  }
  try {
    const userType = await getCurrentUserType()
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DASHBOARD ${timestamp}] User type:`, userType ? userType.kind : 'null', userType ? { id: userType.user?.id, email: userType.user?.email } : 'no user')
    }

    if (!userType) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DASHBOARD ${timestamp}] No user type, redirecting to /login`)
      }
      redirect(`/${locale}/login`)
    }

    // Route based on user type
    if (userType.kind === 'candidate') {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[DASHBOARD ${timestamp}] Rendering candidate dashboard`)
      }
      const candidate = userType.candidate

      // Fetch notifications for header dropdown; Activity is on its own route
      const [unreadResult, notificationsResult] = await Promise.allSettled([
        getUnreadNotificationCount(candidate.id),
        getCandidateNotifications(candidate.id),
      ])

      const unreadNotificationsCount = unreadResult.status === 'fulfilled' ? unreadResult.value : 0
      const notifications = notificationsResult.status === 'fulfilled' ? notificationsResult.value : []

      return (
        <Suspense fallback={
          <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4644b8] mx-auto mb-4"></div>
              <p className="text-[#16252d]">Loading dashboard...</p>
            </div>
          </div>
        }>
          <CandidateDashboardContent
            candidate={candidate}
            unreadNotificationsCount={unreadNotificationsCount}
            notifications={notifications}
          />
        </Suspense>
      )
    }

  if (userType.kind === 'employer') {
    // Redirect to employer dashboard
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DASHBOARD ${timestamp}] Employer detected, redirecting to /employer/dashboard`)
    }
    redirect(`/${locale}/employer/dashboard`)
  }

  if (userType.kind === 'admin') {
    // Admin users - redirect to admin dashboard or show admin view
    // For now, redirect to a placeholder - you may want to create an admin dashboard
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DASHBOARD ${timestamp}] Admin detected, redirecting to /admin/interviews/pending`)
    }
    redirect(`/${locale}/admin/interviews/pending`)
  }

    // Unknown user type, redirect to login
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DASHBOARD ${timestamp}] Unknown user type:`, userType.kind, 'redirecting to /login')
    }
    redirect(`/${locale}/login`)
  } catch (error: any) {
    // Next.js redirects work by throwing a special error - re-throw it
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    // Only log actual errors, not redirects
    console.error(`[DASHBOARD ${timestamp}] Error:`, error)
    redirect(`/${locale}/login`)
  }
}
