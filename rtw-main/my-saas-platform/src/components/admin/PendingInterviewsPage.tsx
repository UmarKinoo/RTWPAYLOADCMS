'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Calendar,
  Clock,
  Briefcase,
  MapPin,
  DollarSign,
  Home,
  Car,
  Check,
  X,
  Inbox,
  Building2,
  User,
  Mail,
  Phone,
  MessageSquareText,
  ExternalLink,
  Hash,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { approveInterviewRequest, rejectInterviewRequest } from '@/lib/admin/interview-moderation'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import type { Interview } from '@/payload-types'
import { cn } from '@/lib/utils'

interface PendingInterviewsPageProps {
  interviews: Interview[]
  locale: string
}

export function PendingInterviewsPage({
  interviews: initialInterviews,
  locale,
}: PendingInterviewsPageProps) {
  const router = useRouter()
  const [interviews, setInterviews] = useState(initialInterviews)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false)
  const [rejectTargetId, setRejectTargetId] = useState<number | null>(null)
  const [rejectReason, setRejectReason] = useState('')

  const handleApprove = async (interviewId: number) => {
    setProcessingId(interviewId)
    try {
      const result = await approveInterviewRequest(interviewId)
      if (result.success) {
        toast.success('Interview request approved')
        setInterviews((prev) => prev.filter((i) => i.id !== interviewId))
        router.refresh()
      } else {
        toast.error(result.error || 'Failed to approve')
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const openRejectDialog = (interviewId: number) => {
    setRejectTargetId(interviewId)
    setRejectReason('')
    setRejectDialogOpen(true)
  }

  const closeRejectDialog = () => {
    setRejectDialogOpen(false)
    setRejectTargetId(null)
    setRejectReason('')
  }

  const handleRejectConfirm = async () => {
    if (rejectTargetId == null) return
    setProcessingId(rejectTargetId)
    try {
      const result = await rejectInterviewRequest(rejectTargetId, rejectReason.trim() || undefined)
      if (result.success) {
        toast.success('Interview request rejected')
        setInterviews((prev) => prev.filter((i) => i.id !== rejectTargetId))
        router.refresh()
        closeRejectDialog()
      } else {
        toast.error(result.error || 'Failed to reject')
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
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

  const getEmployerId = (interview: Interview): number | null => {
    if (typeof interview.employer === 'object' && interview.employer) return interview.employer.id
    if (typeof interview.employer === 'number') return interview.employer
    return null
  }

  const getCandidateName = (interview: Interview) => {
    if (typeof interview.candidate === 'object' && interview.candidate) {
      return `${interview.candidate.firstName} ${interview.candidate.lastName}`
    }
    return 'Unknown Candidate'
  }

  const getCandidateId = (interview: Interview): number | null => {
    if (typeof interview.candidate === 'object' && interview.candidate) return interview.candidate.id
    if (typeof interview.candidate === 'number') return interview.candidate
    return null
  }

  const base = `/${locale}`

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#16252d] sm:text-2xl">
              Pending interview requests
            </h1>
            <p className="mt-1 text-sm text-[#757575]">
              {interviews.length} request{interviews.length !== 1 ? 's' : ''} awaiting your review
            </p>
          </div>
          <Button variant="outline" className="w-full shrink-0 border-[#e5e5e5] sm:w-auto" asChild>
            <Link href={`${base}/moderator`}>
              Moderator dashboard
              <ExternalLink className="ml-2 h-4 w-4 opacity-70" aria-hidden />
            </Link>
          </Button>
        </div>

        <div className="mb-6 rounded-lg border border-[#e5e5e5] bg-white p-4 shadow-sm">
          <p className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-[#4644b8]">
            <Hash className="h-3.5 w-3.5" aria-hidden />
            Jump to request
          </p>
          {interviews.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {interviews.map((i) => (
                <a
                  key={i.id}
                  href={`#moderator-interview-${i.id}`}
                  className="inline-flex items-center rounded-full border border-[#e5e5e5] bg-[#fafafa] px-3 py-1.5 text-xs font-medium text-[#16252d] transition-colors hover:border-[#4644b8]/40 hover:bg-[#ecf2ff]"
                >
                  #{i.id}{' '}
                  <span className="ml-1 max-w-[140px] truncate text-[#757575]">
                    {getEmployerName(i)}
                  </span>
                </a>
              ))}
            </div>
          ) : (
            <p className="text-sm text-[#757575]">No requests yet — anchors appear here when there are pending items.</p>
          )}
          <p className="mt-3 text-xs text-[#757575]">
            Tip: open full{' '}
            <a className="text-[#4644b8] underline-offset-2 hover:underline" href="#moderator-pending-list">
              employer & candidate profiles
            </a>{' '}
            from each card below.
          </p>
        </div>

        <Separator className="mb-6 bg-[#e5e5e5]" />

        <div id="moderator-pending-list" className="scroll-mt-24 space-y-6">
          {interviews.length > 0 ? (
            interviews.map((interview) => {
              const interviewDate = interview.scheduledAt ? new Date(interview.scheduledAt) : null
              const isProcessing = processingId === interview.id
              const employerId = getEmployerId(interview)
              const candidateId = getCandidateId(interview)
              const employerObj = typeof interview.employer === 'object' ? interview.employer : null
              const candidateObj = typeof interview.candidate === 'object' ? interview.candidate : null

              return (
                <Card
                  key={interview.id}
                  id={`moderator-interview-${interview.id}`}
                  className={cn(
                    'scroll-mt-28 overflow-hidden border-[#e5e5e5] bg-white shadow-sm',
                    'border-l-4 border-l-[#f6b500]',
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-[#16252d] sm:text-lg">
                          Request #{interview.id}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1 text-sm text-[#515151]">
                          <span className="font-medium text-[#16252d]">Employer:</span>{' '}
                          {getEmployerName(interview)}
                          <span className="text-[#cbcbcb]"> · </span>
                          <span className="font-medium text-[#16252d]">Candidate:</span>{' '}
                          {getCandidateName(interview)}
                        </CardDescription>
                        <div className="mt-2">
                          <Badge className="border-amber-200 bg-amber-50 font-medium text-amber-800">
                            Pending approval
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    {/* Employer message — notes from employer request */}
                    <div
                      className={cn(
                        'rounded-lg border p-4',
                        interview.notes
                          ? 'border-[#4644b8]/25 bg-[#f7f6ff]'
                          : 'border-dashed border-[#e5e5e5] bg-[#fafafa]',
                      )}
                    >
                      <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[#16252d]">
                        <MessageSquareText className="h-4 w-4 text-[#4644b8]" aria-hidden />
                        Message from employer
                      </div>
                      {interview.notes ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#282828]">
                          {interview.notes}
                        </p>
                      ) : (
                        <p className="text-sm italic text-[#757575]">
                          No additional message was provided with this request.
                        </p>
                      )}
                    </div>

                    <div className="grid gap-4 lg:grid-cols-2">
                      {/* Employer column */}
                      <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-[#16252d]">
                          <Building2 className="h-4 w-4 text-[#4644b8]" aria-hidden />
                          Employer
                        </div>
                        <ul className="space-y-2 text-sm text-[#515151]">
                          <li>
                            <span className="font-medium text-[#16252d]">Company:</span>{' '}
                            {employerObj?.companyName ?? '—'}
                          </li>
                          {employerObj?.email && (
                            <li className="flex items-start gap-2">
                              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                              <span className="break-all">{employerObj.email}</span>
                            </li>
                          )}
                          {employerObj?.phone && (
                            <li className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                              {employerObj.phone}
                            </li>
                          )}
                          {employerObj?.responsiblePerson && (
                            <li>
                              <span className="font-medium text-[#16252d]">Contact:</span>{' '}
                              {employerObj.responsiblePerson}
                            </li>
                          )}
                        </ul>
                        {employerId != null && (
                          <Button variant="outline" size="sm" className="mt-4 w-full border-[#e5e5e5]" asChild>
                            <Link href={`${base}/moderator/profiles/employer/${employerId}`}>
                              Open full employer profile
                              <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden />
                            </Link>
                          </Button>
                        )}
                      </div>

                      {/* Candidate column */}
                      <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-4">
                        <div className="mb-3 flex items-center gap-2 font-semibold text-[#16252d]">
                          <User className="h-4 w-4 text-[#4644b8]" aria-hidden />
                          Candidate
                        </div>
                        <ul className="space-y-2 text-sm text-[#515151]">
                          <li>
                            <span className="font-medium text-[#16252d]">Name:</span>{' '}
                            {getCandidateName(interview)}
                          </li>
                          {candidateObj?.jobTitle && (
                            <li className="flex items-start gap-2">
                              <Briefcase className="mt-0.5 h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                              {candidateObj.jobTitle}
                            </li>
                          )}
                          {candidateObj?.email && (
                            <li className="flex items-start gap-2">
                              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                              <span className="break-all">{candidateObj.email}</span>
                            </li>
                          )}
                          {candidateObj?.phone && (
                            <li className="flex items-center gap-2">
                              <Phone className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                              {candidateObj.phone}
                            </li>
                          )}
                          {candidateObj?.location && (
                            <li className="flex items-start gap-2">
                              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                              {candidateObj.location}
                            </li>
                          )}
                        </ul>
                        {candidateId != null && (
                          <Button variant="outline" size="sm" className="mt-4 w-full border-[#e5e5e5]" asChild>
                            <Link href={`${base}/moderator/profiles/candidate/${candidateId}`}>
                              Open full candidate profile
                              <ExternalLink className="ml-2 h-3.5 w-3.5" aria-hidden />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="grid gap-3 text-sm text-[#515151] sm:grid-cols-2">
                      {interviewDate && (
                        <>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                            <span>{format(interviewDate, 'EEEE, MMMM d, yyyy')}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                            <span>
                              {format(interviewDate, 'h:mm a')} ({interview.duration || 30} min)
                            </span>
                          </div>
                        </>
                      )}
                      {interview.jobPosition && (
                        <div className="flex items-center gap-2">
                          <Briefcase className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                          <span>{interview.jobPosition}</span>
                        </div>
                      )}
                      {interview.jobLocation && (
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                          <span>{interview.jobLocation}</span>
                        </div>
                      )}
                      {interview.salary && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 shrink-0 text-[#757575]" aria-hidden />
                          <span>{interview.salary}</span>
                        </div>
                      )}
                      {(interview.accommodationIncluded || interview.transportation) && (
                        <div className="flex flex-wrap items-center gap-3 sm:col-span-2">
                          {interview.accommodationIncluded && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs text-[#515151] ring-1 ring-[#e5e5e5]">
                              <Home className="h-3.5 w-3.5" aria-hidden />
                              Accommodation included
                            </span>
                          )}
                          {interview.transportation && (
                            <span className="inline-flex items-center gap-1.5 rounded-md bg-white px-2 py-1 text-xs text-[#515151] ring-1 ring-[#e5e5e5]">
                              <Car className="h-3.5 w-3.5" aria-hidden />
                              Transportation provided
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {interview.requestedAt && (
                      <p className="text-xs text-[#757575]">
                        Requested {format(new Date(interview.requestedAt), 'MMM d, yyyy · h:mm a')}
                      </p>
                    )}

                    <Separator className="bg-[#e5e5e5]" />

                    <div className="flex flex-col gap-2 sm:flex-row sm:gap-3">
                      <Button
                        onClick={() => handleApprove(interview.id)}
                        disabled={isProcessing}
                        className={cn(
                          'flex-1 font-medium',
                          'bg-[#4644b8] text-white hover:bg-[#3a3aa0] hover:text-white',
                        )}
                      >
                        <Check className="mr-2 h-4 w-4" aria-hidden />
                        {isProcessing ? 'Processing…' : 'Approve'}
                      </Button>
                      <Button
                        onClick={() => openRejectDialog(interview.id)}
                        disabled={isProcessing}
                        variant="destructive"
                        className="flex-1 font-medium"
                      >
                        <X className="mr-2 h-4 w-4" aria-hidden />
                        Reject
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })
          ) : (
            <Card className="border-[#e5e5e5] bg-white shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#ecf2ff] text-[#4644b8]">
                  <Inbox className="h-7 w-7" aria-hidden />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-[#16252d]">All caught up</h3>
                <p className="max-w-sm text-sm text-[#757575]">
                  There are no pending interview requests. New requests will appear here for you to approve
                  or reject.
                </p>
                <Button variant="outline" className="mt-6 border-[#e5e5e5]" asChild>
                  <Link href={`${base}/moderator`}>Back to moderator dashboard</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent className="border-[#e5e5e5] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#16252d]">Reject interview request?</AlertDialogTitle>
            <AlertDialogDescription className="text-[#515151]">
              The employer and candidate will be notified. You can add an optional reason below for the
              employer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-2 py-2">
            <Label htmlFor="reject-reason" className="text-sm font-medium text-[#16252d]">
              Reason (optional)
            </Label>
            <Textarea
              id="reject-reason"
              placeholder="e.g. Missing required documents, outside scope..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="min-h-20 resize-y border-[#e5e5e5] text-sm focus-visible:ring-[#4644b8]"
              rows={3}
            />
          </div>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel
              onClick={closeRejectDialog}
              className="border-[#e5e5e5] text-[#515151]"
            >
              Cancel
            </AlertDialogCancel>
            <Button
              variant="destructive"
              onClick={() => void handleRejectConfirm()}
              disabled={processingId != null}
              className="font-medium"
            >
              {processingId != null ? 'Rejecting…' : 'Reject'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
