'use client'

import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Calendar, Clock, MapPin, Briefcase, Video, FileText, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { ScheduledInterview } from '@/lib/payload/employer-views'

interface ScheduledInterviewsViewProps {
  interviews: ScheduledInterview[]
}

export function ScheduledInterviewsView({ interviews }: ScheduledInterviewsViewProps) {
  const t = useTranslations('employerDashboard.scheduledInterviews')
  const now = new Date()

  const upcomingInterviews = interviews.filter((i) => new Date(i.scheduledAt) > now)
  const pastInterviews = interviews.filter((i) => new Date(i.scheduledAt) <= now)

  return (
    <div className="mt-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/employer/dashboard">
          <Button variant="ghost" size="icon" className="h-10 w-10">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">
            {t('title')}
          </h1>
          <p className="text-sm text-[#757575]">
            {upcomingInterviews.length === 1
              ? t('upcomingCount', { count: 1 })
              : t('upcomingCountPlural', { count: upcomingInterviews.length })}
          </p>
        </div>
      </div>

      {/* Upcoming Interviews */}
      {upcomingInterviews.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-[#282828] mb-4">{t('upcoming')}</h2>
          <div className="space-y-4">
            {upcomingInterviews.map((interview) => {
              const scheduledDate = new Date(interview.scheduledAt)
              const initials = `${interview.candidate.firstName?.[0] || ''}${interview.candidate.lastName?.[0] || ''}`.toUpperCase()

              return (
                <Card key={interview.id} className="overflow-hidden">
                  <CardHeader className="pb-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4 flex-1">
                        <Avatar className="size-12 shrink-0 border-2 border-[#ededed]">
                          {interview.candidate.profilePictureUrl ? (
                            <AvatarImage src={interview.candidate.profilePictureUrl} alt={`${interview.candidate.firstName} ${interview.candidate.lastName}`} />
                          ) : null}
                          <AvatarFallback className="bg-[#ededed] text-[#282828] font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <CardTitle className="text-lg mb-1">
                            {interview.candidate.firstName} {interview.candidate.lastName}
                          </CardTitle>
                          {interview.candidate.jobTitle && (
                            <p className="text-sm text-[#757575]">{interview.candidate.jobTitle}</p>
                          )}
                        </div>
                      </div>
                      <Link href={`/candidates/${interview.candidate.id}`}>
                        <Button variant="ghost" size="sm">
                          {t('viewProfile')}
                        </Button>
                      </Link>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Date & Time */}
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="size-4 text-[#4644b8]" />
                      <span className="font-medium text-[#282828]">
                        {format(scheduledDate, 'EEEE, MMMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="size-4 text-[#4644b8]" />
                      <span className="text-[#515151]">
                        {format(scheduledDate, 'h:mm a')} ({interview.duration} {t('minutes')})
                      </span>
                    </div>

                    {/* Job Details */}
                    {(interview.jobPosition || interview.jobLocation || interview.salary) && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          {interview.jobPosition && (
                            <div className="flex items-center gap-2 text-sm">
                              <Briefcase className="size-4 text-[#4644b8]" />
                              <span className="text-[#515151]">{interview.jobPosition}</span>
                            </div>
                          )}
                          {interview.jobLocation && (
                            <div className="flex items-center gap-2 text-sm">
                              <MapPin className="size-4 text-[#4644b8]" />
                              <span className="text-[#515151]">{interview.jobLocation}</span>
                            </div>
                          )}
                          {interview.salary && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-[#4644b8]">💰</span>
                              <span className="text-[#515151]">{interview.salary}</span>
                            </div>
                          )}
                        </div>
                      </>
                    )}

                    {/* Meeting Link */}
                    {interview.meetingLink && (
                      <>
                        <Separator />
                        <div>
                          <a
                            href={interview.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-[#4644b8] hover:underline"
                          >
                            <Video className="size-4" />
                            <span>{t('joinMeeting')}</span>
                            <ExternalLink className="size-3" />
                          </a>
                        </div>
                      </>
                    )}

                    {/* Notes */}
                    {interview.notes && (
                      <>
                        <Separator />
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <FileText className="size-4 text-[#4644b8]" />
                            <span className="text-sm font-medium text-[#282828]">{t('notes')}</span>
                          </div>
                          <p className="text-sm text-[#515151] whitespace-pre-wrap">{interview.notes}</p>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Past Interviews */}
      {pastInterviews.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-[#282828] mb-4">{t('pastInterviews')}</h2>
          <div className="space-y-4">
            {pastInterviews.map((interview) => {
              const scheduledDate = new Date(interview.scheduledAt)
              const initials = `${interview.candidate.firstName?.[0] || ''}${interview.candidate.lastName?.[0] || ''}`.toUpperCase()

              return (
                <Card key={interview.id} className="overflow-hidden opacity-75">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-10 shrink-0">
                          {interview.candidate.profilePictureUrl ? (
                            <AvatarImage src={interview.candidate.profilePictureUrl} />
                          ) : null}
                          <AvatarFallback className="bg-[#ededed] text-[#282828] text-sm font-semibold">
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-[#282828]">
                            {interview.candidate.firstName} {interview.candidate.lastName}
                          </p>
                          <p className="text-xs text-[#757575]">
                            {format(scheduledDate, 'MMM d, yyyy • h:mm a')}
                          </p>
                        </div>
                      </div>
                      <Link href={`/candidates/${interview.candidate.id}`}>
                        <Button variant="ghost" size="sm">
                          {t('view')}
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {interviews.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Calendar className="mb-4 h-12 w-12 text-[#cbcbcb]" />
            <h3 className="mb-2 text-lg font-semibold text-[#282828]">{t('noScheduledInterviews')}</h3>
            <p className="text-sm text-[#757575]">
              {t('noScheduledDescription')}
            </p>
            <Link href="/candidates" className="mt-4">
              <Button variant="outline" className="border-[#4644b8] text-[#4644b8]">
                {t('browseCandidates')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

