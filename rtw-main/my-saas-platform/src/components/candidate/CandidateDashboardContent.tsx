'use client'

import React, { useState } from 'react'
import type { Candidate } from '@/payload-types'
import { DashboardSidebar } from './dashboard/DashboardSidebar'
import { DashboardHeader } from './dashboard/DashboardHeader'
import { ProfileSection } from './dashboard/ProfileSection'
import { PersonalInfoSection } from './dashboard/PersonalInfoSection'
import { ProfessionalSkillsSection } from './dashboard/ProfessionalSkillsSection'
import { WorkExperienceSection } from './dashboard/WorkExperienceSection'
import { AboutMeSection } from './dashboard/AboutMeSection'
import { EducationSection } from './dashboard/EducationSection'
import { VisaStatusSection } from './dashboard/VisaStatusSection'
import { LanguagesSection } from './dashboard/LanguagesSection'
import { JobPreferencesSection } from './dashboard/JobPreferencesSection'
import { JobBenefitsSection } from './dashboard/JobBenefitsSection'
import { ResumeQualityWidget } from './dashboard/ResumeQualityWidget'
import { ResumeUploadSection } from './dashboard/ResumeUploadSection'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { BottomNav } from '@/components/homepage/BottomNav'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'

interface CandidateDashboardContentProps {
  candidate: Candidate
  unreadNotificationsCount?: number
  notifications?: CandidateNotification[]
}

export function CandidateDashboardContent({ candidate: initialCandidate, unreadNotificationsCount = 0, notifications = [] }: CandidateDashboardContentProps) {
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
        {/* Header Section */}
        <DashboardHeader 
          candidate={candidate} 
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />

        {/* Content Area - Dashboard overview (Activity & Notifications are separate routes) */}
        <div className="mt-4 sm:mt-6 flex flex-col gap-4 xl:flex-row">
            {/* Left Column - Main Content */}
            <div className="flex flex-1 flex-col gap-3 sm:gap-4">
              {/* Profile Section */}
              <ProfileSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Personal Information */}
              <PersonalInfoSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Professional Skills */}
              <ProfessionalSkillsSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Work Experience */}
              <WorkExperienceSection candidate={candidate} onUpdate={handleUpdate} />

              {/* About Me */}
              <AboutMeSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Education */}
              <EducationSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Visa Status */}
              <VisaStatusSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Languages */}
              <LanguagesSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Job Preferences */}
              <JobPreferencesSection candidate={candidate} onUpdate={handleUpdate} />

              {/* Preferred Job Benefits */}
              <JobBenefitsSection candidate={candidate} onUpdate={handleUpdate} />
            </div>

            {/* Right Column - Widgets */}
            <div className="flex w-full flex-col gap-3 sm:gap-4 xl:w-[340px]">
              {/* Resume Quality Widget */}
              <ResumeQualityWidget candidate={candidate} />

              {/* Resume Upload Section */}
              <ResumeUploadSection candidate={candidate} onUpdate={handleUpdate} />
            </div>
          </div>
      </div>

      {/* Bottom Navigation */}
      <BottomNav candidate={candidate} />
    </div>
  )
}

