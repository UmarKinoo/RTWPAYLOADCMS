import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { JobPosting } from '@/payload-types'

export interface JobPostingListItem {
  id: number
  title: string
  description?: string
  jobType: string
  salaryMin?: number
  salaryMax?: number
  status: string
  applicationsCount: number
  clicksCount: number
  expiresAt?: string
  createdAt: string
  updatedAt: string
}

async function fetchJobPostings(
  employerId: number,
  filters?: {
    status?: string
  },
): Promise<JobPostingListItem[]> {
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

  const result = await payload.find({
    collection: 'job-postings',
    where,
    sort: '-createdAt',
    limit: 100,
    overrideAccess: true,
  })

  return result.docs.map((posting) => ({
    id: posting.id,
    title: posting.title,
    description: posting.description || undefined,
    jobType: posting.jobType,
    salaryMin: posting.salaryMin || undefined,
    salaryMax: posting.salaryMax || undefined,
    status: posting.status,
    applicationsCount: posting.applicationsCount || 0,
    clicksCount: posting.clicksCount || 0,
    expiresAt: posting.expiresAt || undefined,
    createdAt: posting.createdAt,
    updatedAt: posting.updatedAt,
  }))
}

export const getJobPostings = (employerId: number, filters?: {
  status?: string
}) =>
  unstable_cache(
    async () => fetchJobPostings(employerId, filters),
    ['job-postings', String(employerId), JSON.stringify(filters || {})],
    {
      tags: [`employer:${employerId}`, 'job-postings'],
      revalidate: 60,
    },
  )()






