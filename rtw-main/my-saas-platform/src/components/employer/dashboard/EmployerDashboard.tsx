import React, { Suspense } from 'react'
import { EmployerDashboardClient } from './EmployerDashboardClient'
import { StatsCards } from './StatsCards'
import { ScheduleSidebar } from './ScheduleSidebar'
import { RecentCandidatesTable } from './RecentCandidatesTable'
import { RecentlySearchedCandidates } from './RecentlySearchedCandidates'
import { getEmployerStatistics } from '@/lib/payload/employer-dashboard'
import { getUnreadCount, getNotifications } from '@/lib/payload/notifications'
import type { Employer } from '@/payload-types'

interface EmployerDashboardProps {
  employer: Employer
}

export async function EmployerDashboard({ employer }: EmployerDashboardProps) {
  const employerId = typeof employer.id === 'number' ? employer.id : Number(employer.id)

  // Fetch dashboard data in parallel with error handling
  const [statisticsResult, unreadResult, notificationsResult] = await Promise.allSettled([
    getEmployerStatistics(employerId, 'week'),
    getUnreadCount(employerId),
    getNotifications(employerId, { read: undefined }), // Get all notifications
  ])

  const statisticsData = statisticsResult.status === 'fulfilled' ? statisticsResult.value : []
  const unreadCount = unreadResult.status === 'fulfilled' ? unreadResult.value : 0
  const notifications = notificationsResult.status === 'fulfilled' ? notificationsResult.value : []

  // Log errors but don't block rendering
  if (statisticsResult.status === 'rejected') {
    console.error('Error fetching employer statistics:', statisticsResult.reason)
  }
  if (unreadResult.status === 'rejected') {
    console.error('Error fetching unread count:', unreadResult.reason)
  }
  if (notificationsResult.status === 'rejected') {
    console.error('Error fetching notifications:', notificationsResult.reason)
  }

  return (
    <EmployerDashboardClient
      employer={employer}
      employerId={employerId}
      initialStatistics={statisticsData}
      initialPeriod="week"
      unreadNotificationsCount={unreadCount}
      notifications={notifications}
      statsCards={
        <Suspense fallback={<div className="h-32 animate-pulse bg-gray-200 rounded-2xl" />}>
          <StatsCards employerId={employerId} />
        </Suspense>
      }
      scheduleSidebar={
        <Suspense fallback={<div className="h-[344px] animate-pulse bg-gray-200 rounded-2xl" />}>
          <ScheduleSidebar employerId={employerId} />
        </Suspense>
      }
      recentCandidatesTable={
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 rounded-2xl" />}>
          <RecentCandidatesTable employerId={employerId} />
        </Suspense>
      }
      recentlySearchedCandidates={
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 rounded-2xl" />}>
          <RecentlySearchedCandidates employerId={employerId} />
        </Suspense>
      }
    />
  )
}
