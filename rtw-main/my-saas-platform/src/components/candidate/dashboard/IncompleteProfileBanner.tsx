'use client'

import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { getProfileCompleteness } from '@/lib/candidates/profile-completeness'
import { cn } from '@/lib/utils'

interface IncompleteProfileBannerProps {
  candidate: Candidate
  className?: string
  onOpenChecklist?: () => void
}

export function IncompleteProfileBanner({
  candidate,
  className,
  onOpenChecklist,
}: IncompleteProfileBannerProps) {
  const t = useTranslations('candidateDashboard.profileCompleteness')
  const { percent, missing } = getProfileCompleteness(candidate)

  if (missing.length === 0) return null

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 rounded-xl border border-[#4644b8]/20 bg-[#ecf2ff]/80 p-3 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:p-4',
        className,
      )}
      role="status"
    >
      <div className="flex min-w-0 flex-1 items-center gap-3">
        <Sparkles className="h-5 w-5 shrink-0 text-[#4644b8]" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
            <p className="text-sm font-semibold text-[#16252d]">{t('bannerTitle')}</p>
            <p className="text-xs font-bold text-[#4644b8] sm:text-sm">{percent}%</p>
          </div>
          <Progress value={percent} className="mt-2 h-1.5 max-w-xs" />
          <p className="mt-1.5 text-xs text-[#515151]">
            {t('bannerDescription', { percent, count: missing.length })}
          </p>
        </div>
      </div>
      <Button
        type="button"
        onClick={onOpenChecklist}
        className="h-9 shrink-0 rounded-lg bg-[#4644b8] px-4 text-sm font-semibold text-white hover:bg-[#3a3aa0]"
      >
        {t('bannerCta')}
      </Button>
    </div>
  )
}
