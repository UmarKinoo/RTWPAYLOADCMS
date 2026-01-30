'use client'

import React from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Clock, Briefcase, MapPin, DollarSign, Home, Car, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { PendingInterviewRequest } from '@/lib/payload/employer-views'

interface PendingRequestsViewProps {
  requests: PendingInterviewRequest[]
}

export function PendingRequestsView({ requests }: PendingRequestsViewProps) {
  const t = useTranslations('employerDashboard.pendingRequests')
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
            {requests.length === 1
              ? t('requestsAwaiting', { count: 1 })
              : t('requestsAwaitingPlural', { count: requests.length })}
          </p>
        </div>
      </div>

      {/* Requests List */}
      {requests.length > 0 ? (
        <div className="space-y-4">
          {requests.map((request) => {
            const requestedDate = new Date(request.requestedAt)
            const initials = `${request.candidate.firstName?.[0] || ''}${request.candidate.lastName?.[0] || ''}`.toUpperCase()

            return (
              <Card key={request.id} className="overflow-hidden border-yellow-200 bg-yellow-50/30">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <Avatar className="size-12 shrink-0 border-2 border-yellow-300">
                        {request.candidate.profilePictureUrl ? (
                          <AvatarImage src={request.candidate.profilePictureUrl} alt={`${request.candidate.firstName} ${request.candidate.lastName}`} />
                        ) : null}
                        <AvatarFallback className="bg-yellow-100 text-[#282828] font-semibold">
                          {initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-lg">
                            {request.candidate.firstName} {request.candidate.lastName}
                          </CardTitle>
                          <Badge className="bg-yellow-500 text-white">{t('pending')}</Badge>
                        </div>
                        {request.candidate.jobTitle && (
                          <p className="text-sm text-[#757575]">{request.candidate.jobTitle}</p>
                        )}
                        <p className="text-xs text-[#757575] mt-1">
                          {t('requested')}{format(requestedDate, 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                    </div>
                    <Link href={`/candidates/${request.candidate.id}`}>
                      <Button variant="ghost" size="sm">
                        {t('viewProfile')}
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Job Details */}
                  {(request.jobPosition || request.jobLocation || request.salary) && (
                    <div className="space-y-2">
                      {request.jobPosition && (
                        <div className="flex items-center gap-2 text-sm">
                          <Briefcase className="size-4 text-[#4644b8]" />
                          <span className="text-[#515151] font-medium">{request.jobPosition}</span>
                        </div>
                      )}
                      {request.jobLocation && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin className="size-4 text-[#4644b8]" />
                          <span className="text-[#515151]">{request.jobLocation}</span>
                        </div>
                      )}
                      {request.salary && (
                        <div className="flex items-center gap-2 text-sm">
                          <DollarSign className="size-4 text-[#4644b8]" />
                          <span className="text-[#515151]">{request.salary}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Benefits */}
                  {(request.accommodationIncluded || request.transportation) && (
                    <>
                      <Separator />
                      <div className="flex flex-wrap gap-3">
                        {request.accommodationIncluded && (
                          <Badge variant="outline" className="gap-1.5">
                            <Home className="size-3" />
                            {t('accommodation')}
                          </Badge>
                        )}
                        {request.transportation && (
                          <Badge variant="outline" className="gap-1.5">
                            <Car className="size-3" />
                            {t('transportation')}
                          </Badge>
                        )}
                      </div>
                    </>
                  )}

                  {/* Status Message */}
                  <div className="rounded-lg bg-yellow-100 border border-yellow-200 p-3">
                    <div className="flex items-start gap-2">
                      <Clock className="size-4 text-yellow-700 shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-800">
                        {t('pendingMessage')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <Clock className="mb-4 h-12 w-12 text-[#cbcbcb]" />
            <h3 className="mb-2 text-lg font-semibold text-[#282828]">{t('noPendingRequests')}</h3>
            <p className="text-sm text-[#757575]">
              {t('noPendingDescription')}
            </p>
            <div className="flex gap-3 mt-4">
              <Link href="/employer/dashboard?view=interviews">
                <Button variant="outline" className="border-[#4644b8] text-[#4644b8]">
                  {t('viewScheduled')}
                </Button>
              </Link>
              <Link href="/candidates">
                <Button variant="outline" className="border-[#4644b8] text-[#4644b8]">
                  {t('browseCandidates')}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

