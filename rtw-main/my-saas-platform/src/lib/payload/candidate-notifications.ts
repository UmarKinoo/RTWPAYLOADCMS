import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { unstable_cache } from 'next/cache'

export interface CandidateNotification {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

async function fetchCandidateNotifications(
  candidateId: number,
): Promise<CandidateNotification[]> {
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'notifications',
      where: {
        candidate: {
          equals: candidateId,
        },
      },
      sort: '-createdAt',
      limit: 100,
      overrideAccess: true,
    })

    return result.docs.map((notification) => ({
      id: notification.id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      read: notification.read,
      actionUrl: notification.actionUrl || undefined,
      createdAt: notification.createdAt,
    }))
  } catch (error) {
    console.error('Error fetching candidate notifications:', error)
    return []
  }
}

/**
 * Get notifications for a candidate (cached)
 */
export async function getCandidateNotifications(candidateId: number): Promise<CandidateNotification[]> {
  return unstable_cache(
    async () => fetchCandidateNotifications(candidateId),
    ['candidate-notifications', String(candidateId)],
    {
      tags: [`candidate:${candidateId}`, 'notifications'],
      revalidate: 60,
    },
  )()
}

/**
 * Get unread notification count for a candidate
 */
export async function getUnreadNotificationCount(
  candidateId: number,
): Promise<number> {
  const payload = await getPayload({ config: configPromise })

  try {
    const result = await payload.find({
      collection: 'notifications',
      where: {
        and: [
          {
            candidate: {
              equals: candidateId,
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

    return result.totalDocs
  } catch (error) {
    console.error('Error fetching unread notification count:', error)
    return 0
  }
}

