'use client'

import React from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Input } from '@/components/ui/input'
import { CandidateNotificationDropdown } from '@/components/candidate/notifications/CandidateNotificationDropdown'
import { AccountDropdown } from '@/components/shared/AccountDropdown'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'

interface DashboardHeaderProps {
  candidate: Candidate
  unreadNotificationsCount?: number
  notifications?: CandidateNotification[]
}

export function DashboardHeader({ candidate, unreadNotificationsCount = 0, notifications = [] }: DashboardHeaderProps) {
  const searchParams = useSearchParams()
  const currentView = searchParams.get('view') || 'dashboard'

  const getHeaderTitle = () => {
    if (currentView === 'notifications') {
      return 'Notifications'
    }
    return 'My Resume'
  }

  const getHeaderDescription = () => {
    if (currentView === 'notifications') {
      return 'View and manage your notifications'
    }
    return 'Updating your information will offer you the most relevant content'
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:rounded-2xl sm:p-6">
      {/* Left Section */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-xl font-semibold leading-normal text-[#282828] sm:text-2xl lg:text-[28px]">
          {getHeaderTitle()}
        </h1>
        <p className="text-xs font-normal leading-normal text-[#515151] lg:text-[12px]">
          {getHeaderDescription()}
        </p>
      </div>

      {/* Right Section */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        {/* Search Input */}
        <div className="relative w-full sm:w-[200px] lg:w-[320px]">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="h-10 w-full rounded-lg border border-[#ededed] bg-white pl-9 text-sm focus-visible:ring-offset-0"
          />
        </div>

        {/* Notification Dropdown */}
        <CandidateNotificationDropdown notifications={notifications} unreadCount={unreadNotificationsCount} />

        {/* Account Dropdown */}
        <AccountDropdown
          displayName={`${candidate.firstName} ${candidate.lastName}`}
          email={candidate.email}
          role="candidate"
          avatarSize="md"
          dashboardUrl="/dashboard"
        />
      </div>
    </div>
  )
}
