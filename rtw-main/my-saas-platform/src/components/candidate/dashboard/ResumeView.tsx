'use client'

import React, { useState } from 'react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { DashboardSidebar } from './DashboardSidebar'
import { DashboardHeader } from './DashboardHeader'
import { ResumeQualityWidget } from './ResumeQualityWidget'
import { ResumeUploadSection } from './ResumeUploadSection'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { BottomNav } from '@/components/homepage/BottomNav'
import { Menu } from 'lucide-react'

interface ResumeViewProps {
  candidate: Candidate
  unreadNotificationsCount?: number
  notifications?: Array<{ id: number; type: string; title: string; message: string; read: boolean; actionUrl?: string; createdAt: string }>
}

export function ResumeView({ candidate: initialCandidate, unreadNotificationsCount = 0, notifications = [] }: ResumeViewProps) {
  const [candidate, setCandidate] = useState(initialCandidate)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const handleUpdate = (updatedData: Partial<Candidate>) => {
    setCandidate((prev) => ({ ...prev, ...updatedData } as Candidate))
  }

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
        <DashboardSidebar unreadNotificationsCount={unreadNotificationsCount} />
      </div>

      {/* Mobile Sidebar Sheet */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="left" className="w-full max-w-[280px] sm:w-[320px] p-0 flex flex-col overflow-hidden z-[110]">
          <VisuallyHidden>
            <SheetTitle>Navigation Menu</SheetTitle>
          </VisuallyHidden>
          <DashboardSidebar mobile onClose={() => setMobileMenuOpen(false)} unreadNotificationsCount={unreadNotificationsCount} />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className="px-4 pb-20 md:pb-8 pt-16 sm:px-6 lg:ml-[220px] lg:pr-6 lg:pt-6">
        <DashboardHeader
          candidate={candidate}
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />

        {/* Resume Content — title lives in DashboardHeader above */}
        <div className="mt-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3 xl:gap-8">
            {/* Left: Resume Quality + tips */}
            <div className="xl:col-span-1 space-y-6">
              <ResumeQualityWidget candidate={candidate} />
            </div>

            {/* Right: Upload / manage resume */}
            <div className="xl:col-span-2">
              <ResumeUploadSection candidate={candidate} onUpdate={handleUpdate} />
            </div>
          </div>
        </div>
      </div>

      <BottomNav candidate={candidate} />
    </div>
  )
}
