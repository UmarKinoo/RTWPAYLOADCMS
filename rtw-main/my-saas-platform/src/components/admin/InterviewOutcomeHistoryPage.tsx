'use client'

import Link from 'next/link'
import { format } from 'date-fns'
import { ExternalLink, History } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import type { Interview } from '@/payload-types'
import {
  formatOutcomeAction,
  formatOutcomeActor,
} from '@/lib/admin/interview-outcome'

interface InterviewOutcomeHistoryPageProps {
  interviews: Interview[]
  locale: string
}

function partyName(
  party: Interview['candidate'] | Interview['employer'],
  kind: 'candidate' | 'employer',
): string {
  if (typeof party === 'object' && party) {
    if (kind === 'candidate' && 'firstName' in party) {
      return `${party.firstName} ${party.lastName}`.trim()
    }
    if (kind === 'employer' && 'companyName' in party) {
      return party.companyName || party.email || 'Employer'
    }
  }
  return kind === 'candidate' ? 'Unknown candidate' : 'Unknown employer'
}

export function InterviewOutcomeHistoryPage({
  interviews,
  locale,
}: InterviewOutcomeHistoryPageProps) {
  const base = `/${locale}`

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[#16252d] sm:text-2xl">
            Interview outcome history
          </h1>
          <p className="mt-1 text-sm text-[#757575]">
            Recent approvals, rejections, and cancellations — including who took the action.
          </p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button variant="outline" className="border-[#e5e5e5]" asChild>
            <Link href={`${base}/moderator/interviews/pending`}>Pending queue</Link>
          </Button>
          <Button variant="outline" className="border-[#e5e5e5]" asChild>
            <Link href={`${base}/moderator`}>
              Moderator dashboard
              <ExternalLink className="ml-2 h-4 w-4 opacity-70" aria-hidden />
            </Link>
          </Button>
        </div>
      </div>

      {interviews.length === 0 ? (
        <Card className="border-[#e5e5e5] bg-white shadow-sm">
          <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
            <History className="h-10 w-10 text-[#cbcbcb]" aria-hidden />
            <p className="text-sm text-[#757575]">No outcome history yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {interviews.map((interview) => {
            const history = Array.isArray(interview.outcomeHistory)
              ? [...interview.outcomeHistory].reverse()
              : []
            const latest = history[0]
            const rejectedLabel = interview.rejectedBy
              ? formatOutcomeActor(interview.rejectedBy)
              : null

            return (
              <Card key={interview.id} className="border-[#e5e5e5] bg-white shadow-sm">
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <CardTitle className="text-base text-[#16252d]">
                        Interview #{interview.id}
                      </CardTitle>
                      <CardDescription className="mt-1 text-sm text-[#515151]">
                        {partyName(interview.candidate, 'candidate')}
                        <span className="text-[#cbcbcb]"> · </span>
                        {partyName(interview.employer, 'employer')}
                      </CardDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="secondary" className="capitalize">
                        {interview.status}
                      </Badge>
                      {rejectedLabel && (
                        <Badge className="border-rose-200 bg-rose-50 text-rose-800">
                          Rejected/cancelled by {rejectedLabel}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {interview.rejectionReason && (
                    <p className="rounded-md border border-[#e5e5e5] bg-[#fafafa] px-3 py-2 text-sm text-[#515151]">
                      <span className="font-medium text-[#16252d]">Reason: </span>
                      {interview.rejectionReason}
                    </p>
                  )}
                  {latest?.at && (
                    <p className="text-xs text-[#757575]">
                      Latest:{' '}
                      {formatOutcomeAction(latest.action || undefined)} by{' '}
                      {formatOutcomeActor(latest.actor || undefined)} on{' '}
                      {format(new Date(latest.at), 'MMM d, yyyy · h:mm a')}
                    </p>
                  )}
                  {history.length > 0 && (
                    <ul className="space-y-2 border-t border-[#e5e5e5] pt-3">
                      {history.map((row, idx) => (
                        <li
                          key={row.id || `${interview.id}-${idx}`}
                          className="flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm text-[#515151]"
                        >
                          <span className="font-medium text-[#16252d]">
                            {formatOutcomeAction(row.action || undefined)}
                          </span>
                          <span>by {formatOutcomeActor(row.actor || undefined)}</span>
                          {row.at && (
                            <span className="text-xs text-[#757575]">
                              {format(new Date(row.at), 'MMM d, yyyy · h:mm a')}
                            </span>
                          )}
                          {row.reason && (
                            <span className="w-full text-xs text-[#757575]">— {row.reason}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
