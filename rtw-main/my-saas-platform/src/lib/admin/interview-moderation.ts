'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Interview } from '@/payload-types'
import { sendEmail } from '@/lib/email'
import { interviewInvitationEmailTemplate } from '@/lib/email-templates'

export interface ApproveInterviewRequestData {
  scheduledAt?: string
  duration?: number
  meetingLink?: string
  notes?: string
}

export interface ApproveInterviewRequestResponse {
  success: boolean
  error?: string
  interview?: Interview
}

export interface RejectInterviewRequestResponse {
  success: boolean
  error?: string
}

/**
 * Approve an interview request
 * This should be called by a moderator/admin
 */
function canModerateInterviews(user: unknown): boolean {
  const u = user as { collection?: string; role?: string }
  return u?.collection === 'users' && (u?.role === 'admin' || u?.role === 'moderator')
}

export async function approveInterviewRequest(
  interviewId: number,
  data?: ApproveInterviewRequestData,
): Promise<ApproveInterviewRequestResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }
    if (!canModerateInterviews(user)) {
      return { success: false, error: 'Only moderators or admins can approve interview requests.' }
    }

    // Get the interview request
    const interview = await payload.findByID({
      collection: 'interviews',
      id: interviewId,
      depth: 1,
    })

    if (!interview) {
      return { success: false, error: 'Interview request not found.' }
    }

    if (interview.status !== 'pending') {
      return {
        success: false,
        error: 'Interview request is not pending approval.',
      }
    }

    // Get employer to check credits
    const employerId =
      typeof interview.employer === 'object' ? interview.employer.id : interview.employer
    const employer = await payload.findByID({
      collection: 'employers',
      id: employerId,
      depth: 0,
    })

    if ((employer.wallet?.interviewCredits || 0) <= 0) {
      return { success: false, error: 'Employer has insufficient interview credits.' }
    }

    // Update interview status and details
    const updateData: any = {
      status: 'scheduled',
      approvedAt: new Date().toISOString(),
      approvedBy: user.id,
    }

    if (data?.scheduledAt) {
      updateData.scheduledAt = data.scheduledAt
    }
    if (data?.duration) {
      updateData.duration = data.duration
    }
    if (data?.meetingLink) {
      updateData.meetingLink = data.meetingLink
    }
    if (data?.notes) {
      updateData.notes = data.notes
    }

    const updatedInterview = await payload.update({
      collection: 'interviews',
      id: interviewId,
      data: updateData,
    }) as Interview

    // Deduct interview credit
    await payload.update({
      collection: 'employers',
      id: employerId,
      data: {
        wallet: {
          interviewCredits: Math.max(0, (employer.wallet?.interviewCredits || 0) - 1),
          contactUnlockCredits: employer.wallet?.contactUnlockCredits || 0,
        },
      },
    })

    // Get candidate info
    const candidateId =
      typeof interview.candidate === 'object' ? interview.candidate.id : interview.candidate
    const candidate = await payload.findByID({
      collection: 'candidates',
      id: candidateId,
      depth: 0,
    })

    // Create notifications
    // Candidate notification - New interview invitation (candidate doesn't know about approval process)
    await payload.create({
      collection: 'notifications',
      data: {
        candidate: candidateId,
        type: 'interview_request_approved', // Keep type for filtering, but message is about invitation
        title: 'New Interview Invitation',
        message: `You have received a new interview invitation from ${employer.companyName || employer.email}. Please review and respond.`,
        read: false,
        actionUrl: `/dashboard/interviews`,
      },
    })

    // Send email to candidate (in addition to in-app notification)
    const candidateEmail = 'email' in candidate ? (candidate as { email: string }).email : undefined
    if (candidateEmail) {
      const employerName = 'companyName' in employer ? (employer as { companyName?: string }).companyName : undefined
      const html = interviewInvitationEmailTemplate({
        candidateFirstName: candidate.firstName,
        employerName: employerName || (employer as { email: string }).email,
        scheduledAt: String(updatedInterview.scheduledAt),
        jobPosition: updatedInterview.jobPosition ?? undefined,
        jobLocation: updatedInterview.jobLocation ?? undefined,
        salary: updatedInterview.salary ?? undefined,
        accommodationIncluded: updatedInterview.accommodationIncluded ?? undefined,
        transportation: updatedInterview.transportation ?? undefined,
      })
      const emailResult = await sendEmail({
        to: candidateEmail,
        subject: 'New Interview Invitation – Ready to Work',
        html,
      })
      if (!emailResult.success) {
        console.error('[approveInterviewRequest] Failed to send interview invitation email to candidate:', emailResult.error)
      }
    }

    // Employer notification
    await payload.create({
      collection: 'notifications',
      data: {
        employer: employerId,
        type: 'interview_scheduled',
        title: 'Interview Approved',
        message: `Your interview request with ${candidate.firstName} ${candidate.lastName} has been approved.`,
        read: false,
        actionUrl: `/employer/dashboard/interviews/${interviewId}`,
      },
    })

    // Revalidate cache
    revalidatePath('/employer/dashboard', 'page')
    revalidatePath('/candidate/dashboard', 'page')
    revalidatePath('/moderator/interviews', 'page')
    revalidateTag(`employer:${employerId}`, 'max')
    revalidateTag(`candidate:${candidateId}`, 'max')
    revalidateTag(`interview:${interviewId}`, 'max')
    revalidateTag('interviews', 'max')

    return { success: true, interview: updatedInterview }
  } catch (error: any) {
    console.error('Error approving interview request:', error)
    return { success: false, error: error.message || 'Failed to approve interview request.' }
  }
}

