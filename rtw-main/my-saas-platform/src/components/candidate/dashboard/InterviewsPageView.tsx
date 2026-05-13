'use client'

import { useState } from 'react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { CandidateInterviewsPage } from '@/components/candidate/interviews/CandidateInterviewsPage'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { BottomNav } from '@/components/homepage/BottomNav'
import { Menu } from 'lucide-react'
import type { InterviewListItem } from '@/lib/payload/interviews'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'

interface InterviewsPageViewProps {
  candidate: Candidate
  interviews: InterviewListItem[]
  unreadNotificationsCount?: number
  notifications?: CandidateNotification[]
}

export function InterviewsPageView({
  candidate,
  interviews,
  unreadNotificationsCount = 0,
  notifications = [],
}: InterviewsPageViewProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f5f5f5]">
      <div className="fixed left-4 top-4 z-40 lg:hidden">
        <Button
          variant="outline"
          size="icon"
          onClick={() => setMobileMenuOpen(true)}
          className="h-11 w-11 border-2 border-gray-200 bg-white shadow-md"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      <div className="hidden lg:block">
        <DashboardSidebar unreadNotificationsCount={unreadNotificationsCount} />
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="z-[110] flex w-full max-w-[280px] flex-col overflow-hidden p-0 sm:w-[320px]">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <DashboardSidebar
            mobile
            onClose={() => setMobileMenuOpen(false)}
            unreadNotificationsCount={unreadNotificationsCount}
          />
        </SheetContent>
      </Sheet>

      <div className="px-4 pb-20 pt-16 sm:px-6 md:pb-8 lg:ml-[220px] lg:pr-6 lg:pt-6">
        <DashboardHeader
          candidate={candidate}
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />
        <CandidateInterviewsPage
          candidate={candidate}
          interviews={interviews}
          embedded
        />
      </div>

      <BottomNav candidate={candidate} />
    </div>
  )
}
