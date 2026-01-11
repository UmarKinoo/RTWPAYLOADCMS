'use client'

import { NotificationDropdown } from '@/components/shared/NotificationDropdown'
import { markNotificationAsRead } from '@/lib/candidate/notifications'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'

interface CandidateNotificationDropdownProps {
  notifications: CandidateNotification[]
  unreadCount: number
}

export function CandidateNotificationDropdown({
  notifications,
  unreadCount,
}: CandidateNotificationDropdownProps) {
  const handleMarkAsRead = async (notificationId: number) => {
    return await markNotificationAsRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read)
    if (unreadNotifications.length === 0) {
      return { success: true }
    }

    try {
      await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id)))
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to mark all notifications as read' }
    }
  }

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      viewAllUrl="/dashboard?view=notifications"
    />
  )
}







