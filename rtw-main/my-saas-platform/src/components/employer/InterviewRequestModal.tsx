'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { CandidateProfileCard } from './CandidateProfileCard'
import { InterviewRequestForm } from './InterviewRequestForm'
import type { CandidateDetail, CandidateListItem } from '@/lib/payload/candidates'

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-[#141514] capitalize">
            Send invitation to Candidate
          </DialogTitle>
          <DialogDescription className="sr-only">
            Fill out the form to send an interview invitation to the candidate
          </DialogDescription>
        </DialogHeader>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md">
            Invitation sent successfully! The request is pending moderator approval.
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Left Column: Candidate Profile */}
          <div className="flex justify-center lg:justify-start">
            <CandidateProfileCard candidate={candidate} />
          </div>

          {/* Right Column: Interview Request Form */}
          <div className="flex-1">
            <InterviewRequestForm
              candidateId={candidate.id}
              onSuccess={handleSuccess}
              onError={handleError}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

