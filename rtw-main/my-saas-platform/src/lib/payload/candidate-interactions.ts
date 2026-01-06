import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { CandidateInteraction } from '@/payload-types'

export interface InteractionListItem {
  id: number
  candidate: {
    id: number
    firstName: string
    lastName: string
    jobTitle: string
  }
  interactionType: string
  metadata?: any
  createdAt: string
}

async function fetchInteractions(
  employerId: number,
  filters?: {
    interactionType?: string
    fromDate?: string
    toDate?: string
  },
): Promise<InteractionListItem[]> {
  const payload = await getPayload({ config: configPromise })

  const where: any = {
    employer: {
      equals: employerId,
    },
  }

  if (filters?.interactionType) {
    where.interactionType = {
      equals: filters.interactionType,
    }
  }

  if (filters?.fromDate || filters?.toDate) {
    where.createdAt = {}
    if (filters.fromDate) {
      where.createdAt.greater_than_equal = filters.fromDate
    }
    if (filters.toDate) {
      where.createdAt.less_than_equal = filters.toDate
    }
  }

  const result = await payload.find({
    collection: 'candidate-interactions',
    where,
    sort: '-createdAt',
    limit: 100,
    depth: 1, // Populate candidate
    overrideAccess: true,
  })

  return result.docs.map((interaction) => {
    const candidate =
      typeof interaction.candidate === 'object' ? interaction.candidate : null

    return {
      id: interaction.id,
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
      interactionType: interaction.interactionType,
      metadata: interaction.metadata || undefined,
      createdAt: interaction.createdAt,
    }
  })
}

async function fetchStatistics(
  employerId: number,
  period: 'week' | 'month' | 'year',
): Promise<{
  views: number
  interviewed: number
  declined: number
  total: number
}> {
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

  let views = 0
  let interviewed = 0
  let declined = 0

  interactions.docs.forEach((interaction) => {
    if (interaction.interactionType === 'view') {
      views++
    } else if (interaction.interactionType === 'interviewed') {
      interviewed++
    } else if (interaction.interactionType === 'declined') {
      declined++
    }
  })

  return {
    views,
    interviewed,
    declined,
    total: interactions.totalDocs,
  }
}

export const getInteractions = (employerId: number, filters?: {
  interactionType?: string
  fromDate?: string
  toDate?: string
}) =>
  unstable_cache(
    async () => fetchInteractions(employerId, filters),
    ['interactions', String(employerId), JSON.stringify(filters || {})],
    {
      tags: [`employer:${employerId}`, 'candidate-interactions'],
      revalidate: 60,
    },
  )()

export const getStatistics = (employerId: number, period: 'week' | 'month' | 'year') =>
  unstable_cache(
    async () => fetchStatistics(employerId, period),
    ['interaction-statistics', String(employerId), period],
    {
      tags: [`employer:${employerId}`, 'candidate-interactions'],
      revalidate: 60,
    },
  )()







