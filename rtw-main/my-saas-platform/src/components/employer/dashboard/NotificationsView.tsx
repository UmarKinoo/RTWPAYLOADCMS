'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { Bell, Check, CheckCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/employer/notifications'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type { Employer } from '@/payload-types'
import type { NotificationListItem } from '@/lib/payload/notifications'
import { cn } from '@/lib/utils'

interface NotificationsViewProps {
  employer: Employer
  notifications: NotificationListItem[]
}

export function NotificationsView({
  employer,
  notifications: initialNotifications,
}: NotificationsViewProps) {
  const router = useRouter()
  const t = useTranslations('employerDashboard.notifications')
  const [notifications, setNotifications] = useState(initialNotifications)
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId)
    try {
      const result = await markNotificationRead(notificationId)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        )
        toast.success(t('markedAsRead'))
        router.refresh()
      } else {
        toast.error(result.error || t('failedToMarkRead'))
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
      const result = await markAllNotificationsRead()
      if (result.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
        toast.success(t('markedAllAsRead'))
        router.refresh()
      } else {
        toast.error(result.error || t('failedToMarkAllRead'))
      }
    } catch (error) {
      toast.error(t('failedToMarkAllRead'))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_request_approved':
        return '📅'
      case 'candidate_applied':
        return '👤'
      case 'interview_scheduled':
        return '📆'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'interview_request_approved':
        return 'bg-green-50 border-green-200'
      case 'candidate_applied':
        return 'bg-blue-50 border-blue-200'
      case 'interview_scheduled':
        return 'bg-purple-50 border-purple-200'
      default:
        return 'bg-white'
    }
  }

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/employer/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">{t('title')}</h1>
            <p className="text-sm text-[#757575]">
              {unreadCount > 0
                ? unreadCount === 1
                  ? t('unreadCount', { count: unreadCount })
                  : t('unreadCountPlural', { count: unreadCount })
                : t('allCaughtUp')}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={handleMarkAllAsRead}
            className="gap-2"
          >
            <CheckCheck className="h-4 w-4" />
            {t('markAllAsRead')}
          </Button>
        )}
      </div>

      {/* Notifications List */}
      {notifications.length > 0 ? (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={cn(
                'transition-colors',
                !notification.read && 'border-l-4 border-l-[#4644b8] bg-white',
                notification.read && 'bg-[#fafafa]',
              )}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-2xl">{getNotificationIcon(notification.type)}</span>
                    <div className="flex-1">
                      <CardTitle
                        className={cn(
                          'text-base font-semibold',
                          !notification.read ? 'text-[#282828]' : 'text-[#757575]',
                        )}
                      >
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-[#757575]">
                        {format(new Date(notification.createdAt), 'MMM d, yyyy • h:mm a')}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.read && (
                      <Badge className="bg-[#4644b8] text-white">{t('new')}</Badge>
                    )}
                    {!notification.read && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleMarkAsRead(notification.id)}
                        disabled={markingAsRead === notification.id}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-[#515151] leading-relaxed">{notification.message}</p>
                {notification.actionUrl && (
                  <Link href={notification.actionUrl}>
                    <Button variant="link" className="mt-2 h-auto p-0 text-[#4644b8]">
                      {t('viewDetails')}
                    </Button>
                  </Link>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Bell className="mb-4 h-12 w-12 text-[#cbcbcb]" />
            <h3 className="mb-2 text-lg font-semibold text-[#282828]">{t('noNotifications')}</h3>
            <p className="text-sm text-[#757575]">
              {t('noNotificationsDescription')}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

