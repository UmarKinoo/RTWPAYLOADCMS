'use client'

import React, { useState } from 'react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { NotificationsView } from './NotificationsView'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { BottomNav } from '@/components/homepage/BottomNav'
import { Menu } from 'lucide-react'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'

interface NotificationsPageViewProps {
  candidate: Candidate
  unreadNotificationsCount?: number
  notifications?: CandidateNotification[]
}

export function NotificationsPageView({
  candidate: initialCandidate,
  unreadNotificationsCount = 0,
  notifications = [],
}: NotificationsPageViewProps) {
  const [candidate, setCandidate] = useState(initialCandidate)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="relative min-h-screen bg-[#f5f5f5] overflow-x-hidden">
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

      <div className="hidden lg:block">
        <DashboardSidebar unreadNotificationsCount={unreadNotificationsCount} />
      </div>

      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-full max-w-[280px] sm:w-[320px] p-0 flex flex-col overflow-hidden z-[110]">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <DashboardSidebar mobile onClose={() => setMobileMenuOpen(false)} unreadNotificationsCount={unreadNotificationsCount} />
        </SheetContent>
      </Sheet>

      <div className="px-4 pb-20 md:pb-8 pt-16 sm:px-6 lg:ml-[220px] lg:pr-6 lg:pt-6">
        <DashboardHeader
          candidate={candidate}
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />
        <NotificationsView candidate={candidate} notifications={notifications} />
      </div>

      <BottomNav candidate={candidate} />
    </div>
  )
}
