'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
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
import { ProfileCompletenessCard } from './dashboard/ResumeQualityWidget'
import { IncompleteProfileBanner } from './dashboard/IncompleteProfileBanner'
import { ProfileStrengthDock } from './dashboard/ProfileStrengthDock'
import { ResumeUploadSection } from './dashboard/ResumeUploadSection'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { VisuallyHidden } from '@/components/ui/visually-hidden'
import { Button } from '@/components/ui/button'
import { Menu } from 'lucide-react'
import { BottomNav } from '@/components/homepage/BottomNav'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'
import { ProfileModerationBanner } from './dashboard/ProfileModerationBanner'
import { getProfileCompleteness } from '@/lib/candidates/profile-completeness'
import { cn } from '@/lib/utils'

interface CandidateDashboardContentProps {
  candidate: Candidate
  unreadNotificationsCount?: number
  notifications?: CandidateNotification[]
}

export function CandidateDashboardContent({
  candidate: initialCandidate,
  unreadNotificationsCount = 0,
  notifications = [],
}: CandidateDashboardContentProps) {
  const t = useTranslations('candidateDashboard')
  const searchParams = useSearchParams()
  const [candidate, setCandidate] = useState(initialCandidate)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [strengthSheetOpen, setStrengthSheetOpen] = useState(false)

  const { missing: missingProfileFields } = getProfileCompleteness(candidate)
  const showStrengthDock = missingProfileFields.length > 0

  const handleUpdate = (updatedData: Partial<Candidate>) => {
    setCandidate((prev) => ({ ...prev, ...updatedData } as Candidate))
  }

  // Welcome email / deep links: open profile strength sheet or scroll to hash section
  useEffect(() => {
    const scrollToId = (id: string) => {
      const el = document.getElementById(id)
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' })
        return true
      }
      return false
    }

    const hash = typeof window !== 'undefined' ? window.location.hash.replace(/^#/, '') : ''
    const wantsComplete = searchParams.get('complete') === '1'

    const timer = window.setTimeout(() => {
      if (wantsComplete) {
        setStrengthSheetOpen(true)
        return
      }
      if (hash) scrollToId(hash)
    }, 150)

    return () => window.clearTimeout(timer)
  }, [searchParams])

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
        <SheetContent
          side="left"
          className="w-full max-w-[280px] sm:w-[320px] p-0 flex flex-col overflow-hidden z-[110]"
        >
          <VisuallyHidden>
            <SheetTitle>{t('navMenuTitle')}</SheetTitle>
          </VisuallyHidden>
          <DashboardSidebar
            mobile
            onClose={() => setMobileMenuOpen(false)}
            unreadNotificationsCount={unreadNotificationsCount}
          />
        </SheetContent>
      </Sheet>

      {/* Main Content */}
      <div className={cn('px-4 pt-16 sm:px-6 lg:ml-[220px] lg:pr-6 lg:pt-6', showStrengthDock ? 'pb-32 md:pb-8' : 'pb-20 md:pb-8')}>
        <DashboardHeader
          candidate={candidate}
          unreadNotificationsCount={unreadNotificationsCount}
          notifications={notifications}
        />

        <ProfileModerationBanner candidate={candidate} />
        <IncompleteProfileBanner
          candidate={candidate}
          onOpenChecklist={() => setStrengthSheetOpen(true)}
        />

        <div className="mt-4 sm:mt-6 flex flex-col gap-4 xl:flex-row">
          <div className="flex flex-1 flex-col gap-3 sm:gap-4">
            <ProfileSection candidate={candidate} onUpdate={handleUpdate} />
            <PersonalInfoSection candidate={candidate} onUpdate={handleUpdate} />
            <ProfessionalSkillsSection candidate={candidate} onUpdate={handleUpdate} />
            <WorkExperienceSection candidate={candidate} onUpdate={handleUpdate} />
            <AboutMeSection candidate={candidate} onUpdate={handleUpdate} />
            <EducationSection candidate={candidate} onUpdate={handleUpdate} />
            <VisaStatusSection candidate={candidate} onUpdate={handleUpdate} />
            <LanguagesSection candidate={candidate} onUpdate={handleUpdate} />
            <JobPreferencesSection candidate={candidate} onUpdate={handleUpdate} />
            <JobBenefitsSection candidate={candidate} onUpdate={handleUpdate} />
          </div>

          <div className="flex w-full flex-col gap-3 sm:gap-4 xl:w-[340px]">
            <ProfileCompletenessCard candidate={candidate} />
            <ResumeUploadSection candidate={candidate} onUpdate={handleUpdate} />
          </div>
        </div>
      </div>

      <BottomNav candidate={candidate} />

      <ProfileStrengthDock
        candidate={candidate}
        open={strengthSheetOpen}
        onOpenChange={setStrengthSheetOpen}
      />
    </div>
  )
}
