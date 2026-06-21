'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import {
  Briefcase,
  Check,
  ExternalLink,
  Globe,
  MapPin,
  MessageSquareText,
  User,
  X,
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
import {
  approveCandidateProfile,
  rejectCandidateProfile,
  requestCandidateProfileChanges,
} from '@/lib/admin/candidate-moderation'
import { profileStatusLabel } from '@/lib/candidates/profile-status'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { jobMatrixPathWithFallback } from '@/lib/candidates/job-matrix-selection'
import type { Candidate } from '@/payload-types'
import { cn } from '@/lib/utils'

interface PendingCandidatesPageProps {
  candidates: Candidate[]
  locale: string
}

type DialogMode = 'reject' | 'changes' | null

export function PendingCandidatesPage({
  candidates: initialCandidates,
  locale,
}: PendingCandidatesPageProps) {
  const router = useRouter()
  const [candidates, setCandidates] = useState(initialCandidates)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [dialogMode, setDialogMode] = useState<DialogMode>(null)
  const [dialogTargetId, setDialogTargetId] = useState<number | null>(null)
  const [feedback, setFeedback] = useState('')

  const base = `/${locale}`

  const closeDialog = () => {
    setDialogMode(null)
    setDialogTargetId(null)
    setFeedback('')
  }

  const openDialog = (mode: DialogMode, id: number) => {
    setDialogMode(mode)
    setDialogTargetId(id)
    setFeedback('')
  }

  const handleApprove = async (candidateId: number) => {
    setProcessingId(candidateId)
    try {
      const result = await approveCandidateProfile(candidateId)
      if (result.success) {
        toast.success('Profile approved — candidate is now live')
        setCandidates((prev) => prev.filter((c) => c.id !== candidateId))
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

  const handleDialogConfirm = async () => {
    if (dialogTargetId == null || !dialogMode) return
    setProcessingId(dialogTargetId)
    try {
      const result =
        dialogMode === 'reject'
          ? await rejectCandidateProfile(dialogTargetId, feedback.trim() || undefined)
          : await requestCandidateProfileChanges(dialogTargetId, feedback.trim())

      if (result.success) {
        toast.success(dialogMode === 'reject' ? 'Profile rejected' : 'Changes requested')
        setCandidates((prev) => prev.filter((c) => c.id !== dialogTargetId))
        router.refresh()
        closeDialog()
      } else {
        toast.error(result.error || 'Action failed')
      }
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'An error occurred')
    } finally {
      setProcessingId(null)
    }
  }

  const careerPathway = (candidate: Candidate) => {
    const path = jobMatrixPathWithFallback(candidate.primarySkill, locale)
    return path.careerPathway || '—'
  }

  return (
    <>
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-[#16252d] sm:text-2xl">
              Candidate profiles awaiting review
            </h1>
            <p className="mt-1 text-sm text-[#757575]">
              {candidates.length} profile{candidates.length !== 1 ? 's' : ''} waiting for approval
            </p>
          </div>
          <Button variant="outline" className="w-full shrink-0 border-[#e5e5e5] sm:w-auto" asChild>
            <Link href={`${base}/moderator`}>
              Moderator dashboard
              <ExternalLink className="ml-2 h-4 w-4 opacity-70" aria-hidden />
            </Link>
          </Button>
        </div>

        <Separator className="mb-6 bg-[#e5e5e5]" />

        <div id="moderator-candidates-pending-list" className="scroll-mt-24 space-y-6">
          {candidates.length > 0 ? (
            candidates.map((candidate) => {
              const isProcessing = processingId === candidate.id
              const submitted = candidate.moderation?.submittedAt
                ? new Date(candidate.moderation.submittedAt)
                : candidate.createdAt
                  ? new Date(candidate.createdAt)
                  : null

              return (
                <Card
                  key={candidate.id}
                  id={`moderator-candidate-${candidate.id}`}
                  className={cn(
                    'scroll-mt-28 overflow-hidden border-[#e5e5e5] bg-white shadow-sm',
                    'border-l-4 border-l-[#4644b8]',
                  )}
                >
                  <CardHeader className="pb-3">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <CardTitle className="text-base font-semibold text-[#16252d] sm:text-lg">
                          {candidate.firstName} {candidate.lastName}
                        </CardTitle>
                        <CardDescription className="mt-2 space-y-1 text-sm text-[#515151]">
                          <span className="flex items-center gap-1.5">
                            <Briefcase className="h-3.5 w-3.5" aria-hidden />
                            {candidate.jobTitle}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" aria-hidden />
                            {candidate.location}
                            <span className="text-[#cbcbcb]">·</span>
                            <Globe className="h-3.5 w-3.5" aria-hidden />
                            {candidate.nationality}
                          </span>
                        </CardDescription>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Badge className="border-[#4644b8]/25 bg-[#ecf2ff] font-medium text-[#4644b8]">
                            {profileStatusLabel(candidate.profileStatus)}
                          </Badge>
                          {submitted && (
                            <Badge variant="outline" className="text-[#757575]">
                              Submitted {format(submitted, 'dd MMM yyyy')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4 pt-0">
                    <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                      <div className="sm:col-span-2 lg:col-span-4">
                        <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">
                          Career pathway
                        </p>
                        <p className="mt-0.5 text-[#16252d]">{careerPathway(candidate)}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Experience</p>
                        <p className="mt-0.5 text-[#16252d]">{candidate.experienceYears} years</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Email</p>
                        <p className="mt-0.5 break-all text-[#16252d]">{candidate.email}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium uppercase tracking-wide text-[#757575]">Phone</p>
                        <p className="mt-0.5 text-[#16252d]">{candidate.phone}</p>
                      </div>
                    </div>

                    {candidate.aboutMe && (
                      <div className="rounded-lg border border-[#e5e5e5] bg-[#fafafa] p-4">
                        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-[#4644b8]">
                          About
                        </p>
                        <p className="whitespace-pre-wrap text-sm text-[#515151]">{candidate.aboutMe}</p>
                      </div>
                    )}

                    <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                      <Button variant="outline" className="border-[#e5e5e5]" asChild>
                        <Link href={`${base}/moderator/profiles/candidate/${candidate.id}`}>
                          <User className="mr-2 h-4 w-4" aria-hidden />
                          Open full profile
                        </Link>
                      </Button>
                      <Button
                        className="bg-[#4644b8] text-white hover:bg-[#3a3aa0]"
                        disabled={isProcessing}
                        onClick={() => handleApprove(candidate.id)}
                      >
                        <Check className="mr-2 h-4 w-4" aria-hidden />
                        Approve
                      </Button>
                      <Button
                        variant="outline"
                        className="border-amber-200 text-amber-900 hover:bg-amber-50"
                        disabled={isProcessing}
                        onClick={() => openDialog('changes', candidate.id)}
                      >
                        <MessageSquareText className="mr-2 h-4 w-4" aria-hidden />
                        Request changes
                      </Button>
                      <Button
                        variant="outline"
                        className="border-red-200 text-red-700 hover:bg-red-50"
                        disabled={isProcessing}
                        onClick={() => openDialog('reject', candidate.id)}
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
            <Card className="border-[#e5e5e5] bg-white">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <User className="mb-4 h-12 w-12 text-[#cbcbcb]" aria-hidden />
                <p className="text-lg font-semibold text-[#16252d]">Queue is clear</p>
                <p className="mt-1 text-sm text-[#757575]">No candidate profiles are waiting for review.</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <AlertDialog open={dialogMode !== null} onOpenChange={(open) => !open && closeDialog()}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dialogMode === 'reject' ? 'Reject profile' : 'Request changes'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {dialogMode === 'reject'
                ? 'The candidate will be notified by email. They can update their profile and resubmit.'
                : 'Describe what the candidate should fix. They will receive this feedback by email.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="moderation-feedback">
              {dialogMode === 'reject' ? 'Reason (optional)' : 'Required feedback'}
            </Label>
            <Textarea
              id="moderation-feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder={
                dialogMode === 'reject'
                  ? 'Why this profile cannot be published…'
                  : 'e.g. Update job title, upload CV, fix visa details…'
              }
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingId !== null}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleDialogConfirm}
              disabled={processingId !== null || (dialogMode === 'changes' && !feedback.trim())}
              className={
                dialogMode === 'reject'
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-[#4644b8] hover:bg-[#3a3aa0]'
              }
            >
              {dialogMode === 'reject' ? 'Reject profile' : 'Send feedback'}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
