import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Candidate, Interview } from '@/payload-types'

export interface CandidateToReview {
  id: number
  firstName: string
  lastName: string
  jobTitle: string
  location: string
  experienceYears: number
  nationality: string
  profilePictureUrl: string | null
  billingClass: string | null
  primarySkill?: {
    id: number
    name: string
  }
}

export interface ScheduledInterview {
  id: number
  candidate: {
    id: number
    firstName: string
    lastName: string
    jobTitle: string
    profilePictureUrl: string | null
  }
  scheduledAt: string
  duration: number
  meetingLink?: string
  notes?: string
  jobPosition?: string
  jobLocation?: string
  salary?: string
}

export interface PendingInterviewRequest {
  id: number
  candidate: {
    id: number
    firstName: string
    lastName: string
    jobTitle: string
    profilePictureUrl: string | null
  }
  requestedAt: string
  jobPosition?: string
  jobLocation?: string
  salary?: string
  accommodationIncluded: boolean
  transportation: boolean
}

async function fetchCandidatesToReview(employerId: number): Promise<CandidateToReview[]> {
  const payload = await getPayload({ config: configPromise })

  // Get all candidates who accepted terms
  const allCandidates = await payload.find({
    collection: 'candidates',
    where: {
      termsAccepted: {
        equals: true,
      },
    },
    limit: 1000,
    depth: 1, // Populate profilePicture and primarySkill
    overrideAccess: true,
  })

  // Get all interactions for this employer
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

  // Get IDs of candidates that have been interacted with
  const interactedCandidateIds = new Set(
    interactions.docs.map((i) =>
      typeof i.candidate === 'object' ? i.candidate.id : i.candidate,
    ),
  )

  // Filter to candidates not yet interacted with
  const candidatesToReview = allCandidates.docs
    .filter((c) => !interactedCandidateIds.has(c.id))
    .map((candidate) => {
      const profilePictureUrl =
        candidate.profilePicture && typeof candidate.profilePicture === 'object'
          ? candidate.profilePicture.url || null
          : null

      const primarySkill =
        candidate.primarySkill && typeof candidate.primarySkill === 'object'
          ? {
              id: candidate.primarySkill.id,
              name: candidate.primarySkill.name || '',
            }
          : undefined

      return {
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        jobTitle: candidate.jobTitle,
        location: candidate.location,
        experienceYears: candidate.experienceYears,
        nationality: candidate.nationality,
        profilePictureUrl,
        billingClass: candidate.billingClass || null,
        primarySkill,
      }
    })

  return candidatesToReview
}

async function fetchScheduledInterviews(employerId: number): Promise<ScheduledInterview[]> {
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
    limit: 100,
    depth: 2, // Populate candidate and profilePicture
    overrideAccess: true,
  })

  return interviews.docs.map((interview) => {
    const candidate =
      typeof interview.candidate === 'object' ? interview.candidate : null

    const profilePictureUrl =
      candidate?.profilePicture && typeof candidate.profilePicture === 'object'
        ? candidate.profilePicture.url || null
        : null

    return {
      id: interview.id,
      candidate: candidate
        ? {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            jobTitle: candidate.jobTitle || '',
            profilePictureUrl,
          }
        : {
            id: 0,
            firstName: 'Unknown',
            lastName: '',
            jobTitle: '',
            profilePictureUrl: null,
          },
      scheduledAt: interview.scheduledAt,
      duration: interview.duration,
      meetingLink: interview.meetingLink || undefined,
      notes: interview.notes || undefined,
      jobPosition: interview.jobPosition || undefined,
      jobLocation: interview.jobLocation || undefined,
      salary: interview.salary || undefined,
    }
  })
}

async function fetchPendingInterviewRequests(employerId: number): Promise<PendingInterviewRequest[]> {
  const payload = await getPayload({ config: configPromise })

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
            equals: 'pending',
          },
        },
      ],
    },
    sort: '-requestedAt',
    limit: 100,
    depth: 2, // Populate candidate and profilePicture
    overrideAccess: true,
  })

  return interviews.docs.map((interview) => {
    const candidate =
      typeof interview.candidate === 'object' ? interview.candidate : null

    const profilePictureUrl =
      candidate?.profilePicture && typeof candidate.profilePicture === 'object'
        ? candidate.profilePicture.url || null
        : null

    return {
      id: interview.id,
      candidate: candidate
        ? {
            id: candidate.id,
            firstName: candidate.firstName,
            lastName: candidate.lastName,
            jobTitle: candidate.jobTitle || '',
            profilePictureUrl,
          }
        : {
            id: 0,
            firstName: 'Unknown',
            lastName: '',
            jobTitle: '',
            profilePictureUrl: null,
          },
      requestedAt: interview.requestedAt || interview.createdAt,
      jobPosition: interview.jobPosition || undefined,
      jobLocation: interview.jobLocation || undefined,
      salary: interview.salary || undefined,
      accommodationIncluded: interview.accommodationIncluded || false,
      transportation: interview.transportation || false,
    }
  })
}

export const getCandidatesToReview = (employerId: number) =>
  unstable_cache(
    async () => fetchCandidatesToReview(employerId),
    ['candidates-to-review', String(employerId)],
    {
      tags: [`employer:${employerId}`, 'candidates', 'candidate-interactions'],
      revalidate: 60,
    },
  )()

export const getScheduledInterviews = (employerId: number) =>
  unstable_cache(
    async () => fetchScheduledInterviews(employerId),
    ['scheduled-interviews', String(employerId)],
    {
      tags: [`employer:${employerId}`, 'interviews'],
      revalidate: 30,
    },
  )()

export const getPendingInterviewRequests = (employerId: number) =>
  unstable_cache(
    async () => fetchPendingInterviewRequests(employerId),
    ['pending-interview-requests', String(employerId)],
    {
      tags: [`employer:${employerId}`, 'interviews'],
      revalidate: 30,
    },
  )()

