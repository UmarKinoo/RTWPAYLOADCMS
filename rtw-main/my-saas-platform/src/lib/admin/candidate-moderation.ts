'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Candidate } from '@/payload-types'
import { getRequestAuthUser } from '@/lib/payload-auth'
import { sendEmail } from '@/lib/email'
import {
  candidateProfileApprovedEmailTemplate,
  candidateProfileNeedsChangesEmailTemplate,
  candidateProfileRejectedEmailTemplate,
} from '@/lib/email-templates'
import { getServerSideURL } from '@/utilities/getURL'
import { defaultLocale } from '@/i18n/config'

export interface ModerationActionResponse {
  success: boolean
  error?: string
}

function canModerateCandidates(user: unknown): boolean {
  const u = user as { collection?: string; role?: string }
  return u?.collection === 'users' && (u?.role === 'admin' || u?.role === 'moderator')
}

function dashboardUrl(): string {
  return `${getServerSideURL()}/${defaultLocale}/dashboard`
}

async function emailCandidateDecision(
  candidate: Candidate,
  type: 'approved' | 'rejected' | 'needs_changes',
  reason?: string,
): Promise<void> {
  const email = candidate.email
  if (!email) return

  const params = {
    firstName: candidate.firstName,
    dashboardUrl: dashboardUrl(),
    reason,
  }

  let subject: string
  let html: string
  switch (type) {
    case 'approved':
      subject = 'Your Ready to Work profile is now live'
      html = candidateProfileApprovedEmailTemplate(params)
      break
    case 'rejected':
      subject = 'Update on your Ready to Work profile review'
      html = candidateProfileRejectedEmailTemplate(params)
      break
    case 'needs_changes':
      subject = 'Action needed on your Ready to Work profile'
      html = candidateProfileNeedsChangesEmailTemplate(params)
      break
  }

  const result = await sendEmail({ to: email, subject, html })
  if (!result.success) {
    console.error(`[candidate-moderation] Failed to email candidate ${candidate.id}:`, result.error)
  }
}

function revalidateCandidateCaches(candidateId: number) {
  revalidatePath('/candidates', 'page')
  revalidatePath(`/candidates/${candidateId}`, 'page')
  revalidatePath('/moderator', 'page')
  revalidatePath('/moderator/candidates/pending', 'page')
  revalidatePath('/dashboard', 'page')
  revalidateTag('candidates', 'max')
  revalidateTag(`candidate:${candidateId}`, 'max')
}

export async function approveCandidateProfile(
  candidateId: number,
  moderatorNotes?: string,
): Promise<ModerationActionResponse> {
  try {
    const payload = await getPayload({ config })
    const user = await getRequestAuthUser(payload)
    if (!user) return { success: false, error: 'Authentication required.' }
    if (!canModerateCandidates(user)) {
      return { success: false, error: 'Only moderators or admins can approve profiles.' }
    }

    const candidate = await payload.findByID({
      collection: 'candidates',
      id: candidateId,
      depth: 0,
      overrideAccess: true,
    })

    if (!candidate) return { success: false, error: 'Candidate not found.' }
    if (candidate.profileStatus === 'approved') {
      return { success: false, error: 'Profile is already approved.' }
    }

    const now = new Date().toISOString()
    const updated = (await payload.update({
      collection: 'candidates',
      id: candidateId,
      data: {
        profileStatus: 'approved',
        moderation: {
          ...(candidate.moderation || {}),
          reviewedAt: now,
          reviewedBy: user.id,
          moderatorNotes: moderatorNotes ?? candidate.moderation?.moderatorNotes,
          rejectionReason: undefined,
        },
      },
      overrideAccess: true,
    })) as Candidate

    await emailCandidateDecision(updated, 'approved')
    revalidateCandidateCaches(candidateId)
    return { success: true }
  } catch (error: unknown) {
    console.error('approveCandidateProfile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve profile.',
    }
  }
}

export async function rejectCandidateProfile(
  candidateId: number,
  reason?: string,
  moderatorNotes?: string,
): Promise<ModerationActionResponse> {
  try {
    const payload = await getPayload({ config })
    const user = await getRequestAuthUser(payload)
    if (!user) return { success: false, error: 'Authentication required.' }
    if (!canModerateCandidates(user)) {
      return { success: false, error: 'Only moderators or admins can reject profiles.' }
    }

    const candidate = await payload.findByID({
      collection: 'candidates',
      id: candidateId,
      depth: 0,
      overrideAccess: true,
    })

    if (!candidate) return { success: false, error: 'Candidate not found.' }

    const feedback = reason?.trim() || 'Your profile did not meet our publishing requirements.'
    const now = new Date().toISOString()
    const updated = (await payload.update({
      collection: 'candidates',
      id: candidateId,
      data: {
        profileStatus: 'rejected',
        moderation: {
          ...(candidate.moderation || {}),
          reviewedAt: now,
          reviewedBy: user.id,
          rejectionReason: feedback,
          moderatorNotes: moderatorNotes ?? candidate.moderation?.moderatorNotes,
          moderatorNotifiedAt: undefined,
        },
      },
      overrideAccess: true,
    })) as Candidate

    await emailCandidateDecision(updated, 'rejected', feedback)
    revalidateCandidateCaches(candidateId)
    return { success: true }
  } catch (error: unknown) {
    console.error('rejectCandidateProfile:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject profile.',
    }
  }
}

export async function requestCandidateProfileChanges(
  candidateId: number,
  reason: string,
  moderatorNotes?: string,
): Promise<ModerationActionResponse> {
  try {
    const payload = await getPayload({ config })
    const user = await getRequestAuthUser(payload)
    if (!user) return { success: false, error: 'Authentication required.' }
    if (!canModerateCandidates(user)) {
      return { success: false, error: 'Only moderators or admins can request changes.' }
    }

    const feedback = reason?.trim()
    if (!feedback) {
      return { success: false, error: 'Please describe what the candidate should update.' }
    }

    const candidate = await payload.findByID({
      collection: 'candidates',
      id: candidateId,
      depth: 0,
      overrideAccess: true,
    })

    if (!candidate) return { success: false, error: 'Candidate not found.' }

    const now = new Date().toISOString()
    const updated = (await payload.update({
      collection: 'candidates',
      id: candidateId,
      data: {
        profileStatus: 'needs_changes',
        moderation: {
          ...(candidate.moderation || {}),
          reviewedAt: now,
          reviewedBy: user.id,
          rejectionReason: feedback,
          moderatorNotes: moderatorNotes ?? candidate.moderation?.moderatorNotes,
          moderatorNotifiedAt: undefined,
        },
      },
      overrideAccess: true,
    })) as Candidate

    await emailCandidateDecision(updated, 'needs_changes', feedback)
    revalidateCandidateCaches(candidateId)
    return { success: true }
  } catch (error: unknown) {
    console.error('requestCandidateProfileChanges:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request changes.',
    }
  }
}
