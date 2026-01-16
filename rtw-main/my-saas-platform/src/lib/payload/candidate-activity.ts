import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import { getCandidateInterviews } from './interviews'
import type { CandidateInteraction } from '@/payload-types'
import type { InterviewListItem } from './interviews'

export interface ActivityItem {
  id: string
  type: 'interview' | 'interaction'
  title: string
  description: string
  timestamp: string
  icon: string
  status?: string
  employer?: {
    id: number
    companyName: string
  }
  interview?: InterviewListItem
  interaction?: {
    id: number
    interactionType: string
    employer: {
      id: number
      companyName: string
    }
  }
}

async function fetchCandidateInteractions(
  candidateId: number,
): Promise<Array<{
  id: number
  interactionType: string
  employer: {
    id: number
    companyName: string
  }
  createdAt: string
}>> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'candidate-interactions',
    where: {
      candidate: {
        equals: candidateId,
      },
    },
    sort: '-createdAt',
    limit: 100,
    depth: 2, // Populate employer
    overrideAccess: true,
  })

  return result.docs.map((interaction) => {
    const employer =
      typeof interaction.employer === 'object' ? interaction.employer : null

    return {
      id: interaction.id,
      interactionType: interaction.interactionType,
      employer: employer
        ? {
            id: employer.id,
            companyName: employer.companyName || 'Unknown Company',
          }
        : {
            id: 0,
            companyName: 'Unknown Company',
          },
      createdAt: interaction.createdAt,
    }
  })
}

async function fetchCandidateActivity(
  candidateId: number,
): Promise<ActivityItem[]> {
  // Fetch both interviews and interactions in parallel
  const [interviews, interactions] = await Promise.all([
    getCandidateInterviews(candidateId, { excludePending: false }),
    fetchCandidateInteractions(candidateId),
  ])

  const activityItems: ActivityItem[] = []

  // Add interviews as activity items
  interviews.forEach((interview) => {
    const getInterviewIcon = (status: string) => {
      switch (status) {
        case 'scheduled':
          return '📅'
        case 'completed':
          return '✅'
        case 'cancelled':
          return '❌'
        case 'rejected':
          return '🚫'
        case 'pending':
          return '⏳'
        default:
          return '📋'
      }
    }

    const getInterviewTitle = (status: string, companyName: string) => {
      switch (status) {
        case 'scheduled':
          return `Interview Scheduled with ${companyName}`
        case 'completed':
          return `Interview Completed with ${companyName}`
        case 'cancelled':
          return `Interview Cancelled with ${companyName}`
        case 'rejected':
          return `Interview Rejected with ${companyName}`
        case 'pending':
          return `Interview Request from ${companyName}`
        default:
          return `Interview with ${companyName}`
      }
    }

    activityItems.push({
      id: `interview-${interview.id}`,
      type: 'interview',
      title: getInterviewTitle(interview.status, interview.employer.companyName),
      description: interview.jobPosition
        ? `Position: ${interview.jobPosition}${interview.jobLocation ? ` • Location: ${interview.jobLocation}` : ''}`
        : 'Interview details',
      timestamp: interview.scheduledAt || interview.createdAt,
      icon: getInterviewIcon(interview.status),
      status: interview.status,
      employer: interview.employer,
      interview,
    })
  })

  // Add interactions as activity items
  interactions.forEach((interaction) => {
    const getInteractionIcon = (type: string) => {
      switch (type) {
        case 'view':
          return '👁️'
        case 'interview_requested':
          return '📨'
        case 'contact_unlocked':
          return '🔓'
        case 'interviewed':
          return '💼'
        case 'declined':
          return '❌'
        default:
          return '📋'
      }
    }

    const getInteractionTitle = (type: string, companyName: string) => {
      switch (type) {
        case 'view':
          return `${companyName} viewed your profile`
        case 'interview_requested':
          return `Interview requested by ${companyName}`
        case 'contact_unlocked':
          return `${companyName} unlocked your contact information`
        case 'interviewed':
          return `Interviewed by ${companyName}`
        case 'declined':
          return `Declined by ${companyName}`
        default:
          return `Activity with ${companyName}`
      }
    }

    const getInteractionDescription = (type: string) => {
      switch (type) {
        case 'view':
          return 'Your profile was viewed by an employer'
        case 'interview_requested':
          return 'An employer has requested an interview with you'
        case 'contact_unlocked':
          return 'An employer has unlocked your contact information'
        case 'interviewed':
          return 'You were interviewed by an employer'
        case 'declined':
          return 'Your application was declined'
        default:
          return 'Activity update'
      }
    }

    activityItems.push({
      id: `interaction-${interaction.id}`,
      type: 'interaction',
      title: getInteractionTitle(interaction.interactionType, interaction.employer.companyName),
      description: getInteractionDescription(interaction.interactionType),
      timestamp: interaction.createdAt,
      icon: getInteractionIcon(interaction.interactionType),
      interaction: {
        id: interaction.id,
        interactionType: interaction.interactionType,
        employer: interaction.employer,
      },
    })
  })

  // Sort by timestamp (most recent first)
  activityItems.sort((a, b) => {
    return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  })

  return activityItems
}

export const getCandidateActivity = (candidateId: number) =>
  unstable_cache(
    async () => fetchCandidateActivity(candidateId),
    ['candidate-activity', String(candidateId)],
    {
      tags: [`candidate:${candidateId}`, 'candidate-interactions', 'interviews'],
      revalidate: 60,
    },
  )()

