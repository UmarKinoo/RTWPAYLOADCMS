'use client'

import React, { useState } from 'react'
import { EmployerDashboardSidebar } from './EmployerDashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { StatisticsChart } from './StatisticsChart'
import { SubscriptionCard } from './SubscriptionCard'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import type { Employer, Purchase } from '@/payload-types'
import type { StatisticsDataPoint } from '@/lib/payload/employer-dashboard'
import type { NotificationListItem } from '@/lib/payload/notifications'

interface EmployerDashboardClientProps {
  employer: Employer
  employerId: number
  initialStatistics: StatisticsDataPoint[]
  initialPeriod: 'week' | 'month' | 'year'
  unreadNotificationsCount: number
  notifications: NotificationListItem[]
  statsCards: React.ReactNode
  scheduleSidebar: React.ReactNode
  recentCandidatesTable: React.ReactNode
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
  statsCards,
  scheduleSidebar,
  recentCandidatesTable,
  recentlySearchedCandidates,
  recentPurchase,
}: EmployerDashboardClientProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen bg-[#f5f5f5]">
      {/* Mobile Menu Button */}
      <div className="fixed left-4 top-4 z-50 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-10 w-10 bg-white shadow-sm"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:block">
        <EmployerDashboardSidebar />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-[220px] p-0">
          <EmployerDashboardSidebar mobile onClose={() => setMobileMenuOpen(false)} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="px-4 pt-16 pb-8 sm:px-6 lg:ml-[220px] lg:pt-6 lg:pr-6">
        {/* Header Section */}
        <DashboardHeader
          employer={employer}
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />

        {/* Main Grid */}
        <div className="mt-6 flex flex-col gap-4 xl:flex-row">
          {/* Left Column - Stats Cards and Chart */}
          <div className="flex flex-1 flex-col gap-4">
            {statsCards}
            <StatisticsChart
              employerId={employerId}
              initialData={initialStatistics}
              initialPeriod={initialPeriod}
            />
          </div>

          {/* Right Column - Schedule and Subscription */}
          <div className="flex w-full flex-col gap-4 xl:w-[340px]">
            {scheduleSidebar}
            <SubscriptionCard employer={employer} recentPurchase={recentPurchase} />
          </div>
        </div>

        {/* Recent Candidates Table */}
        <div className="mt-4">
          {recentCandidatesTable}
        </div>

        {/* Recently Searched Candidates */}
        <div className="mt-4">
          {recentlySearchedCandidates}
        </div>
      </div>
    </div>
  )
}

