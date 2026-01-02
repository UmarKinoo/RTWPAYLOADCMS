import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

export interface EmployerStats {
  candidatesToReview: number
  notificationsCount: number
  interviewsCount: number
  pendingInterviewRequestsCount: number
}

export interface StatisticsDataPoint {
  date: string
  views: number
  interviewed: number
  declined: number
}

export interface UpcomingInterview {
  id: number
  candidate: {
    id: number
    firstName: string
    lastName: string
    jobTitle: string
  }
  scheduledAt: string
  duration: number
  status: string
  meetingLink?: string
  notes?: string
}

async function fetchEmployerStats(employerId: number): Promise<EmployerStats> {
  const payload = await getPayload({ config: configPromise })

  // Get candidates to review (candidates not yet interacted with)
  const allCandidates = await payload.find({
    collection: 'candidates',
    limit: 1000,
    where: {
      termsAccepted: {
        equals: true,
      },
    },
    overrideAccess: true,
  })

  const interactions = await payload.find({
    collection: 'candidate-interactions',
    where: {
      employer: {
        equals: employerId,
      },
    },
    limit: 10000,
    overrideAccess: true,
  })

  const interactedCandidateIds = new Set(
    interactions.docs.map((i) =>
      typeof i.candidate === 'object' ? i.candidate.id : i.candidate,
    ),
  )

  const candidatesToReview = allCandidates.docs.filter(
    (c) => !interactedCandidateIds.has(c.id),
  ).length

  // Get unread notifications count
  const notifications = await payload.find({
    collection: 'notifications',
    where: {
      and: [
        {
          employer: {
            equals: employerId,
          },
        },
        {
          read: {
            equals: false,
          },
        },
      ],
    },
    limit: 1000,
    overrideAccess: true,
  })

  // Get upcoming interviews count
  const now = new Date()
  const interviews = await payload.find({
    collection: 'interviews',
    where: {
      and: [
        {
          employer: {
            equals: employerId,
          },
        },
        {
          status: {
            equals: 'scheduled',
          },
        },
        {
          scheduledAt: {
            greater_than: now.toISOString(),
          },
        },
      ],
    },
    limit: 1000,
    overrideAccess: true,
  })

  // Get pending interview requests count
  const pendingInterviews = await payload.find({
    collection: 'interviews',
    where: {
      and: [
        {
          employer: {
            equals: employerId,
          },
        },
        {
          status: {
            equals: 'pending',
          },
        },
      ],
    },
    limit: 1000,
    overrideAccess: true,
  })

  return {
    candidatesToReview,
    notificationsCount: notifications.totalDocs,
    interviewsCount: interviews.totalDocs,
    pendingInterviewRequestsCount: pendingInterviews.totalDocs,
  }
}

async function fetchEmployerStatistics(
  employerId: number,
  period: 'week' | 'month' | 'year',
): Promise<StatisticsDataPoint[]> {
  const payload = await getPayload({ config: configPromise })

  const now = new Date()
  let startDate: Date

  switch (period) {
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      break
    case 'month':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
      break
    case 'year':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
      break
  }

  // Get all interactions in the period
  const interactions = await payload.find({
    collection: 'candidate-interactions',
    where: {
      and: [
        {
          employer: {
            equals: employerId,
          },
        },
        {
          createdAt: {
            greater_than: startDate.toISOString(),
          },
        },
      ],
    },
    limit: 10000,
    overrideAccess: true,
  })

  // Group by date
  const dataMap = new Map<string, { views: number; interviewed: number; declined: number }>()

  interactions.docs.forEach((interaction) => {
    const date = new Date(interaction.createdAt).toISOString().split('T')[0]
    if (!dataMap.has(date)) {
      dataMap.set(date, { views: 0, interviewed: 0, declined: 0 })
    }
    const data = dataMap.get(date)!
    if (interaction.interactionType === 'view') {
      data.views++
    } else if (interaction.interactionType === 'interviewed') {
      data.interviewed++
    } else if (interaction.interactionType === 'declined') {
      data.declined++
    }
  })

  // Convert to array and sort by date
  const dataPoints: StatisticsDataPoint[] = Array.from(dataMap.entries())
    .map(([date, data]) => ({
      date,
      views: data.views,
      interviewed: data.interviewed,
      declined: data.declined,
    }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Fill in missing dates with zeros if needed (for week view)
  if (period === 'week') {
    const filled: StatisticsDataPoint[] = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startDate)
      date.setDate(date.getDate() + i)
      const dateStr = date.toISOString().split('T')[0]
      const existing = dataPoints.find((d) => d.date === dateStr)
      filled.push(
        existing || {
          date: dateStr,
          views: 0,
          interviewed: 0,
          declined: 0,
        },
      )
    }
    return filled
  }

  return dataPoints
}

