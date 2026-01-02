'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Bell, Check, CheckCheck, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { markNotificationAsRead } from '@/lib/candidate/notifications'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
        toast.success('Notification marked as read')
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to mark notification as read')
      }
    } catch (error) {
      toast.error('An error occurred')
    } finally {
      setMarkingAsRead(null)
    }
  }

  const handleMarkAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.read)
    if (unreadNotifications.length === 0) {
      toast.info('All notifications are already read')
      return
    }

    try {
      await Promise.all(unreadNotifications.map((n) => markNotificationAsRead(n.id)))
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
      toast.success('All notifications marked as read')
      router.refresh()
    } catch (error) {
      toast.error('Failed to mark all notifications as read')
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

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">Notifications</h1>
            <p className="text-sm text-[#757575]">
              {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
            </p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Button onClick={handleMarkAllAsRead} variant="outline" size="sm">
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all as read
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
                      <Badge className="bg-[#4644b8] text-white">New</Badge>
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
                      View details →
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
            <h3 className="mb-2 text-lg font-semibold text-[#282828]">No notifications</h3>
            <p className="text-sm text-[#757575]">
              You're all caught up! New notifications will appear here.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}




