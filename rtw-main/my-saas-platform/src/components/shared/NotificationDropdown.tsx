'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Bell, Check, CheckCheck, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Link } from '@/i18n/routing'

export interface NotificationItem {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  actionUrl?: string
  createdAt: string
}

interface NotificationDropdownProps {
  notifications: NotificationItem[]
  unreadCount: number
  onMarkAsRead: (notificationId: number) => Promise<{ success: boolean; error?: string }>
  onMarkAllAsRead: () => Promise<{ success: boolean; error?: string }>
  viewAllUrl?: string
  /** Optional namespace for notification type-based title/message e.g. 'candidateDashboard' */
  notificationsNamespace?: string
}

const KNOWN_NOTIFICATION_TYPES = ['interview_request_approved', 'interview_scheduled', 'interview_request', 'message'] as const

export function NotificationDropdown({
  notifications: initialNotifications,
  unreadCount: initialUnreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
  viewAllUrl,
  notificationsNamespace,
}: NotificationDropdownProps) {
  const t = useTranslations('notificationDropdown')
  const tTypes = useTranslations(`${notificationsNamespace || 'candidateDashboard'}.notifications`)
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount)
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null)
  const [open, setOpen] = useState(false)

  const handleMarkAsRead = async (notificationId: number, e?: React.MouseEvent) => {
    e?.stopPropagation()
    setMarkingAsRead(notificationId)
    try {
      const result = await onMarkAsRead(notificationId)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        )
        setUnreadCount((prev) => Math.max(0, prev - 1))
        router.refresh()
      } else {
        toast.error(result.error || t('failedToMarkAsRead'))
      }
    } catch (error) {
      toast.error(t('anErrorOccurred'))
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read)
    if (unreadNotifications.length === 0) {
      toast.info(t('allAlreadyRead'))
      return
    }

    try {
      const result = await onMarkAllAsRead()
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        setUnreadCount(0)
        router.refresh()
      } else {
        toast.error(result.error || t('failedToMarkAllAsRead'))
      }
    } catch (error) {
      toast.error(t('failedToMarkAllAsRead'))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_request_approved':
      case 'interview_scheduled':
        return '📅'
      case 'interview_request':
        return '💼'
      case 'message':
        return '💬'
      default:
        return '🔔'
    }
  }

  const getDisplayTitle = (notification: NotificationItem): string => {
    if (KNOWN_NOTIFICATION_TYPES.includes(notification.type as typeof KNOWN_NOTIFICATION_TYPES[number])) {
      const key = `types.${notification.type}.title`
      const translated = tTypes(key, { company: '' })
      return translated !== key ? translated : notification.title
    }
    return notification.title
  }

  const getDisplayMessage = (notification: NotificationItem): string => {
    if (KNOWN_NOTIFICATION_TYPES.includes(notification.type as typeof KNOWN_NOTIFICATION_TYPES[number])) {
      const key = `types.${notification.type}.message`
      const translated = tTypes(key)
      return translated !== key ? translated : notification.message
    }
    return notification.message
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative h-10 w-10 rounded-lg bg-[#ededed] text-[#282828] hover:bg-[#e0e0e0]"
        >
          <Bell className="size-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 min-w-[20px] justify-center rounded-full bg-[#dc0000] px-1.5 py-0.5 text-xs text-white">
              {unreadCount > 99 ? '99+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3 bg-white">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#282828]">{t('title')}</h3>
            {unreadCount > 0 && (
              <Badge className="bg-[#dc0000] text-white">{unreadCount}</Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheck className="mr-1 h-3 w-3" />
              {t('markAllRead')}
            </Button>
          )}
        </div>

        {/* Notifications List - Scrollable */}
        <ScrollArea className="h-[350px]">
          <div className="pr-4">
            {notifications.length > 0 ? (
              <div className="divide-y">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={cn(
                      'group relative px-4 py-3 transition-colors hover:bg-[#f5f5f5] cursor-pointer',
                      !notification.read && 'bg-blue-50/50',
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <span className="mt-0.5 text-lg shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <p
                              className={cn(
                                'text-sm font-medium break-words',
                                !notification.read ? 'text-[#282828]' : 'text-[#757575]',
                              )}
                            >
                              {getDisplayTitle(notification)}
                            </p>
                            <p className="mt-1 text-xs text-[#757575] line-clamp-2 break-words">
                              {getDisplayMessage(notification)}
                            </p>
                            <p className="mt-1 text-xs text-[#9a9a9a] whitespace-nowrap">
                              {format(new Date(notification.createdAt), 'MMM d, h:mm a')}
                            </p>
                          </div>
                          {!notification.read && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={(e) => handleMarkAsRead(notification.id, e)}
                              disabled={markingAsRead === notification.id}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                        {notification.actionUrl && (
                          <Link
                            href={notification.actionUrl}
                            onClick={() => setOpen(false)}
                            className="mt-2 inline-flex items-center text-xs text-[#4644b8] hover:underline break-words"
                          >
                            {t('viewDetails')} <ArrowRight className="ml-1 h-3 w-3 shrink-0" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Bell className="mb-3 h-10 w-10 text-[#cbcbcb]" />
                <p className="text-sm font-medium text-[#282828]">{t('noNotifications')}</p>
                <p className="mt-1 text-xs text-[#757575]">
                  {t('allCaughtUp')}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        {notifications.length > 0 && viewAllUrl && (
          <>
            <DropdownMenuSeparator />
            <div className="px-4 py-2.5 bg-white">
              <Link
                href={viewAllUrl}
                onClick={() => setOpen(false)}
                className="flex w-full items-center justify-center gap-1 text-sm text-[#4644b8] hover:underline"
              >
                {t('viewAllNotifications')} <ArrowRight className="h-3 w-3 shrink-0" />
              </Link>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}







