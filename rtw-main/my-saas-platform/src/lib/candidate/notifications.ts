'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'

// Re-export types for convenience
export type { CandidateNotification } from '@/lib/payload/candidate-notifications'

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(
  notificationId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate candidate
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'candidates') {
      return { success: false, error: 'Authentication required as a candidate.' }
    }

    // Get notification and verify it belongs to the candidate
    const notification = await payload.findByID({
      collection: 'notifications',
      id: notificationId,
      depth: 0,
    })

    const candidateId =
      notification.candidate && typeof notification.candidate === 'object'
        ? notification.candidate.id
        : notification.candidate

    if (candidateId !== user.id) {
      return { success: false, error: 'Unauthorized.' }
    }

    // Update notification
    await payload.update({
      collection: 'notifications',
      id: notificationId,
      data: {
        read: true,
      },
    })

    // Revalidate cache
    revalidatePath('/candidate/dashboard', 'page')
    revalidateTag(`candidate:${user.id}`, 'max')
    revalidateTag('notifications', 'max')

    return { success: true }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message || 'Failed to mark notification as read.' }
  }
}


