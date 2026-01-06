'use client'

import { NotificationDropdown } from '@/components/shared/NotificationDropdown'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/employer/notifications'
import type { NotificationListItem } from '@/lib/payload/notifications'

interface EmployerNotificationDropdownProps {
  notifications: NotificationListItem[]
  unreadCount: number
}

export function EmployerNotificationDropdown({
  notifications,
  unreadCount,
}: EmployerNotificationDropdownProps) {
  const handleMarkAsRead = async (notificationId: number) => {
    return await markNotificationRead(notificationId)
  }

  const handleMarkAllAsRead = async () => {
    return await markAllNotificationsRead()
  }

  return (
    <NotificationDropdown
      notifications={notifications}
      unreadCount={unreadCount}
      onMarkAsRead={handleMarkAsRead}
      onMarkAllAsRead={handleMarkAllAsRead}
      viewAllUrl="/employer/dashboard?view=notifications"
    />
  )
}


