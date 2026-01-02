'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { CandidateInteraction } from '@/payload-types'

export interface TrackInteractionData {
  candidateId: number
  interactionType: 'view' | 'interview_requested' | 'interviewed' | 'declined' | 'contact_unlocked'
  metadata?: any
}

export interface TrackInteractionResponse {
  success: boolean
  error?: string
  interaction?: CandidateInteraction
}

/**
 * Track a candidate interaction
 */
export async function trackInteraction(
  data: TrackInteractionData,
): Promise<TrackInteractionResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Check for contact unlock credit requirement
    if (data.interactionType === 'contact_unlocked') {
      const employer = await payload.findByID({
        collection: 'employers',
        id: user.id,
        depth: 0,
      })

      if ((employer.wallet?.contactUnlockCredits || 0) <= 0) {
        return { success: false, error: 'Insufficient contact unlock credits.' }
      }

      // Deduct credit
      await payload.update({
        collection: 'employers',
        id: user.id,
        data: {
          wallet: {
            interviewCredits: employer.wallet?.interviewCredits || 0,
            contactUnlockCredits: Math.max(0, (employer.wallet?.contactUnlockCredits || 0) - 1),
          },
        },
      })
    }

    // Create interaction
    const interaction = await payload.create({
      collection: 'candidate-interactions',
      data: {
        employer: user.id,
        candidate: data.candidateId,
        interactionType: data.interactionType,
        metadata: data.metadata || undefined,
      },
    }) as CandidateInteraction

    // Revalidate cache
    revalidatePath('/employer/dashboard', 'page')
    revalidateTag(`employer:${user.id}`, 'max')
    revalidateTag('candidate-interactions', 'max')

    return { success: true, interaction }
  } catch (error: any) {
    console.error('Error tracking interaction:', error)
    return { success: false, error: error.message || 'Failed to track interaction.' }
  }
}



