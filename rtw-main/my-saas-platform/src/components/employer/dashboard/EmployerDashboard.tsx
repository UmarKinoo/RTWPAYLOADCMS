import React from 'react'
import { EmployerDashboardClient } from './EmployerDashboardClient'
import { StatsCards } from './StatsCards'
import { ScheduleSidebar } from './ScheduleSidebar'
import { RecentCandidatesTable } from './RecentCandidatesTable'
import { getEmployerStatistics } from '@/lib/payload/employer-dashboard'
import { getUnreadCount } from '@/lib/payload/notifications'
import type { Employer } from '@/payload-types'

interface EmployerDashboardProps {
  employer: Employer
}

export async function EmployerDashboard({ employer }: EmployerDashboardProps) {
  const employerId = typeof employer.id === 'number' ? employer.id : Number(employer.id)

  // Fetch dashboard data in parallel
  const [statisticsData, unreadCount] = await Promise.all([
    getEmployerStatistics(employerId, 'week'),
    getUnreadCount(employerId),
  ])

  return (
    <EmployerDashboardClient
      employer={employer}
      employerId={employerId}
      initialStatistics={statisticsData}
      initialPeriod="week"
      unreadNotificationsCount={unreadCount}
      statsCards={<StatsCards employerId={employerId} />}
      scheduleSidebar={<ScheduleSidebar employerId={employerId} />}
      recentCandidatesTable={<RecentCandidatesTable employerId={employerId} />}
    />
  )
}
