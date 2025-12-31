'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Calendar, Clock, MapPin, Briefcase, DollarSign, Home, Car, ArrowLeft, Video, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { acceptInterview, rejectInterview } from '@/lib/candidate/interviews'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Candidate } from '@/payload-types'
import type { InterviewListItem } from '@/lib/payload/interviews'
import { cn } from '@/lib/utils'

interface CandidateInterviewsPageProps {
  candidate: Candidate
  interviews: InterviewListItem[]
}

export function CandidateInterviewsPage({
  candidate,
  interviews: initialInterviews,
}: CandidateInterviewsPageProps) {
  const router = useRouter()
  const [interviews, setInterviews] = useState(initialInterviews)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const handleAccept = async (interviewId: number) => {
    setProcessingId(interviewId)
    try {
      const result = await acceptInterview(interviewId)
      if (result.success) {
        toast.success('Interview accepted successfully!')
        setInterviews((prev) =>
          prev.map((i) => (i.id === interviewId ? { ...i, status: 'scheduled' } : i)),
        )
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to accept interview')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (interviewId: number) => {
    setProcessingId(interviewId)
    try {
      const result = await rejectInterview(interviewId)
      if (result.success) {
        toast.success('Interview rejected')
        setInterviews((prev) => prev.filter((i) => i.id !== interviewId))
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reject interview')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      scheduled: { label: 'Awaiting Your Response', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', className: 'bg-gray-100 text-gray-800' },
      rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
      no_show: { label: 'No Show', className: 'bg-orange-100 text-orange-800' },
    }

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 text-gray-800' }

    return (
      <Badge className={cn('text-xs font-medium', config.className)}>{config.label}</Badge>
    )
  }

  const scheduledInterviews = interviews.filter((i) => i.status === 'scheduled')
  const otherInterviews = interviews.filter((i) => i.status !== 'scheduled')

  const renderInterviewCard = (interview: InterviewListItem) => {
    const interviewDate = new Date(interview.scheduledAt)

    return (
      <Card key={interview.id} className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg font-semibold text-[#282828]">
                {interview.employer.companyName}
              </CardTitle>
              <CardDescription className="mt-1">
                {getStatusBadge(interview.status)}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Date and Time */}
          <div className="flex items-center gap-2 text-sm text-[#515151]">
            <Calendar className="h-4 w-4" />
            <span>{format(interviewDate, 'EEEE, MMMM d, yyyy')}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-[#515151]">
            <Clock className="h-4 w-4" />
            <span>{format(interviewDate, 'h:mm a')} ({interview.duration} minutes)</span>
          </div>

          {/* Job Details (if available) */}
          {interview.jobPosition && (
            <>
              <div className="flex items-center gap-2 text-sm text-[#515151]">
                <Briefcase className="h-4 w-4" />
                <span>{interview.jobPosition}</span>
              </div>
              {interview.jobLocation && (
                <div className="flex items-center gap-2 text-sm text-[#515151]">
                  <MapPin className="h-4 w-4" />
                  <span>{interview.jobLocation}</span>
                </div>
              )}
              {interview.salary && (
                <div className="flex items-center gap-2 text-sm text-[#515151]">
                  <DollarSign className="h-4 w-4" />
                  <span>{interview.salary}</span>
                </div>
              )}
              {(interview.accommodationIncluded || interview.transportation) && (
                <div className="flex items-center gap-4 text-sm text-[#515151]">
                  {interview.accommodationIncluded && (
                    <div className="flex items-center gap-1">
                      <Home className="h-4 w-4" />
                      <span>Accommodation</span>
                    </div>
                  )}
                  {interview.transportation && (
                    <div className="flex items-center gap-1">
                      <Car className="h-4 w-4" />
                      <span>Transportation</span>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Action Buttons for Scheduled Interviews */}
          {interview.status === 'scheduled' && (
            <div className="flex gap-3 pt-2">
              <Button
                onClick={() => handleAccept(interview.id)}
                disabled={processingId === interview.id}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <Check className="mr-2 h-4 w-4" />
                {processingId === interview.id ? 'Processing...' : 'Accept'}
              </Button>
              <Button
                onClick={() => handleReject(interview.id)}
                disabled={processingId === interview.id}
                variant="destructive"
                className="flex-1"
              >
                <X className="mr-2 h-4 w-4" />
                {processingId === interview.id ? 'Processing...' : 'Reject'}
              </Button>
            </div>
          )}

          {/* Meeting Link (only show after accepted) */}
          {interview.meetingLink && interview.status === 'scheduled' && (
            <div className="pt-2">
              <Link href={interview.meetingLink} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" size="sm" className="w-full">
                  <Video className="mr-2 h-4 w-4" />
                  Join Meeting
                </Button>
              </Link>
            </div>
          )}

          {/* Notes */}
          {interview.notes && (
            <div className="rounded-lg bg-[#f5f5f5] p-3 text-sm text-[#515151]">
              <p className="font-medium">Notes:</p>
              <p className="mt-1">{interview.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-6 flex items-center gap-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="h-10 w-10">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">My Interviews</h1>
            <p className="text-sm text-[#757575]">
              {interviews.length} interview{interviews.length !== 1 ? 's' : ''} total
            </p>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="scheduled" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="scheduled">
              Awaiting Response ({scheduledInterviews.length})
            </TabsTrigger>
            <TabsTrigger value="all">All ({interviews.length})</TabsTrigger>
            <TabsTrigger value="other">History ({otherInterviews.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="scheduled" className="space-y-4">
            {scheduledInterviews.length > 0 ? (
              scheduledInterviews.map(renderInterviewCard)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="mb-4 h-12 w-12 text-[#cbcbcb]" />
                  <h3 className="mb-2 text-lg font-semibold text-[#282828]">No interviews awaiting response</h3>
                  <p className="text-sm text-[#757575]">
                    You don't have any interview requests awaiting your response.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {interviews.length > 0 ? (
              interviews.map(renderInterviewCard)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="mb-4 h-12 w-12 text-[#cbcbcb]" />
                  <h3 className="mb-2 text-lg font-semibold text-[#282828]">No interviews</h3>
                  <p className="text-sm text-[#757575]">
                    You don't have any interview requests yet.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="other" className="space-y-4">
            {otherInterviews.length > 0 ? (
              otherInterviews.map(renderInterviewCard)
            ) : (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Calendar className="mb-4 h-12 w-12 text-[#cbcbcb]" />
                  <h3 className="mb-2 text-lg font-semibold text-[#282828]">No interview history</h3>
                  <p className="text-sm text-[#757575]">
                    You don't have any completed, cancelled, or rejected interviews.
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

