import React from 'react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Users, DollarSign, MoreVertical, ChevronRight } from 'lucide-react'
import { getJobPostings } from '@/lib/payload/job-postings'

interface RecentCandidatesTableProps {
  employerId: number
}

export async function RecentCandidatesTable({ employerId }: RecentCandidatesTableProps) {
  const jobPostings = await getJobPostings(employerId, { status: 'active' })
  const recentPostings = jobPostings.slice(0, 3)
  const t = await getTranslations('employerDashboard.recentCandidates')

  // Format salary range
  const formatSalary = (min?: number, max?: number) => {
    if (!min && !max) return 'N/A'
    if (min && max) return `${min}$ - ${max}$`
    if (min) return `${min}$+`
    return `Up to ${max}$`
  }

  // Calculate days remaining
  const getDaysRemaining = (expiresAt?: string) => {
    if (!expiresAt) return 'N/A'
    const expiry = new Date(expiresAt)
    const now = new Date()
    const diff = expiry.getTime() - now.getTime()
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24))
    return days > 0 ? days : 0
  }
  return (
    <Card className="flex flex-col gap-4 overflow-hidden rounded-2xl bg-white p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <h3 className="text-base font-semibold text-[#222] sm:text-lg">
          {t('recentlyCandidateSearch')}
        </h3>
        <Link href="/employer/dashboard/job-postings">
          <Button variant="ghost" className="h-8 w-fit gap-2 px-4 py-2">
            <span className="text-sm font-medium text-[#222]">{t('viewAll')}</span>
            <ChevronRight className="size-6 text-[#222]" />
          </Button>
        </Link>
      </div>

      {/* Table Header - Hidden on mobile */}
      <div className="hidden rounded-lg bg-[#f4f4f4] p-2 sm:block">
        <div className="flex items-center justify-between text-xs font-normal text-[#515151]">
          <div className="w-[160px]">{t('jobs')}</div>
          <div className="flex flex-1 items-center justify-between">
            <span className="w-[80px]">{t('status')}</span>
            <span className="w-[100px]">{t('applications')}</span>
            <span className="w-[100px]">{t('salary')}</span>
            <span className="w-[180px] text-right">{t('actions')}</span>
          </div>
        </div>
      </div>

      {/* Table Rows */}
      <div className="flex flex-col">
        {recentPostings.length > 0 ? (
          recentPostings.map((posting) => {
            const daysRemaining = getDaysRemaining(posting.expiresAt)
            return (
              <div
                key={posting.id}
                className="flex flex-col gap-3 border-b border-[#ededed] p-2 last:border-b-0 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Job Info */}
                <div className="flex w-full flex-col gap-2 sm:w-[160px]">
                  <p className="text-sm font-semibold text-[#222]">{posting.title}</p>
                  <div className="flex items-center gap-1 text-xs font-normal text-[#757575]">
                    <span>
                      {posting.jobType === 'full_time'
                        ? t('fullTime')
                        : posting.jobType === 'part_time'
                          ? t('partTime')
                          : t('contract')}
                    </span>
                    {posting.expiresAt && (
                      <>
                        <span>•</span>
                        <span>
                          {daysRemaining === 'N/A' ? 'N/A' : t('daysRemaining', { count: Number(daysRemaining) })}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Status and Stats */}
                <div className="flex flex-1 flex-wrap items-center gap-4 sm:justify-between lg:gap-16">
                  <Badge
                    className={`h-5 w-fit border bg-transparent text-xs ${
                      posting.status === 'active'
                        ? 'border-[#009e00] text-[#009e00]'
                        : posting.status === 'paused'
                          ? 'border-[#d8e530] text-[#d8e530]'
                          : 'border-[#dc0000] text-[#dc0000]'
                    }`}
                  >
                    {posting.status.charAt(0).toUpperCase() + posting.status.slice(1)}
                  </Badge>
                  <div className="flex items-center gap-1">
                    <Users className="size-4 text-[#282828]" />
                    <span className="text-xs font-normal text-[#282828]">
                      {posting.clicksCount} {posting.clicksCount === 1 ? t('click') : t('clicks')}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="size-4 text-[#282828]" />
                    <span className="text-xs font-normal text-[#282828]">
                      {formatSalary(posting.salaryMin, posting.salaryMax)}
                    </span>
                  </div>
                  <div className="flex w-full items-center gap-2 sm:w-auto">
                    <Link href="/candidates">
                      <Button
                        variant="outline"
                        className="h-8 flex-1 border border-[#282828] px-4 py-2 sm:flex-none"
                      >
                        <span className="text-sm font-medium text-[#282828]">
                          {t('viewCandidates')}
                        </span>
                      </Button>
                    </Link>
                    <Button variant="ghost" size="icon" className="size-8">
                      <MoreVertical className="size-6 text-[#282828]" />
                    </Button>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="flex items-center justify-center py-8 text-sm text-[#757575]">
            {t('noActiveJobPostings')}
          </div>
        )}
      </div>
    </Card>
  )
}

