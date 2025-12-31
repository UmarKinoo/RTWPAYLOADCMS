import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Notification } from '@/payload-types'

export interface NotificationListItem {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

async function fetchNotifications(
  employerId: number,
  filters?: {
    read?: boolean
    type?: string
  },
): Promise<NotificationListItem[]> {
  const payload = await getPayload({ config: configPromise })

  const where: any = {
    employer: {
      equals: employerId,
    },
  }

  if (filters?.read !== undefined) {
    where.read = {
      equals: filters.read,
    }
  }

  if (filters?.type) {
    where.type = {
      equals: filters.type,
    }
  }

  const result = await payload.find({
    collection: 'notifications',
    where,
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
}

async function fetchUnreadCount(employerId: number): Promise<number> {
  const payload = await getPayload({ config: configPromise })

  const result = await payload.find({
    collection: 'notifications',
    where: {
      and: [
        {
          employer: {
            equals: employerId,
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
}

export const getNotifications = (employerId: number, filters?: {
  read?: boolean
  type?: string
}) =>
  unstable_cache(
    async () => fetchNotifications(employerId, filters),
    ['notifications', String(employerId), JSON.stringify(filters || {})],
    {
      tags: [`employer:${employerId}`, 'notifications'],
      revalidate: 30,
    },
  )()

export const getUnreadCount = (employerId: number) =>
  unstable_cache(
    async () => fetchUnreadCount(employerId),
    ['unread-count', String(employerId)],
    {
      tags: [`employer:${employerId}`, 'notifications'],
      revalidate: 30,
    },
  )()



