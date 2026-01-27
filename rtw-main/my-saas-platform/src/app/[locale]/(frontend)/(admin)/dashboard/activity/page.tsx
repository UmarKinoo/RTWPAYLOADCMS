import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUserType } from '@/lib/currentUserType'
import { ActivityPageView } from '@/components/candidate/dashboard/ActivityPageView'
import { getUnreadNotificationCount, getCandidateNotifications } from '@/lib/payload/candidate-notifications'
import { getCandidateActivity } from '@/lib/payload/candidate-activity'

export const dynamic = 'force-dynamic'

type ActivityPageProps = {
  params: Promise<{ locale: string }>
}

export default async function ActivityPage({ params }: ActivityPageProps) {
  const { locale } = await params
  try {
    const userType = await getCurrentUserType()

    if (!userType) {
      redirect(`/${locale}/login`)
    }

    if (userType.kind !== 'candidate') {
      redirect(`/${locale}/dashboard`)
    }

    const candidate = userType.candidate
    const [unreadCount, notifications, activities] = await Promise.all([
      getUnreadNotificationCount(candidate.id).catch(() => 0),
      getCandidateNotifications(candidate.id).catch(() => []),
      getCandidateActivity(candidate.id).catch(() => []),
    ])

    return (
      <Suspense
        fallback={
          <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4644b8] mx-auto mb-4"></div>
              <p className="text-[#16252d]">Loading...</p>
            </div>
          </div>
        }
      >
        <ActivityPageView
          candidate={candidate}
          unreadNotificationsCount={unreadCount}
          notifications={notifications}
          activities={activities}
        />
      </Suspense>
    )
  } catch (error: unknown) {
    const err = error as { digest?: string }
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Activity page error:', error)
    redirect(`/${locale}/login`)
  }
}
