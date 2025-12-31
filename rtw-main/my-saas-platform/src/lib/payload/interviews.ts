import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Interview, Candidate, Employer } from '@/payload-types'

export interface InterviewListItem {
  id: number
  employer: {
    id: number
    companyName: string
  }
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
  jobPosition?: string
  jobLocation?: string
  salary?: string
  accommodationIncluded?: boolean
  transportation?: boolean
  createdAt: string
  updatedAt: string
}

async function fetchInterviews(
  employerId: number,
  filters?: {
    status?: string
    fromDate?: string
    toDate?: string
  },
): Promise<InterviewListItem[]> {
  const payload = await getPayload({ config: configPromise })

  const where: any = {
    employer: {
      equals: employerId,
    },
  }

  if (filters?.status) {
    where.status = {
      equals: filters.status,
    }
  }

  if (filters?.fromDate || filters?.toDate) {
    where.scheduledAt = {}
    if (filters.fromDate) {
      where.scheduledAt.greater_than_equal = filters.fromDate
    }
    if (filters.toDate) {
      where.scheduledAt.less_than_equal = filters.toDate
    }
  }

  const result = await payload.find({
    collection: 'interviews',
    where,
    sort: '-scheduledAt',
    limit: 100,
    depth: 2, // Populate employer and candidate
    overrideAccess: true,
  })

  return result.docs.map((interview) => {
    const employer =
      typeof interview.employer === 'object' ? interview.employer : null
    const candidate =
      typeof interview.candidate === 'object' ? interview.candidate : null

    return {
      id: interview.id,
      employer: employer
        ? {
            id: employer.id,
            companyName: employer.companyName || '',
          }
        : {
            id: 0,
            companyName: 'Unknown',
          },
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
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    }
  })
}

async function fetchInterviewById(id: number): Promise<InterviewListItem | null> {
  const payload = await getPayload({ config: configPromise })

  try {
    const interview = await payload.findByID({
      collection: 'interviews',
      id,
      depth: 2,
      overrideAccess: true,
    })

    const employer =
      typeof interview.employer === 'object' ? interview.employer : null
    const candidate =
      typeof interview.candidate === 'object' ? interview.candidate : null

    return {
      id: interview.id,
      employer: employer
        ? {
            id: employer.id,
            companyName: employer.companyName || '',
          }
        : {
            id: 0,
            companyName: 'Unknown',
          },
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
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    }
  } catch {
    return null
  }
}

async function fetchTodaysInterviews(employerId: number): Promise<InterviewListItem[]> {
  const payload = await getPayload({ config: configPromise })

  const now = new Date()
  const startOfDay = new Date(now.setHours(0, 0, 0, 0))
  const endOfDay = new Date(now.setHours(23, 59, 59, 999))

  const result = await payload.find({
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
            greater_than_equal: startOfDay.toISOString(),
          },
        },
        {
          scheduledAt: {
            less_than_equal: endOfDay.toISOString(),
          },
        },
      ],
    },
    sort: 'scheduledAt',
    limit: 10,
    depth: 2,
    overrideAccess: true,
  })

  return result.docs.map((interview) => {
    const employer =
      typeof interview.employer === 'object' ? interview.employer : null
    const candidate =
      typeof interview.candidate === 'object' ? interview.candidate : null

    return {
      id: interview.id,
      employer: employer
        ? {
            id: employer.id,
            companyName: employer.companyName || '',
          }
        : {
            id: 0,
            companyName: 'Unknown',
          },
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
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    }
  })
}

export const getInterviews = (employerId: number, filters?: {
  status?: string
  fromDate?: string
  toDate?: string
}) =>
  unstable_cache(
    async () => fetchInterviews(employerId, filters),
    ['interviews', String(employerId), JSON.stringify(filters || {})],
    {
      tags: [`employer:${employerId}`, 'interviews'],
      revalidate: 60,
    },
  )()

export const getInterviewById = (id: number) =>
  unstable_cache(async () => fetchInterviewById(id), ['interview', String(id)], {
    tags: [`interview:${id}`, 'interviews'],
    revalidate: 60,
  })()

export const getTodaysInterviews = (employerId: number) =>
  unstable_cache(
    async () => fetchTodaysInterviews(employerId),
    ['todays-interviews', String(employerId)],
    {
      tags: [`employer:${employerId}`, 'interviews'],
      revalidate: 30,
    },
  )()

async function fetchCandidateInterviews(
  candidateId: number,
  filters?: {
    status?: string
    fromDate?: string
    toDate?: string
    excludePending?: boolean
  },
): Promise<InterviewListItem[]> {
  const payload = await getPayload({ config: configPromise })

  const where: any = {
    candidate: {
      equals: candidateId,
    },
  }

  // Exclude pending interviews by default (candidates only see approved interviews)
  if (filters?.excludePending !== false) {
    where.status = {
      not_equals: 'pending',
    }
  }

  if (filters?.status) {
    where.status = {
      equals: filters.status,
    }
  }

  if (filters?.fromDate || filters?.toDate) {
    where.scheduledAt = {}
    if (filters.fromDate) {
      where.scheduledAt.greater_than_equal = filters.fromDate
    }
    if (filters.toDate) {
      where.scheduledAt.less_than_equal = filters.toDate
    }
  }

  const result = await payload.find({
    collection: 'interviews',
    where,
    sort: '-scheduledAt',
    limit: 100,
    depth: 2, // Populate employer and candidate
    overrideAccess: true,
  })

  return result.docs.map((interview) => {
    const employer =
      typeof interview.employer === 'object' ? interview.employer : null
    const candidate =
      typeof interview.candidate === 'object' ? interview.candidate : null

    return {
      id: interview.id,
      employer: employer
        ? {
            id: employer.id,
            companyName: employer.companyName || '',
          }
        : {
            id: 0,
            companyName: 'Unknown',
          },
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
      jobPosition: interview.jobPosition || undefined,
      jobLocation: interview.jobLocation || undefined,
      salary: interview.salary || undefined,
      accommodationIncluded: interview.accommodationIncluded || undefined,
      transportation: interview.transportation || undefined,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
    }
  })
}

export const getCandidateInterviews = (candidateId: number, filters?: {
  status?: string
  fromDate?: string
  toDate?: string
}) =>
  unstable_cache(
    async () => fetchCandidateInterviews(candidateId, filters),
    ['candidate-interviews', String(candidateId), JSON.stringify(filters || {})],
    {
      tags: [`candidate:${candidateId}`, 'interviews'],
      revalidate: 60,
    },
  )()

