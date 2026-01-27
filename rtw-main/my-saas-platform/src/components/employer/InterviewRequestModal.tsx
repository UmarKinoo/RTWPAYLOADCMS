'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { CandidateProfileCard } from './CandidateProfileCard'
import { InterviewRequestForm } from './InterviewRequestForm'
import type { CandidateDetail, CandidateListItem } from '@/lib/payload/candidates'
import { CheckCircle2, AlertCircle, User, CalendarClock } from 'lucide-react'
import { cn } from '@/lib/utils'

interface InterviewRequestModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  candidate: CandidateDetail | CandidateListItem
}

export function InterviewRequestModal({
  open,
  onOpenChange,
  candidate,
}: InterviewRequestModalProps) {
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = () => {
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      onOpenChange(false)
    }, 2000)
  }

  const handleError = (errorMessage: string) => {
    setError(errorMessage)
    setTimeout(() => {
      setError(null)
    }, 5000)
  }

  const candidateName = `${candidate.firstName} ${candidate.lastName}`

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'max-w-2xl sm:max-w-3xl lg:max-w-4xl max-h-[90vh] overflow-hidden',
          'rounded-xl border border-[#e5e5e5] bg-white shadow-xl p-0 gap-0'
        )}
        showCloseButton
      >
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-[#16252d]">
            Request interview with {candidateName}
          </DialogTitle>
          <DialogDescription className="text-sm text-[#757575] mt-1">
            Set date, time, role, and location. The request will be sent for approval.
          </DialogDescription>
        </DialogHeader>

        {(success || error) && (
          <div className="px-6 shrink-0">
            {success && (
              <Alert className="border-emerald-200 bg-emerald-50 text-emerald-800 [&>svg]:text-emerald-600 shadow-sm">
                <CheckCircle2 className="size-4" />
                <AlertTitle className="font-semibold">Invitation sent</AlertTitle>
                <AlertDescription>
                  Your request has been sent and is pending moderator approval. The candidate will be notified once approved.
                </AlertDescription>
              </Alert>
            )}
            {error && (
              <Alert variant="destructive" className="shadow-sm">
                <AlertCircle className="size-4" />
                <AlertTitle className="font-semibold">Request failed</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <Separator className="bg-[#e5e5e5]" />

        <ScrollArea className="max-h-[calc(90vh-12rem)]">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,280px)_1fr] gap-6 lg:gap-8 p-6">
            {/* Left: Candidate profile */}
            <div className="flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#757575]">
                <User className="size-3.5" aria-hidden />
                Candidate
              </p>
              <Card className="overflow-hidden border-[#e5e5e5] bg-[#fafafa] shadow-sm">
                <CardContent className="p-4 sm:p-5">
                  <CandidateProfileCard candidate={candidate} />
                </CardContent>
              </Card>
            </div>

            {/* Right: Form */}
            <div className="min-w-0 flex flex-col gap-2">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#757575]" id="request-details-label">
                <CalendarClock className="size-3.5" aria-hidden />
                Schedule & details
              </p>
              <InterviewRequestForm
                candidateId={candidate.id}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  )
}