/**
 * Reject an interview request
 * This should be called by a moderator/admin
 */
export async function rejectInterviewRequest(
  interviewId: number,
  reason?: string,
): Promise<RejectInterviewRequestResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    const { user } = await payload.auth({ headers: headersList })

    if (!user) {
      return { success: false, error: 'Authentication required.' }
    }
    if (!canModerateInterviews(user)) {
      return { success: false, error: 'Only moderators or admins can reject interview requests.' }
    }

    // Get the interview request
    const interview = await payload.findByID({
      collection: 'interviews',
      id: interviewId,
      depth: 1,
    })

    if (!interview) {
      return { success: false, error: 'Interview request not found.' }
    }

    if (interview.status !== 'pending') {
      return {
        success: false,
        error: 'Interview request is not pending approval.',
      }
    }

    // Update interview status
    await payload.update({
      collection: 'interviews',
      id: interviewId,
      data: {
        status: 'rejected',
        rejectionReason: reason || 'Interview request rejected by moderator.',
      },
    })

    // Get candidate and employer info
    const candidateId =
      typeof interview.candidate === 'object' ? interview.candidate.id : interview.candidate
    const employerId =
      typeof interview.employer === 'object' ? interview.employer.id : interview.employer

    const candidate = await payload.findByID({
      collection: 'candidates',
      id: candidateId,
      depth: 0,
    })

    // Create notifications
    // Candidate notification
    await payload.create({
      collection: 'notifications',
      data: {
        candidate: candidateId,
        type: 'interview_request_rejected',
        title: 'Interview Request Rejected',
        message: reason
          ? `Your interview request has been rejected. Reason: ${reason}`
          : 'Your interview request has been rejected.',
        read: false,
      },
    })

    // Employer notification
    await payload.create({
      collection: 'notifications',
      data: {
        employer: employerId,
        type: 'system',
        title: 'Interview Request Rejected',
        message: `Your interview request with ${candidate.firstName} ${candidate.lastName} has been rejected.`,
        read: false,
      },
    })

    // Revalidate cache
    revalidatePath('/employer/dashboard', 'page')
    revalidatePath('/candidate/dashboard', 'page')
    revalidatePath('/moderator/interviews', 'page')
    revalidateTag(`employer:${employerId}`, 'max')
    revalidateTag(`candidate:${candidateId}`, 'max')
    revalidateTag(`interview:${interviewId}`, 'max')
    revalidateTag('interviews', 'max')

    return { success: true }
  } catch (error: any) {
    console.error('Error rejecting interview request:', error)
    return { success: false, error: error.message || 'Failed to reject interview request.' }
  }
}

