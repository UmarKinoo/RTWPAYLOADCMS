import React, { Suspense } from 'react'
import { EmployerDashboardClient } from './EmployerDashboardClient'
import { StatsCards } from './StatsCards'
import { ScheduleSidebar } from './ScheduleSidebar'
import { RecentlySearchedCandidates } from './RecentlySearchedCandidates'
import { getEmployerStatistics } from '@/lib/payload/employer-dashboard'
import { getUnreadCount, getNotifications } from '@/lib/payload/notifications'
import { getCandidatesToReview, getScheduledInterviews, getPendingInterviewRequests } from '@/lib/payload/employer-views'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Employer, Purchase } from '@/payload-types'

interface EmployerDashboardProps {
  employer: Employer
}

export async function EmployerDashboard({ employer }: EmployerDashboardProps) {
  const employerId = typeof employer.id === 'number' ? employer.id : Number(employer.id)

  // Fetch dashboard data in parallel with error handling
  const [statisticsResult, unreadResult, notificationsResult, purchaseResult, candidatesToReviewResult, scheduledInterviewsResult, pendingRequestsResult] = await Promise.allSettled([
    getEmployerStatistics(employerId, 'week'),
    getUnreadCount(employerId),
    getNotifications(employerId, { read: undefined }), // Get all notifications
    // Fetch most recent active purchase
    (async () => {
      const payload = await getPayload({ config: configPromise })
      const purchases = await payload.find({
        collection: 'purchases',
        where: {
          and: [
            { employer: { equals: employerId } },
            { status: { equals: 'active' } },
          ],
        },
        sort: '-createdAt',
        limit: 1,
        depth: 1, // Populate plan relationship
      })
      return purchases.docs[0] || null
    })(),
    getCandidatesToReview(employerId),
    getScheduledInterviews(employerId),
    getPendingInterviewRequests(employerId),
  ])

  const statisticsData = statisticsResult.status === 'fulfilled' ? statisticsResult.value : []
  const unreadCount = unreadResult.status === 'fulfilled' ? unreadResult.value : 0
  const notifications = notificationsResult.status === 'fulfilled' ? notificationsResult.value : []
  const recentPurchase = purchaseResult.status === 'fulfilled' ? purchaseResult.value : null
  const candidatesToReview = candidatesToReviewResult.status === 'fulfilled' ? candidatesToReviewResult.value : []
  const scheduledInterviews = scheduledInterviewsResult.status === 'fulfilled' ? scheduledInterviewsResult.value : []
  const pendingRequests = pendingRequestsResult.status === 'fulfilled' ? pendingRequestsResult.value : []

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
  if (purchaseResult.status === 'rejected') {
    console.error('Error fetching purchase:', purchaseResult.reason)
  }
  if (candidatesToReviewResult.status === 'rejected') {
    console.error('Error fetching candidates to review:', candidatesToReviewResult.reason)
  }
  if (scheduledInterviewsResult.status === 'rejected') {
    console.error('Error fetching scheduled interviews:', scheduledInterviewsResult.reason)
  }
  if (pendingRequestsResult.status === 'rejected') {
    console.error('Error fetching pending requests:', pendingRequestsResult.reason)
  }

  return (
    <EmployerDashboardClient
      employer={employer}
      employerId={employerId}
      initialStatistics={statisticsData}
      initialPeriod="week"
      unreadNotificationsCount={unreadCount}
      notifications={notifications}
      candidatesToReview={candidatesToReview}
      scheduledInterviews={scheduledInterviews}
      pendingRequests={pendingRequests}
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
      recentlySearchedCandidates={
        <Suspense fallback={<div className="h-64 animate-pulse bg-gray-200 rounded-2xl" />}>
          <RecentlySearchedCandidates employerId={employerId} />
        </Suspense>
      }
      recentPurchase={recentPurchase}
    />
  )
}
