'use client'

import Link from 'next/link'
import { AlertCircle, Clock, XCircle } from 'lucide-react'
import type { Candidate } from '@/payload-types'
import { cn } from '@/lib/utils'

interface ProfileModerationBannerProps {
  candidate: Candidate
}

export function ProfileModerationBanner({ candidate }: ProfileModerationBannerProps) {
  const status = candidate.profileStatus || 'pending_review'
  const reason = candidate.moderation?.rejectionReason

  if (status === 'approved') return null

  const config = {
    pending_review: {
      icon: Clock,
      title: 'Your profile is under review',
      description:
        'Our team is reviewing your registration. You will receive an email when your profile is approved and visible to employers.',
      className: 'border-amber-200 bg-amber-50 text-amber-950',
      iconClass: 'text-amber-700',
    },
    needs_changes: {
      icon: AlertCircle,
      title: 'Updates needed before your profile goes live',
      description: reason || 'Please update your profile based on our feedback, then save your changes to resubmit.',
      className: 'border-[#4644b8]/25 bg-[#ecf2ff] text-[#16252d]',
      iconClass: 'text-[#4644b8]',
    },
    rejected: {
      icon: XCircle,
      title: 'Your profile was not approved',
      description:
        reason ||
        'You can update your profile and save your changes to request another review.',
      className: 'border-red-200 bg-red-50 text-red-950',
      iconClass: 'text-red-700',
    },
  } as const

  const item = config[status as keyof typeof config]
  if (!item) return null

  const Icon = item.icon

  return (
    <div className={cn('mb-6 rounded-xl border p-4 sm:p-5', item.className)}>
      <div className="flex gap-3">
        <Icon className={cn('mt-0.5 h-5 w-5 shrink-0', item.iconClass)} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{item.title}</p>
          <p className="mt-1 text-sm leading-relaxed opacity-90">{item.description}</p>
          {(status === 'needs_changes' || status === 'rejected') && (
            <p className="mt-3 text-sm">
              After you save updates, your profile will be sent back for review.{' '}
              <Link href="/dashboard/settings" className="font-medium underline underline-offset-2">
                Account settings
              </Link>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
