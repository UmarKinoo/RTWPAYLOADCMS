import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import { getCurrentUserType } from '@/lib/currentUserType'
import {
  redirectToLogin,
  redirectToAdmin,
  redirectToModeratorPanel,
  redirectToEmployerDashboard,
  redirectToNoAccess,
} from '@/lib/redirects'
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
        console.log(`[DASHBOARD ${timestamp}] No user type, redirecting to login`)
      }
      await redirectToLogin(locale)
      throw new Error('Redirect')
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

      const t = await getTranslations('candidateDashboard')
      return (
        <Suspense fallback={
          <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4644b8] mx-auto mb-4"></div>
              <p className="text-[#16252d]">{t('loadingDashboard')}</p>
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
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DASHBOARD ${timestamp}] Employer detected, redirecting to employer dashboard`)
    }
    await redirectToEmployerDashboard(locale)
  }

  if (userType.kind === 'admin') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DASHBOARD ${timestamp}] Admin/blog-editor detected, redirecting to Payload /admin`)
    }
    await redirectToAdmin()
  }
  if (userType.kind === 'moderator') {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[DASHBOARD ${timestamp}] Moderator detected, redirecting to moderator panel`)
    }
    await redirectToModeratorPanel(locale)
  }

    // Unknown: authenticated but unauthorized — send to no-access (no login ↔ dashboard loop)
    if (process.env.NODE_ENV === 'development') {
      console.warn(`[DASHBOARD ${timestamp}] Unknown user type:`, userType.kind, 'redirecting to no-access')
    }
    await redirectToNoAccess(locale)
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'digest' in error && String((error as { digest?: string }).digest).startsWith('NEXT_REDIRECT')) {
      throw error
    }
    console.error(`[DASHBOARD ${timestamp}] Error:`, error)
    await redirectToLogin(locale)
  }
}
