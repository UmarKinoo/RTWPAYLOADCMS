import React from 'react'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Calendar, Video } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getTodaysInterviews } from '@/lib/payload/interviews'

interface ScheduleSidebarProps {
  employerId: number
}

export async function ScheduleSidebar({ employerId }: ScheduleSidebarProps) {
  const interviews = await getTodaysInterviews(employerId)
  const t = await getTranslations('employerDashboard.schedule')
  const locale = await getLocale()
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US'

  // Generate calendar days (today and next 4 days)
  const today = new Date()
  const scheduleDays = []
  for (let i = 0; i < 5; i++) {
    const date = new Date(today)
    date.setDate(today.getDate() + i)
    scheduleDays.push({
      day: date.toLocaleDateString(dateLocale, { weekday: 'short' }),
      date: date.getDate(),
      active: i === 0, // Today is active
    })
  }

  // Format time for display
  const formatTime = (scheduledAt: string, duration: number) => {
    const start = new Date(scheduledAt)
    const end = new Date(start.getTime() + duration * 60 * 1000)
    const startTime = start.toLocaleTimeString(dateLocale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    const endTime = end.toLocaleTimeString(dateLocale, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    return `${startTime} - ${endTime}`
  }

  return (
    <Card className="flex h-[344px] flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4 sm:gap-6">
      {/* Header */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-semibold text-[#222]">{t('title')}</h3>
          <Calendar className="size-6 text-[#222]" />
        </div>

        {/* Calendar Days */}
        <div className="flex gap-3 overflow-x-auto">
          {scheduleDays.map((day, index) => (
            <div
              key={index}
              className={cn(
                'flex min-w-[50px] flex-col items-center gap-1.5 rounded-lg border px-3 py-1.5',
                day.active
                  ? 'border-white bg-[#4644b8] text-white'
                  : 'border-[#ededed] text-[#222]'
              )}
            >
              <span
                className={cn('text-xs font-normal', day.active ? 'text-[#cbcbcb]' : 'text-[#a5a5a5]')}
              >
                {day.day}
              </span>
              <span className="text-sm font-medium leading-[1.6]">{day.date}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Interviews */}
      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <h4 className="text-base font-semibold text-[#222]">{t('todaysInterview')}</h4>
        <div className="flex flex-1 flex-col gap-3 overflow-y-auto">
          {interviews.length > 0 ? (
            interviews.map((interview) => (
              <div
                key={interview.id}
                className="flex items-start justify-between rounded-lg border border-[#f4f4f4] bg-white p-2"
              >
                <div className="flex flex-1 flex-col gap-2">
                  <p className="text-[10px] font-medium text-[#515151]">
                    <span className="text-[#757575]">{t('interviewWith')}</span>
                    <span className="text-[#282828]">
                      {interview.candidate.firstName} {interview.candidate.lastName}
                    </span>
                  </p>
                  <div className="flex flex-col gap-1 text-xs text-[#282828]">
                    <p className="font-medium">{formatTime(interview.scheduledAt, interview.duration)}</p>
                    <p className="font-normal">{interview.candidate.jobTitle}</p>
                  </div>
                </div>
                {interview.meetingLink ? (
                  <a
                    href={interview.meetingLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#f4f4f4] hover:bg-[#ededed] transition-colors"
                  >
                    <Video className="size-4 text-[#222]" />
                  </a>
                ) : (
                  <div className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-[#f4f4f4]">
                    <Video className="size-4 text-[#757575]" />
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="flex items-center justify-center py-8 text-sm text-[#757575]">
              {t('noInterviewsToday')}
            </div>
          )}
        </div>
        {interviews.length > 0 && (
          <Link
            href="/employer/dashboard/interviews"
            className="text-xs font-medium text-[#4644b8] hover:underline text-center mt-2"
          >
            {t('viewAll')}
          </Link>
        )}
      </div>
    </Card>
  )
}
