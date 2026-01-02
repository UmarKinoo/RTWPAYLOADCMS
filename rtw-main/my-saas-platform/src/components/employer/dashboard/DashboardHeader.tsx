'use client'

import React, { useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { EmployerNotificationDropdown } from '@/components/employer/notifications/EmployerNotificationDropdown'
import { AccountDropdown } from '@/components/shared/AccountDropdown'
import type { Employer } from '@/payload-types'
import type { NotificationListItem } from '@/lib/payload/notifications'
// Simple debounce implementation
function useDebounce<T extends (...args: any[]) => void>(callback: T, delay: number) {
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null)

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      const newTimeoutId = setTimeout(() => {
        callback(...args)
      }, delay)
      setTimeoutId(newTimeoutId)
    },
    [callback, delay, timeoutId],
  )
}

interface DashboardHeaderProps {
  employer: Employer
  unreadNotificationsCount: number
  notifications: NotificationListItem[]
}

function getDisplayName(employer: Employer): string {
  if (employer.companyName) return employer.companyName
  if (employer.responsiblePerson) return employer.responsiblePerson
  if (employer.email) return employer.email.split('@')[0]
  return 'Employer'
}

export function DashboardHeader({ employer, unreadNotificationsCount, notifications }: DashboardHeaderProps) {
  const displayName = getDisplayName(employer)
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  
  const interviewCredits = employer.wallet?.interviewCredits ?? 0
  const contactUnlockCredits = employer.wallet?.contactUnlockCredits ?? 0

  const handleSearch = useDebounce((query: string) => {
    if (query.trim()) {
      router.push(`/candidates?search=${encodeURIComponent(query)}`)
    }
  }, 500)

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setSearchQuery(value)
    handleSearch(value)
  }

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/candidates?search=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="flex flex-col gap-4 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:px-0 sm:py-1">
      {/* Left Section */}
      <div className="flex flex-col gap-0.5">
        <h1 className="text-2xl font-semibold leading-normal text-[#282828] sm:text-[28px]">
          Activity
        </h1>
        <p className="text-xs font-normal leading-normal text-[#515151] sm:text-sm">
          Updating your information will offer you the most relevant content
        </p>
      </div>

      {/* Right Section */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-4">
        {/* Search Bar */}
        <form
          onSubmit={handleSearchSubmit}
          className="order-last w-full sm:order-first sm:w-auto"
        >
          <div className="relative w-full sm:w-[240px] lg:w-[320px]">
            <Input
              type="search"
              placeholder="Search candidates..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="h-10 w-full rounded-lg border border-[#ededed] bg-white px-3 pr-10 text-base text-[#a5a5a5] sm:h-12"
            />
            <Search className="absolute right-3 top-1/2 size-5 -translate-y-1/2 text-[#222] sm:size-6" />
          </div>
        </form>

        {/* Candidate Button */}
        <Link href="/candidates">
          <Button
            variant="outline"
            className="h-10 gap-2 border border-[#282828] px-4 py-2 sm:h-12"
          >
            <span className="text-sm font-medium text-[#282828] sm:text-lg">Candidate</span>
          </Button>
        </Link>

        {/* Notification Dropdown */}
        <EmployerNotificationDropdown
          notifications={notifications}
          unreadCount={unreadNotificationsCount}
        />

        {/* Account Dropdown */}
        <AccountDropdown
          displayName={displayName}
          email={employer.email}
          role="employer"
          avatarSize="md"
          interviewCredits={interviewCredits}
          contactUnlockCredits={contactUnlockCredits}
          dashboardUrl="/employer/dashboard"
        />
      </div>
    </div>
  )
}
