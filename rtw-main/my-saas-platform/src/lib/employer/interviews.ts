'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Interview } from '@/payload-types'
import { canRequestInterview } from '@/lib/plan-access'

export interface RequestInterviewData {
  candidateId: number
  scheduledAt: string
  jobPosition: string
  jobLocation: string
  salary: string
  accommodationIncluded: boolean
  transportation: boolean
  notes?: string
}

export interface RequestInterviewResponse {
  success: boolean
  error?: string
  /** Machine-readable error code; client should send the employer to /pricing */
  code?: 'NO_CREDITS' | 'PLAN_EXPIRED'
  interview?: Interview
}

export interface InterviewCreditsStatus {
  isEmployer: boolean
  interviewCredits: number
  unlimited: boolean
  planExpiresAt: string | null
  planActive: boolean
  canRequest: boolean
  blockCode?: 'NO_CREDITS' | 'PLAN_EXPIRED'
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

// NOTE: the old `scheduleInterview` action (created interviews directly with
// status 'scheduled', bypassing moderator approval) was removed — all employer
// interview requests must go through `requestInterview` + moderation.

/**
 * Update interview details
 */
export async function updateInterview(
  id: number,
  data: UpdateInterviewData,
): Promise<UpdateInterviewResponse> {
  try {
    const payload = await getPayload({ config })
    const user = await getRequestAuthUser(payload)

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

    // Pending requests await moderator approval — employers may only cancel them,
    // never move them to scheduled/completed themselves
    if (interview.status === 'pending' && data.status && data.status !== 'cancelled') {
      return { success: false, error: 'This request is pending moderator approval and can only be cancelled.' }
    }

    // Update interview
    const updated = await payload.update({
      collection: 'interviews',
      id,
      data: data as any,
    }) as Interview

    // Refund the interview credit when a still-pending request is cancelled
    // (only if a credit was actually deducted — unlimited plans skip deduction)
    if (interview.status === 'pending' && data.status === 'cancelled' && interview.creditDeducted) {
      const employer = await payload.findByID({
        collection: 'employers',
        id: user.id,
        depth: 0,
      })
      await payload.update({
        collection: 'interviews',
        id,
        data: { creditDeducted: false },
      })
      await payload.update({
        collection: 'employers',
        id: user.id,
        data: {
          wallet: {
            interviewCredits: (employer.wallet?.interviewCredits || 0) + 1,
            contactUnlockCredits: employer.wallet?.contactUnlockCredits || 0,
          },
        },
      })
    }

    // Revalidate cache
    revalidatePath('/employer/dashboard', 'page')
    revalidateTag(`employer:${user.id}`, 'max')
    revalidateTag(`interview:${id}`, 'max')
    revalidateTag('interviews', 'max')

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
    const user = await getRequestAuthUser(payload)

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Load employer with active plan for expiry / unlimited checks
    const employer = await payload.findByID({
      collection: 'employers',
      id: user.id,
      depth: 1,
    })

    const access = canRequestInterview(employer)
    if (!access.allowed) {
      return {
        success: false,
        error: access.error,
        code: access.code,
      }
    }

    const deductCredit = !access.unlimited

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
        creditDeducted: deductCredit,
        jobPosition: data.jobPosition,
        jobLocation: data.jobLocation,
        salary: data.salary,
        accommodationIncluded: data.accommodationIncluded,
        transportation: data.transportation,
        notes: data.notes ?? undefined,
      },
    }) as Interview

    // Deduct one interview credit at send time (skipped for unlimited plans)
    if (deductCredit) {
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
    }

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
    revalidatePath('/employer/dashboard', 'page')
    revalidatePath('/candidate/dashboard', 'page')
    revalidateTag(`employer:${user.id}`, 'max')
    revalidateTag(`candidate:${data.candidateId}`, 'max')
    revalidateTag('interviews', 'max')

    return { success: true, interview }
  } catch (error: any) {
    console.error('Error requesting interview:', error)
    return { success: false, error: error.message || 'Failed to request interview.' }
  }
}

/**
 * Get the current user's interview access status.
 * Used by the UI to send employers without access to the pricing page
 * before they open the interview request form.
 */
export async function checkInterviewCredits(): Promise<InterviewCreditsStatus> {
  try {
    const payload = await getPayload({ config })
    const user = await getRequestAuthUser(payload)

    if (!user || user.collection !== 'employers') {
      return {
        isEmployer: false,
        interviewCredits: 0,
        unlimited: false,
        planExpiresAt: null,
        planActive: false,
        canRequest: false,
      }
    }

    const employer = await payload.findByID({
      collection: 'employers',
      id: user.id,
      depth: 1,
    })

    const access = canRequestInterview(employer)

    return {
      isEmployer: true,
      interviewCredits: employer.wallet?.interviewCredits || 0,
      unlimited: access.unlimited,
      planExpiresAt: employer.planExpiresAt || null,
      planActive:
        access.allowed ||
        Boolean(employer.planExpiresAt && new Date(employer.planExpiresAt) > new Date()),
      canRequest: access.allowed,
      blockCode: access.code,
    }
  } catch (error) {
    console.error('Error checking interview credits:', error)
    return {
      isEmployer: false,
      interviewCredits: 0,
      unlimited: false,
      planExpiresAt: null,
      planActive: false,
      canRequest: false,
    }
  }
}
