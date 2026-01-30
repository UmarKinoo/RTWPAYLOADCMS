'use client'

import React, { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { EmployerDashboardSidebar } from './EmployerDashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { StatisticsChart } from './StatisticsChart'
import { SubscriptionCard } from './SubscriptionCard'
import { NotificationsView } from './NotificationsView'
import { SettingsView } from './SettingsView'
import { CandidatesToReviewView } from './CandidatesToReviewView'
import { ScheduledInterviewsView } from './ScheduledInterviewsView'
import { PendingRequestsView } from './PendingRequestsView'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { BottomNav } from '@/components/homepage/BottomNav'
import type { Employer, Purchase } from '@/payload-types'
import type { StatisticsDataPoint } from '@/lib/payload/employer-dashboard'
import type { NotificationListItem } from '@/lib/payload/notifications'
import type { CandidateToReview, ScheduledInterview, PendingInterviewRequest } from '@/lib/payload/employer-views'

interface EmployerDashboardClientProps {
  employer: Employer
  employerId: number
  initialStatistics: StatisticsDataPoint[]
  initialPeriod: 'week' | 'month' | 'year'
  unreadNotificationsCount: number
  notifications: NotificationListItem[]
  candidatesToReview: CandidateToReview[]
  scheduledInterviews: ScheduledInterview[]
  pendingRequests: PendingInterviewRequest[]
  statsCards: React.ReactNode
  scheduleSidebar: React.ReactNode
  recentlySearchedCandidates: React.ReactNode
  recentPurchase: Purchase | null
}

export function EmployerDashboardClient({
  employer,
  employerId,
  initialStatistics,
  initialPeriod,
  unreadNotificationsCount,
  notifications,
  candidatesToReview,
  scheduledInterviews,
  pendingRequests,
  statsCards,
  scheduleSidebar,
  recentlySearchedCandidates,
  recentPurchase,
}: EmployerDashboardClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'dashboard'
  const t = useTranslations('employerDashboard')

  return (
    <div className="relative min-h-screen bg-[#f5f5f5] overflow-x-hidden">
      {/* Mobile Menu Button */}
      <div className="fixed left-4 top-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-11 w-11 bg-white shadow-md border-2 border-gray-200"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <EmployerDashboardSidebar unreadNotificationsCount={unreadNotificationsCount} />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-full max-w-[280px] sm:w-[320px] p-0 flex flex-col overflow-hidden z-[110]">
          <VisuallyHidden>
            <SheetTitle>{t('navMenuTitle')}</SheetTitle>
          </VisuallyHidden>
          <EmployerDashboardSidebar mobile onClose={() => setMobileMenuOpen(false)} unreadNotificationsCount={unreadNotificationsCount} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="px-4 pt-16 pb-20 md:pb-8 sm:px-6 lg:ml-[220px] lg:pt-6 lg:pr-6">
        {/* Header Section */}
        <DashboardHeader
          employer={employer}
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />

        {/* Content Area - Show different views based on currentView */}
        {currentView === 'notifications' ? (
          <NotificationsView employer={employer} notifications={notifications} />
        ) : currentView === 'settings' ? (
          <SettingsView employer={employer} />
        ) : currentView === 'candidates-to-review' ? (
          <CandidatesToReviewView candidates={candidatesToReview} />
        ) : currentView === 'interviews' ? (
          <ScheduledInterviewsView interviews={scheduledInterviews} />
        ) : currentView === 'pending-requests' ? (
          <PendingRequestsView requests={pendingRequests} />
        ) : (
          <>
            {/* Main Grid */}
            <div className="mt-4 sm:mt-6 flex flex-col gap-3 sm:gap-4 xl:flex-row">
              {/* Left Column - Stats Cards and Chart */}
              <div className="flex flex-1 flex-col gap-3 sm:gap-4">
                {statsCards}
                <StatisticsChart
                  employerId={employerId}
                  initialData={initialStatistics}
                  initialPeriod={initialPeriod}
                />
              </div>

              {/* Right Column - Schedule and Subscription */}
              <div className="flex w-full flex-col gap-3 sm:gap-4 xl:w-[340px]">
                {scheduleSidebar}
                <SubscriptionCard employer={employer} recentPurchase={recentPurchase} />
              </div>
            </div>

            {/* Recently Searched Candidates */}
            <div className="mt-4">
              {recentlySearchedCandidates}
            </div>
          </>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav employer={employer} />
    </div>
  )
}

