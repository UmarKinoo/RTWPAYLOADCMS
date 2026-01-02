'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath, revalidateTag } from 'next/cache'
import type { Notification } from '@/payload-types'

export interface MarkNotificationReadResponse {
  success: boolean
  error?: string
}

/**
 * Mark a notification as read
 */
export async function markNotificationRead(
  notificationId: number,
): Promise<MarkNotificationReadResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Verify notification belongs to employer
    const notification = await payload.findByID({
      collection: 'notifications',
      id: notificationId,
      depth: 0,
    })

    const employerId =
      notification.employer && typeof notification.employer === 'object' ? notification.employer.id : notification.employer
    if (!employerId || employerId !== user.id) {
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
    revalidatePath('/employer/dashboard', 'page')
    revalidateTag(`employer:${user.id}`, 'max')
    revalidateTag(`notification:${notificationId}`, 'max')
    revalidateTag('notifications', 'max')

    return { success: true }
  } catch (error: any) {
    console.error('Error marking notification as read:', error)
    return { success: false, error: error.message || 'Failed to mark notification as read.' }
  }
}

/**
 * Mark all notifications as read for an employer
 */
export async function markAllNotificationsRead(): Promise<MarkNotificationReadResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Get all unread notifications
    const notifications = await payload.find({
      collection: 'notifications',
      where: {
        and: [
          {
            employer: {
              equals: user.id,
            },
          },
          {
            read: {
              equals: false,
            },
          },
        ],
      },
      limit: 1000,
      overrideAccess: true,
    })

    // Update all notifications
    for (const notification of notifications.docs) {
      await payload.update({
        collection: 'notifications',
        id: notification.id,
        data: {
          read: true,
        },
      })
    }

    // Revalidate cache
    revalidatePath('/employer/dashboard', 'page')
    revalidateTag(`employer:${user.id}`, 'max')
    revalidateTag('notifications', 'max')

    return { success: true }
  } catch (error: any) {
    console.error('Error marking all notifications as read:', error)
    return {
      success: false,
      error: error.message || 'Failed to mark all notifications as read.',
    }
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(
  notificationId: number,
): Promise<MarkNotificationReadResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()

    // Authenticate employer
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return { success: false, error: 'Authentication required as an employer.' }
    }

    // Verify notification belongs to employer
    const notification = await payload.findByID({
      collection: 'notifications',
      id: notificationId,
      depth: 0,
    })

    const employerId =
      notification.employer && typeof notification.employer === 'object' ? notification.employer.id : notification.employer
    if (!employerId || employerId !== user.id) {
      return { success: false, error: 'Unauthorized.' }
    }

    // Delete notification
    await payload.delete({
      collection: 'notifications',
      id: notificationId,
    })

    // Revalidate cache
    revalidatePath('/employer/dashboard', 'page')
    revalidateTag(`employer:${user.id}`, 'max')
    revalidateTag('notifications', 'max')

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting notification:', error)
    return { success: false, error: error.message || 'Failed to delete notification.' }
  }
}



