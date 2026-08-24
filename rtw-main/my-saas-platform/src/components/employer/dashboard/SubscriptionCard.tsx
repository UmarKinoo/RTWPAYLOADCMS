'use client'

import React from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Clock } from 'lucide-react'
import type { Employer, Plan, Purchase } from '@/payload-types'
import { isPlanActive } from '@/lib/plan-access'

interface SubscriptionCardProps {
  employer: Employer
  recentPurchase: Purchase | null
}

export function SubscriptionCard({ employer, recentPurchase }: SubscriptionCardProps) {
  const t = useTranslations('employerDashboard.subscription')
  const locale = useLocale()
  const dateLocale = locale === 'ar' ? 'ar-SA' : 'en-US'
  // Get plan info
  const plan = (typeof employer.activePlan === 'object' ? employer.activePlan : null) as Plan | null
  const planName = plan?.title || t('free')
  const planType = t('monthly')
  const unlimited = Boolean(plan?.entitlements?.unlimitedInterviews)
  const planActive = isPlanActive(employer.planExpiresAt)

  // Calculate joined date from employer creation
  const joinedDate = employer.createdAt
    ? new Date(employer.createdAt).toLocaleDateString(dateLocale, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

  // Prefer planExpiresAt; fall back to purchase date + 30 days for legacy rows
  let daysLeft = 0
  if (employer.planExpiresAt) {
    const diffTime = new Date(employer.planExpiresAt).getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  } else if (recentPurchase?.createdAt) {
    const purchaseDate = new Date(recentPurchase.createdAt)
    const renewalDate = new Date(purchaseDate)
    renewalDate.setDate(renewalDate.getDate() + 30)
    const diffTime = renewalDate.getTime() - Date.now()
    daysLeft = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)))
  }

  const interviewCredits = employer.wallet?.interviewCredits || 0
  const contactUnlockCredits = employer.wallet?.contactUnlockCredits || 0
  const planInterviewCredits = plan?.entitlements?.interviewCreditsGranted || 0
  const planContactCredits = plan?.entitlements?.contactUnlockCreditsGranted || 0

  // Circle shows interview credits for Basic; unlimited plans show ∞
  const displayCurrent = unlimited ? null : interviewCredits
  const displayMax = unlimited ? null : planInterviewCredits > 0 ? planInterviewCredits : interviewCredits || 1
  const creditsProgress =
    unlimited || !displayMax
      ? planActive
        ? 100
        : 0
      : Math.min((interviewCredits / displayMax) * 100, 100)

  const radius = 40
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (creditsProgress / 100) * circumference

  return (
    <Card className="flex min-h-[200px] flex-col overflow-hidden rounded-2xl bg-white">
      <div className="flex flex-col items-center gap-4 p-4">
        {/* Top Section */}
        <div className="flex w-full items-start justify-between gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <p className="text-xs font-normal text-[#353535]">
              <span>{t('joinedOn')}</span>
              <span className="text-[#515151]">{joinedDate}</span>
            </p>
            <div className="flex flex-col gap-0.5">
              <p className="text-base font-semibold text-[#222]">{planName}</p>
              <p className="text-base font-semibold text-[#222]">{planType}</p>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1">
                <CreditCard className="size-4 text-[#353535]" />
                <span className="text-xs font-normal text-[#353535]">
                  {contactUnlockCredits > 0
                    ? `${contactUnlockCredits}/${planContactCredits || contactUnlockCredits} ${t('cvs')}`
                    : t('automaticRenewal')}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-4 text-[#353535]" />
                <span className="text-xs font-normal text-[#353535]">
                  {planActive || daysLeft > 0 ? t('daysLeft', { count: daysLeft }) : t('expired')}
                </span>
              </div>
            </div>
          </div>

          {/* Circle Progress */}
          <div className="relative flex size-24 shrink-0 items-center justify-center">
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#ededed"
                strokeWidth="8"
              />
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#4644b8"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-300 ease-in-out"
              />
            </svg>
            <div className="flex flex-col items-center text-center z-10">
              {unlimited ? (
                <>
                  <span className="text-base font-semibold text-[#222]">{t('unlimitedInterviews')}</span>
                  <span className="text-[10px] font-normal text-[#515151] mt-0.5">{t('interviews')}</span>
                </>
              ) : (
                <>
                  <div className="flex items-baseline gap-0.5 text-[#222]">
                    <span className="text-base font-semibold">{displayCurrent ?? 0}</span>
                    {displayMax != null && displayMax > 0 && (
                      <span className="text-xs font-normal text-[#515151]">/{displayMax}</span>
                    )}
                  </div>
                  <span className="text-[10px] font-normal text-[#515151] mt-0.5">{t('interviews')}</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Manage Subscription Button */}
        <Link href="/pricing" className="w-full">
          <Button
            variant="outline"
            className="h-8 w-full border border-[#282828] px-4 py-2"
          >
            <span className="text-sm font-medium text-[#282828]">
              {t('manageSubscription')}
            </span>
          </Button>
        </Link>
      </div>
    </Card>
  )
}
