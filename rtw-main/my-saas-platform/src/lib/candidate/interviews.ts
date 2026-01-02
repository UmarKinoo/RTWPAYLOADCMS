'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Interview } from '@/payload-types'

export interface AcceptInterviewResponse {
  success: boolean
  error?: string
  interview?: Interview
}

export interface RejectInterviewResponse {
  success: boolean
  error?: string
}

/**
 * Candidate accepts an interview
 */
export async function acceptInterview(
  interviewId: number,
): Promise<AcceptInterviewResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate candidate
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'candidates') {
      return { success: false, error: 'Authentication required as a candidate.' }
    }

    // Get the interview
    const interview = await payload.findByID({
      collection: 'interviews',
      id: interviewId,
      depth: 1,
    })

    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }

    // Verify interview belongs to candidate
    const candidateId =
      typeof interview.candidate === 'object' ? interview.candidate.id : interview.candidate

    if (candidateId !== user.id) {
      return { success: false, error: 'Unauthorized.' }
    }

    // Only allow accepting scheduled interviews (approved by admin)
    if (interview.status !== 'scheduled') {
      return {
        success: false,
        error: 'Only scheduled interviews can be accepted.',
      }
    }

    // Update interview - keep status as scheduled, interview is confirmed
    const updatedInterview = await payload.update({
      collection: 'interviews',
      id: interviewId,
      data: {
        status: 'scheduled', // Keep as scheduled, candidate has accepted
      },
    }) as Interview

    // Get employer info
    const employerId =
      typeof interview.employer === 'object' ? interview.employer.id : interview.employer
    const employer = await payload.findByID({
      collection: 'employers',
      id: employerId,
      depth: 0,
    })

    // Create notification for employer
    await payload.create({
      collection: 'notifications',
      data: {
        employer: employerId,
        type: 'interview_scheduled',
        title: 'Interview Accepted',
        message: `The candidate has accepted your interview request.`,
        read: false,
        actionUrl: `/employer/dashboard/interviews/${interviewId}`,
      },
    })

    // Revalidate cache
    revalidatePath('/candidate/dashboard/interviews', 'page')
    revalidatePath('/employer/dashboard', 'page')
    revalidateTag(`candidate:${user.id}`, 'max')
    revalidateTag(`employer:${employerId}`, 'max')
    revalidateTag(`interview:${interviewId}`, 'max')
    revalidateTag('interviews', 'max')
    revalidateTag('notifications', 'max')

    return { success: true, interview: updatedInterview }
  } catch (error: any) {
    console.error('Error accepting interview:', error)
    return { success: false, error: error.message || 'Failed to accept interview.' }
  }
}

/**
 * Candidate rejects an interview
 */
export async function rejectInterview(
  interviewId: number,
  reason?: string,
): Promise<RejectInterviewResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate candidate
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'candidates') {
      return { success: false, error: 'Authentication required as a candidate.' }
    }

    // Get the interview
    const interview = await payload.findByID({
      collection: 'interviews',
      id: interviewId,
      depth: 1,
    })

    if (!interview) {
      return { success: false, error: 'Interview not found.' }
    }

    // Verify interview belongs to candidate
    const candidateId =
      typeof interview.candidate === 'object' ? interview.candidate.id : interview.candidate

    if (candidateId !== user.id) {
      return { success: false, error: 'Unauthorized.' }
    }

    // Only allow rejecting scheduled interviews (approved by admin)
    if (interview.status !== 'scheduled') {
      return {
        success: false,
        error: 'Only scheduled interviews can be rejected.',
      }
    }

    // Update interview status to cancelled
    await payload.update({
      collection: 'interviews',
      id: interviewId,
      data: {
        status: 'cancelled',
        rejectionReason: reason || 'Interview rejected by candidate.',
      },
    })

    // Get employer info
    const employerId =
      typeof interview.employer === 'object' ? interview.employer.id : interview.employer
    const employer = await payload.findByID({
      collection: 'employers',
      id: employerId,
      depth: 0,
    })

    const candidate = await payload.findByID({
      collection: 'candidates',
      id: candidateId,
      depth: 0,
    })

    // Create notification for employer
    await payload.create({
      collection: 'notifications',
      data: {
        employer: employerId,
        type: 'interview_request_rejected',
        title: 'Interview Rejected',
        message: `The candidate has rejected your interview request.${reason ? ` Reason: ${reason}` : ''}`,
        read: false,
        actionUrl: `/employer/dashboard/interviews/${interviewId}`,
      },
    })

    // Revalidate cache
    revalidatePath('/candidate/dashboard/interviews', 'page')
    revalidatePath('/employer/dashboard', 'page')
    revalidateTag(`candidate:${user.id}`, 'max')
    revalidateTag(`employer:${employerId}`, 'max')
    revalidateTag(`interview:${interviewId}`, 'max')
    revalidateTag('interviews', 'max')
    revalidateTag('notifications', 'max')

    return { success: true }
  } catch (error: any) {
    console.error('Error rejecting interview:', error)
    return { success: false, error: error.message || 'Failed to reject interview.' }
  }
}

