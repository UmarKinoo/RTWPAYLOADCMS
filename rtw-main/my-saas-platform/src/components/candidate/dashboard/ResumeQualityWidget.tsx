'use client'

import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/routing'
import { CheckCircle2, Circle, ChevronRight } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { Card } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { getProfileCompleteness } from '@/lib/candidates/profile-completeness'

interface ProfileCompletenessCardProps {
  candidate: Candidate
  className?: string
}

export function ProfileCompletenessCard({ candidate, className }: ProfileCompletenessCardProps) {
  const t = useTranslations('candidateDashboard.profileCompleteness')
  const { percent, filled, total, missing } = getProfileCompleteness(candidate)
  const isComplete = missing.length === 0

  return (
    <Card
      id="profile-completeness"
      className={cn(
        'scroll-mt-24 rounded-xl bg-white p-4 shadow-sm sm:rounded-2xl sm:p-6',
        className,
      )}
    >
      <h3 className="mb-1 text-center text-base font-semibold text-[#282828] sm:text-lg">
        {t('title')}
      </h3>
      <p className="mb-4 text-center text-xs text-[#757575] sm:mb-5 sm:text-sm">
        {t('subtitle')}
      </p>

      <div className="mb-4 flex flex-col items-center justify-center gap-3 sm:mb-5 sm:gap-4">
        <div
          className={cn(
            'text-3xl font-bold sm:text-4xl',
            isComplete ? 'text-[#2d6a4f]' : 'text-[#282828]',
          )}
        >
          {percent}%
        </div>
        <div className="w-full max-w-[200px]">
          <Progress value={percent} className="h-2.5 sm:h-3" />
        </div>
        <p className="text-[11px] text-[#757575] sm:text-xs">
          {t('filledCount', { filled, total })}
        </p>
      </div>

      <Separator className="mb-4 bg-[#ededed] sm:mb-5" />

      {isComplete ? (
        <div className="flex flex-col items-center gap-2 text-center">
          <CheckCircle2 className="h-8 w-8 text-[#2d6a4f]" />
          <p className="text-sm font-semibold text-[#282828]">{t('completeTitle')}</p>
          <p className="text-xs text-[#757575]">{t('completeDescription')}</p>
        </div>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          <p className="text-center text-xs font-semibold text-[#282828] sm:text-sm">
            {t('checklistTitle')}
          </p>
          <ul className="space-y-2">
            {missing.map((item) => (
              <li key={item.field}>
                <Link
                  href={item.href}
                  className="group flex items-center gap-2.5 rounded-lg border border-[#e7e9ef] bg-[#fafafa] px-3 py-2.5 transition-colors hover:border-[#4644b8]/40 hover:bg-[#ecf2ff]/60"
                >
                  <Circle className="h-4 w-4 shrink-0 text-[#4644b8]" />
                  <span className="min-w-0 flex-1 text-xs font-medium text-[#16252d] sm:text-sm">
                    {t(`fields.${item.i18nKey}`)}
                  </span>
                  <span className="shrink-0 text-[10px] font-semibold text-[#4644b8] sm:text-xs">
                    {t(`actions.${item.actionKey}`)}
                  </span>
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-[#4644b8] opacity-60 group-hover:opacity-100" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </Card>
  )
}

/** @deprecated Use ProfileCompletenessCard — kept as alias for existing imports */
export function ResumeQualityWidget(props: ProfileCompletenessCardProps) {
  return <ProfileCompletenessCard {...props} />
}