export interface RecentCandidateSearch {
  id: number
  candidate: {
    id: number
    firstName: string
    lastName: string
    jobTitle?: string
    location?: string
    profilePicture?: any
  }
  interactionType: string
  createdAt: string
}

async function fetchRecentCandidateSearches(
  employerId: number,
  limit: number = 5,
): Promise<RecentCandidateSearch[]> {
  const payload = await getPayload({ config: configPromise })

  // Get recent 'view' interactions (searches/views)
  const interactions = await payload.find({
    collection: 'candidate-interactions',
    where: {
      and: [
        {
          employer: {
            equals: employerId,
          },
        },
        {
          interactionType: {
            equals: 'view',
          },
        },
      ],
    },
    sort: '-createdAt',
    limit,
    depth: 1, // Populate candidate
    overrideAccess: true,
  })

  // Get unique candidates (most recent view per candidate)
  const candidateMap = new Map<number, RecentCandidateSearch>()

  interactions.docs.forEach((interaction) => {
    const candidate =
      typeof interaction.candidate === 'object' ? interaction.candidate : null

    if (!candidate) return

    const candidateId = candidate.id

    // Only keep the most recent interaction per candidate
    if (!candidateMap.has(candidateId)) {
      candidateMap.set(candidateId, {
        id: interaction.id,
        candidate: {
          id: candidate.id,
          firstName: candidate.firstName || '',
          lastName: candidate.lastName || '',
          jobTitle: candidate.jobTitle || undefined,
          location: candidate.location || undefined,
          profilePicture: candidate.profilePicture || undefined,
        },
        interactionType: interaction.interactionType,
        createdAt: interaction.createdAt,
      })
    }
  })

  // Return sorted by most recent
  return Array.from(candidateMap.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export const getRecentCandidateSearches = (employerId: number, limit: number = 5) =>
  unstable_cache(
    async () => fetchRecentCandidateSearches(employerId, limit),
    ['recent-candidate-searches', String(employerId), String(limit)],
    {
      tags: [`employer:${employerId}`, 'candidate-interactions'],
      revalidate: 60,
    },
  )()

async function fetchUpcomingInterviews(
  employerId: number,
  limit: number = 10,
): Promise<UpcomingInterview[]> {
  const payload = await getPayload({ config: configPromise })

  const now = new Date()
  const interviews = await payload.find({
    collection: 'interviews',
    where: {
      and: [
        {
          employer: {
            equals: employerId,
          },
        },
        {
          status: {
            equals: 'scheduled',
          },
        },
        {
          scheduledAt: {
            greater_than: now.toISOString(),
          },
        },
      ],
    },
    sort: 'scheduledAt',
    limit,
    depth: 2, // Populate candidate
    overrideAccess: true,
  })

  return interviews.docs.map((interview) => {
    const candidate =
      typeof interview.candidate === 'object' ? interview.candidate : null
    return {
      id: interview.id,
      candidate: candidate
        ? {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            jobTitle: candidate.jobTitle,
          }
        : {
            id: 0,
            firstName: 'Unknown',
            lastName: '',
            jobTitle: '',
          },
      scheduledAt: interview.scheduledAt,
      duration: interview.duration,
      status: interview.status,
      meetingLink: interview.meetingLink || undefined,
      notes: interview.notes || undefined,
    }
  })
}

export const getEmployerStats = (employerId: number) =>
  unstable_cache(
    async () => fetchEmployerStats(employerId),
    ['employer-stats', String(employerId)],
    {
      tags: [`employer:${employerId}`, 'candidate-interactions', 'notifications', 'interviews'],
      revalidate: 60,
    },
  )()

export const getEmployerStatistics = (employerId: number, period: 'week' | 'month' | 'year') =>
  unstable_cache(
    async () => fetchEmployerStatistics(employerId, period),
    ['employer-statistics', String(employerId), period],
    {
      tags: [`employer:${employerId}`, 'candidate-interactions'],
      revalidate: 60,
    },
  )()

export const getUpcomingInterviews = (employerId: number, limit: number = 10) =>
  unstable_cache(
    async () => fetchUpcomingInterviews(employerId, limit),
    ['upcoming-interviews', String(employerId), String(limit)],
    {
      tags: [`employer:${employerId}`, 'interviews'],
      revalidate: 30,
    },
  )()



