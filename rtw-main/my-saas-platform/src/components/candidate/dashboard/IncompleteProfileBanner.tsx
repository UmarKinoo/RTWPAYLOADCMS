'use client'

import { useTranslations } from 'next-intl'
import { Sparkles } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Button } from '@/components/ui/button'
import { getProfileCompleteness } from '@/lib/candidates/profile-completeness'
import { cn } from '@/lib/utils'

interface IncompleteProfileBannerProps {
  candidate: Candidate
  className?: string
}

export function IncompleteProfileBanner({ candidate, className }: IncompleteProfileBannerProps) {
  const t = useTranslations('candidateDashboard.profileCompleteness')
  const { percent, missing } = getProfileCompleteness(candidate)

  if (missing.length === 0) return null

  const scrollToCard = () => {
    const el = document.getElementById('profile-completeness')
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      className={cn(
        'mt-4 flex flex-col gap-3 rounded-xl border border-[#4644b8]/25 bg-[#ecf2ff] p-4 sm:mt-5 sm:flex-row sm:items-center sm:justify-between sm:gap-4',
        className,
      )}
      role="status"
    >
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-[#4644b8]" />
        <div>
          <p className="text-sm font-semibold text-[#16252d]">{t('bannerTitle')}</p>
          <p className="mt-0.5 text-xs text-[#515151] sm:text-sm">
            {t('bannerDescription', { percent, count: missing.length })}
          </p>
        </div>
      </div>
      <Button
        type="button"
        onClick={scrollToCard}
        className="h-9 shrink-0 rounded-lg bg-[#4644b8] px-4 text-sm font-semibold text-white hover:bg-[#3a3aa0]"
      >
        {t('bannerCta')}
      </Button>
    </div>
  )
}
