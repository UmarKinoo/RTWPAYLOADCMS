'use client'

import React, { useState } from 'react'
import { format } from 'date-fns'
import { Calendar, Clock, Briefcase, MapPin, DollarSign, Home, Car, Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { approveInterviewRequest, rejectInterviewRequest } from '@/lib/admin/interview-moderation'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Interview } from '@/payload-types'
import { cn } from '@/lib/utils'

interface PendingInterviewsPageProps {
  interviews: Interview[]
}

export function PendingInterviewsPage({ interviews: initialInterviews }: PendingInterviewsPageProps) {
  const router = useRouter()
  const [interviews, setInterviews] = useState(initialInterviews)
  const [processingId, setProcessingId] = useState<number | null>(null)

  const handleApprove = async (interviewId: number) => {
    setProcessingId(interviewId)
    try {
      const result = await approveInterviewRequest(interviewId)
      if (result.success) {
        toast.success('Interview request approved successfully')
        setInterviews((prev) => prev.filter((i) => i.id !== interviewId))
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve interview request')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (interviewId: number, reason?: string) => {
    setProcessingId(interviewId)
    try {
      const result = await rejectInterviewRequest(interviewId, reason)
      if (result.success) {
        toast.success('Interview request rejected')
        setInterviews((prev) => prev.filter((i) => i.id !== interviewId))
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to reject interview request')
      }
    } catch (error: any) {
      toast.error(error.message || 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const getEmployerName = (interview: Interview) => {
    if (typeof interview.employer === 'object' && interview.employer) {
      return interview.employer.companyName || interview.employer.email || 'Unknown Employer'
    }
    return 'Unknown Employer'
  }

  const getCandidateName = (interview: Interview) => {
    if (typeof interview.candidate === 'object' && interview.candidate) {
      return `${interview.candidate.firstName} ${interview.candidate.lastName}`
    }
    return 'Unknown Candidate'
  }

  return (
    <div className="min-h-screen bg-[#f5f5f5] p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-[#282828] sm:text-3xl">
            Pending Interview Requests
          </h1>
          <p className="mt-2 text-sm text-[#757575]">
            {interviews.length} pending request{interviews.length !== 1 ? 's' : ''} awaiting moderation
          </p>
        </div>

        {/* Interviews List */}
        {interviews.length > 0 ? (
          <div className="space-y-4">
            {interviews.map((interview) => {
              const interviewDate = interview.scheduledAt ? new Date(interview.scheduledAt) : null

              return (
                <Card key={interview.id} className="border-l-4 border-l-yellow-500">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg font-semibold text-[#282828]">
                          {getEmployerName(interview)} → {getCandidateName(interview)}
                        </CardTitle>
                        <CardDescription className="mt-1">
                          <Badge className="bg-yellow-100 text-yellow-800">Pending Approval</Badge>
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Interview Details */}
                    <div className="grid gap-3 sm:grid-cols-2">
                      {interviewDate && (
                        <>
                          <div className="flex items-center gap-2 text-sm text-[#515151]">
                            <Calendar className="h-4 w-4" />
                            <span>{format(interviewDate, 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-[#515151]">
                            <Clock className="h-4 w-4" />
                            <span>
                              {format(interviewDate, 'h:mm a')} ({interview.duration || 30} minutes)
                            </span>
                          </div>
                        </>
                      )}

                      {interview.jobPosition && (
                        <div className="flex items-center gap-2 text-sm text-[#515151]">
                          <Briefcase className="h-4 w-4" />
                          <span>{interview.jobPosition}</span>
                        </div>
                      )}

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
                              <span>Accommodation Included</span>
                            </div>
                          )}
                          {interview.transportation && (
                            <div className="flex items-center gap-1">
                              <Car className="h-4 w-4" />
                              <span>Transportation Provided</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {interview.requestedAt && (
                      <p className="text-xs text-[#757575]">
                        Requested: {format(new Date(interview.requestedAt), 'MMM d, yyyy • h:mm a')}
                      </p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        onClick={() => handleApprove(interview.id)}
                        disabled={processingId === interview.id}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" />
                        {processingId === interview.id ? 'Processing...' : 'Approve'}
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
                  </CardContent>
                </Card>
              )
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Check className="mb-4 h-12 w-12 text-green-500" />
              <h3 className="mb-2 text-lg font-semibold text-[#282828]">All caught up!</h3>
              <p className="text-sm text-[#757575]">
                There are no pending interview requests at the moment.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}





