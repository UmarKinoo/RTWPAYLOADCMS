'use client'

import { useCallback } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter } from '@/i18n/routing'
import {
  Briefcase,
  Calendar,
  ChevronRight,
  ChevronUp,
  CheckCircle2,
  FileText,
  Flag,
  GraduationCap,
  ImagePlus,
  MapPin,
  MessageCircle,
  Sparkles,
  Stamp,
  User,
  Wrench,
  Globe,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import {
  getAllProfileFieldStatuses,
  getProfileCompleteness,
  type ProfileCompletenessField,
  type ProfileFieldItem,
  type ProfileFieldStatus,
} from '@/lib/candidates/profile-completeness'
import { goToProfileField } from '@/lib/candidates/profile-strength-nav'

interface ProfileStrengthDockProps {
  candidate: Candidate
  open: boolean
  onOpenChange: (open: boolean) => void
}

const FIELD_ICONS: Record<ProfileCompletenessField, LucideIcon> = {
  profilePicture: ImagePlus,
  resume: FileText,
  location: MapPin,
  nationality: Flag,
  visaStatus: Stamp,
  availabilityDate: Calendar,
  experienceYears: Briefcase,
  jobTitle: Briefcase,
  primarySkill: Wrench,
  aboutMe: User,
  education: GraduationCap,
  languages: Globe,
  jobPreferences: Briefcase,
  jobBenefits: Sparkles,
  whatsappNumber: MessageCircle,
}

function ProgressRing({
  percent,
  size = 40,
  stroke = 3,
  className,
}: {
  percent: number
  size?: number
  stroke?: number
  className?: string
}) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (percent / 100) * circumference

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('-rotate-90', className)}
      aria-hidden
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        className="text-[#e7e9ef]"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-[#4644b8] transition-[stroke-dashoffset] duration-500"
      />
    </svg>
  )
}

function PointsBadge({ points }: { points: number }) {
  const t = useTranslations('candidateDashboard.profileStrength')
  return (
    <span className="shrink-0 rounded-full bg-[#e8f5ee] px-2 py-0.5 text-[11px] font-bold text-[#2d6a4f]">
      {t('pointsBadge', { points })}
    </span>
  )
}

function ChecklistRow({
  item,
  onSelect,
}: {
  item: ProfileFieldStatus
  onSelect: (item: ProfileFieldItem) => void
}) {
  const tFields = useTranslations('candidateDashboard.profileCompleteness.fields')
  const tActions = useTranslations('candidateDashboard.profileCompleteness.actions')
  const tStrength = useTranslations('candidateDashboard.profileStrength')
  const Icon = FIELD_ICONS[item.field]

  if (item.isComplete) {
    return (
      <button
        type="button"
        onClick={() => onSelect(item)}
        className="group flex w-full items-center gap-3 rounded-xl border border-[#e7e9ef]/80 bg-[#f9fafb] px-3 py-3 text-start transition-colors hover:bg-[#f5f5f5]"
      >
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#e8f5ee] text-[#2d6a4f]">
          <CheckCircle2 className="h-4 w-4" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-medium text-[#515151]">{tFields(item.i18nKey)}</span>
          <span className="mt-0.5 block text-xs text-[#2d6a4f]">{tStrength('itemDone')}</span>
        </span>
        <PointsBadge points={item.points} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={() => onSelect(item)}
      className="group flex w-full items-center gap-3 rounded-xl border border-[#4644b8]/20 bg-white px-3 py-3 text-start transition-colors hover:border-[#4644b8]/35 hover:bg-[#ecf2ff]/50 active:bg-[#ecf2ff]"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ecf2ff] text-[#4644b8] group-hover:bg-[#dce8ff]">
        <Icon className="h-4 w-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-medium text-[#16252d]">{tFields(item.i18nKey)}</span>
        <span className="mt-0.5 block text-xs font-semibold text-[#4644b8]">
          {tActions(item.actionKey)}
        </span>
      </span>
      <PointsBadge points={item.points} />
      <ChevronRight className="h-4 w-4 shrink-0 text-[#757575] opacity-60 group-hover:opacity-100" />
    </button>
  )
}

export function ProfileStrengthDock({ candidate, open, onOpenChange }: ProfileStrengthDockProps) {
  const t = useTranslations('candidateDashboard.profileStrength')
  const router = useRouter()
  const { percent, filled, total, missing } = getProfileCompleteness(candidate)
  const allFields = getAllProfileFieldStatuses(candidate)

  const isComplete = missing.length === 0

  const handleItemSelect = useCallback(
    (item: ProfileFieldItem) => {
      onOpenChange(false)
      window.setTimeout(() => {
        goToProfileField(item, router)
      }, 200)
    },
    [onOpenChange, router],
  )

  if (isComplete) return null

  return (
    <>
      <button
        type="button"
        onClick={() => onOpenChange(true)}
        className="fixed bottom-16 left-1/2 z-[105] flex max-w-[calc(100vw-2rem)] -translate-x-1/2 items-center gap-3 rounded-full border border-[#4644b8]/25 bg-white/95 px-4 py-2.5 shadow-lg backdrop-blur-md transition-shadow hover:shadow-xl md:bottom-6"
        aria-label={t('completeNow')}
      >
        <div className="relative flex h-9 w-9 shrink-0 items-center justify-center sm:h-10 sm:w-10">
          <ProgressRing percent={percent} size={40} stroke={3} />
          <span className="absolute text-[9px] font-bold text-[#4644b8] sm:text-[10px]">{percent}%</span>
        </div>
        <div className="min-w-0 text-start">
          <p className="truncate text-xs font-semibold text-[#16252d] sm:text-sm">
            {t('strengthLabel', { percent })}
          </p>
          <p className="truncate text-[11px] text-[#757575]">
            {t('completedCount', { filled, total })}
          </p>
        </div>
        <span className="flex shrink-0 items-center gap-1 text-xs font-semibold text-[#4644b8]">
          {t('completeNow')}
          <ChevronUp className="h-4 w-4" />
        </span>
      </button>

      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="bottom"
          className="z-[110] max-h-[85vh] overflow-y-auto rounded-t-2xl border-t-0 px-0 pb-8 pt-2"
        >
          <div className="mx-auto mb-2 h-1 w-10 rounded-full bg-[#e7e9ef]" aria-hidden />

          <SheetHeader className="items-center px-5 pb-2 text-center">
            <div className="relative mx-auto mb-2 flex h-20 w-20 items-center justify-center">
              <ProgressRing percent={percent} size={80} stroke={5} />
              <span className="absolute text-xl font-bold text-[#16252d]">{percent}%</span>
            </div>
            <SheetTitle className="text-lg font-bold text-[#16252d]">{t('title')}</SheetTitle>
            <SheetDescription className="text-sm text-[#515151]">
              {t('completedCount', { filled, total })}
            </SheetDescription>
            <p className="mt-1 flex items-center justify-center gap-1.5 text-xs text-[#757575]">
              <Sparkles className="h-3.5 w-3.5 text-[#4644b8]" />
              {t('motivator')}
            </p>
          </SheetHeader>

          <div className="space-y-2 px-4 pt-2">
            {allFields.map((item) => (
              <ChecklistRow key={item.field} item={item} onSelect={handleItemSelect} />
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
