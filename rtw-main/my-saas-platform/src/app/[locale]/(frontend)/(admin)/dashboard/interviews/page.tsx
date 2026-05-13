import { Suspense } from 'react'
import { getCurrentUserType } from '@/lib/currentUserType'
import { redirectToLogin, redirectToDashboard } from '@/lib/redirects'
import { getCandidateInterviews } from '@/lib/payload/interviews'
import { InterviewsPageView } from '@/components/candidate/dashboard/InterviewsPageView'
import {
  getUnreadNotificationCount,
  getCandidateNotifications,
} from '@/lib/payload/candidate-notifications'

export const dynamic = 'force-dynamic'

type InterviewsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function InterviewsPage({ params }: InterviewsPageProps) {
  const { locale } = await params
  try {
    const userType = await getCurrentUserType()

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

    const [interviews, unreadCount, notifications] = await Promise.all([
      getCandidateInterviews(candidate.id),
      getUnreadNotificationCount(candidate.id).catch(() => 0),
      getCandidateNotifications(candidate.id).catch(() => []),
    ])

    return (
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#f5f5f5]">
            <div className="text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-[#4644b8]" />
              <p className="text-[#16252d]">Loading...</p>
            </div>
          </div>
        }
      >
        <InterviewsPageView
          candidate={candidate}
          interviews={interviews}
          unreadNotificationsCount={unreadCount}
          notifications={notifications}
        />
      </Suspense>
    )
  } catch (error: unknown) {
    const err = error as { digest?: string }
    if (err?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Interviews page error:', error)
    await redirectToLogin(locale)
  }
}
