import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getCurrentUserType } from '@/lib/currentUserType'
import { SettingsView } from '@/components/candidate/dashboard/SettingsView'
import { getUnreadNotificationCount } from '@/lib/payload/candidate-notifications'

export const dynamic = 'force-dynamic'

type SettingsPageProps = {
  params: Promise<{ locale: string }>
}

export default async function SettingsPage({ params }: SettingsPageProps) {
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
    const unreadNotificationsCount = await getUnreadNotificationCount(candidate.id).catch(() => 0)

    return (
      <Suspense fallback={
        <div className="min-h-screen bg-[#f5f5f5] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4644b8] mx-auto mb-4"></div>
            <p className="text-[#16252d]">Loading settings...</p>
          </div>
        </div>
      }>
        <SettingsView
          candidate={candidate}
          unreadNotificationsCount={unreadNotificationsCount}
        />
      </Suspense>
    )
  } catch (error: any) {
    if (error?.digest?.startsWith('NEXT_REDIRECT')) {
      throw error
    }
    console.error('Settings page error:', error)
    redirect(`/${locale}/login`)
  }
}

