'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Interview } from '@/payload-types'

export interface ScheduleInterviewData {
  candidateId: number
  scheduledAt: string
  duration: number
  meetingLink?: string
  notes?: string
}

export interface RequestInterviewData {
  candidateId: number
  scheduledAt: string
  jobPosition: string
  jobLocation: string
  salary: string
  accommodationIncluded: boolean
  transportation: boolean
}

export interface RequestInterviewResponse {
  success: boolean
  error?: string
  interview?: Interview
}

export interface ScheduleInterviewResponse {
  success: boolean
  error?: string
  interview?: Interview
}

export interface UpdateInterviewData {
  scheduledAt?: string
  duration?: number
  status?: 'scheduled' | 'completed' | 'cancelled' | 'no_show'
  meetingLink?: string
  notes?: string
}

export interface UpdateInterviewResponse {
  success: boolean
  error?: string
  interview?: Interview
}

/**
 * Schedule a new interview
 */
export async function scheduleInterview(
  data: ScheduleInterviewData,
): Promise<ScheduleInterviewResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Check if employer has interview credits
    const employer = await payload.findByID({
      collection: 'employers',
      id: user.id,
      depth: 0,
    })

    if ((employer.wallet?.interviewCredits || 0) <= 0) {
      return { success: false, error: 'Insufficient interview credits.' }
    }

    // Create interview
    const interview = await payload.create({
      collection: 'interviews',
      data: {
        employer: user.id,
        candidate: data.candidateId,
        scheduledAt: data.scheduledAt,
        duration: data.duration,
        meetingLink: data.meetingLink,
        notes: data.notes,
        status: 'scheduled',
      },
    }) as Interview

    // Deduct interview credit
    await payload.update({
      collection: 'employers',
      id: user.id,
      data: {
        wallet: {
          interviewCredits: Math.max(0, (employer.wallet?.interviewCredits || 0) - 1),
          contactUnlockCredits: employer.wallet?.contactUnlockCredits || 0,
        },
      },
    })

    // Create notification
    const candidate = await payload.findByID({
      collection: 'candidates',
      id: data.candidateId,
      depth: 0,
    })

    await payload.create({
      collection: 'notifications',
      data: {
        employer: user.id,
        type: 'interview_scheduled',
        title: 'Interview Scheduled',
        message: `Interview scheduled with ${candidate.firstName} ${candidate.lastName} on ${new Date(data.scheduledAt).toLocaleString()}`,
        read: false,
        actionUrl: `/employer/dashboard/interviews/${interview.id}`,
      },
    })

    // Revalidate cache
    revalidatePath('/employer/dashboard')
    revalidateTag(`employer:${user.id}`)
    revalidateTag('interviews')

    return { success: true, interview }
  } catch (error: any) {
    console.error('Error scheduling interview:', error)
    return { success: false, error: error.message || 'Failed to schedule interview.' }
  }
}

/**
 * Update interview details
 */
export async function updateInterview(
  id: number,
  data: UpdateInterviewData,
): Promise<UpdateInterviewResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Verify interview belongs to employer
    const interview = await payload.findByID({
      collection: 'interviews',
      id,
      depth: 0,
    })

    const employerId = typeof interview.employer === 'object' ? interview.employer.id : interview.employer
    if (employerId !== user.id) {
      return { success: false, error: 'Unauthorized.' }
    }

    // Update interview
    const updated = await payload.update({
      collection: 'interviews',
      id,
      data: data as any,
    }) as Interview

    // Revalidate cache
    revalidatePath('/employer/dashboard')
    revalidateTag(`employer:${user.id}`)
    revalidateTag(`interview:${id}`)
    revalidateTag('interviews')

    return { success: true, interview: updated }
  } catch (error: any) {
    console.error('Error updating interview:', error)
    return { success: false, error: error.message || 'Failed to update interview.' }
  }
}

/**
 * Cancel an interview
 */
export async function cancelInterview(id: number): Promise<UpdateInterviewResponse> {
  return updateInterview(id, { status: 'cancelled' })
}

/**
 * Mark interview as completed
 */
export async function completeInterview(id: number): Promise<UpdateInterviewResponse> {
  return updateInterview(id, { status: 'completed' })
}

/**
 * Request a new interview (creates pending request)
 */
export async function requestInterview(
  data: RequestInterviewData,
): Promise<RequestInterviewResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Get candidate info
    const candidate = await payload.findByID({
      collection: 'candidates',
      id: data.candidateId,
      depth: 0,
    })

    if (!candidate) {
      return { success: false, error: 'Candidate not found.' }
    }

    // Create interview with pending status
    const interview = await payload.create({
      collection: 'interviews',
      data: {
        employer: user.id,
        candidate: data.candidateId,
        scheduledAt: data.scheduledAt,
        duration: 30, // Default duration, can be updated on approval
        status: 'pending',
        requestedAt: new Date().toISOString(),
        jobPosition: data.jobPosition,
        jobLocation: data.jobLocation,
        salary: data.salary,
        accommodationIncluded: data.accommodationIncluded,
        transportation: data.transportation,
      },
    }) as Interview

    // NOTE: Candidate notification is NOT sent here - candidates only receive notifications after admin approval
    // The notification will be sent in approveInterviewRequest function

    // Create interaction record
    await payload.create({
      collection: 'candidate-interactions',
      data: {
        employer: user.id,
        candidate: data.candidateId,
        interactionType: 'interview_requested',
        metadata: {
          interviewId: interview.id,
        },
      },
    })

    // Revalidate cache
    revalidatePath('/employer/dashboard')
    revalidatePath('/candidate/dashboard')
    revalidateTag(`employer:${user.id}`)
    revalidateTag(`candidate:${data.candidateId}`)
    revalidateTag('interviews')

    return { success: true, interview }
  } catch (error: any) {
    console.error('Error requesting interview:', error)
    return { success: false, error: error.message || 'Failed to request interview.' }
  }
}



