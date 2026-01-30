'use client'

import React, { useState } from 'react'
import { useTranslations } from 'next-intl'
import { format } from 'date-fns'
import { Bell, Check, CheckCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { markNotificationAsRead } from '@/lib/candidate/notifications'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { Link } from '@/i18n/routing'
import type { Candidate } from '@/payload-types'
import type { CandidateNotification } from '@/lib/payload/candidate-notifications'
import { cn } from '@/lib/utils'

interface NotificationsViewProps {
  candidate: Candidate
  notifications: CandidateNotification[]
}

export function NotificationsView({
  candidate,
  notifications: initialNotifications,
}: NotificationsViewProps) {
  const t = useTranslations('candidateDashboard.notifications')
  const tCommon = useTranslations('candidateDashboard.common')
  const router = useRouter()
  const [notifications, setNotifications] = useState(initialNotifications)
  const [markingAsRead, setMarkingAsRead] = useState<number | null>(null)

  const unreadCount = notifications.filter((n) => !n.read).length

  const handleMarkAsRead = async (notificationId: number) => {
    setMarkingAsRead(notificationId)
    try {
      const result = await markNotificationAsRead(notificationId)
      if (result.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)),
        )
        toast.success(t('markAsRead'))
        router.refresh()
      } else {
        toast.error(result.error || t('failedToMarkAsRead'))
      }
    } catch (error) {
      toast.error(tCommon('anErrorOccurred'))
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
      await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id)))
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success(t('markAllAsRead'))
      router.refresh()
    } catch (error) {
      toast.error(t('failedToMarkAllAsRead'))
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'interview_request_approved':
        return '📅'
      default:
        return '🔔'
    }
  }

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'interview_request_approved':
        return 'text-green-600'
      default:
        return 'text-blue-600'
    }
  }

  const KNOWN_TYPES = ['interview_request_approved', 'interview_scheduled', 'interview_request', 'message'] as const
  const getDisplayTitle = (notification: typeof notifications[0]): string => {
    if (KNOWN_TYPES.includes(notification.type as typeof KNOWN_TYPES[number])) {
      const key = `types.${notification.type}.title`
      const translated = t(key, { company: '' })
      return translated !== key ? translated : notification.title
    }
    return notification.title
  }
  const getDisplayMessage = (notification: typeof notifications[0]): string => {
    if (KNOWN_TYPES.includes(notification.type as typeof KNOWN_TYPES[number])) {
      const key = `types.${notification.type}.message`
      const translated = t(key)
      return translated !== key ? translated : notification.message
    }
    return notification.message
  }

  return (
    <div className="mt-6">
      {/* Actions — title lives in DashboardHeader above */}
      {unreadCount > 0 && (
        <div className="mb-6 flex justify-end">
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            <CheckCheck className="mr-2 h-4 w-4" />
            {t('markAllAsReadButton')}
          </Button>
        </div>
      )}

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
                        {getDisplayTitle(notification)}
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
                <p className="text-sm text-[#515151] leading-relaxed">{getDisplayMessage(notification)}</p>
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










