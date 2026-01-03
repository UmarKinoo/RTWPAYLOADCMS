'use client'

import React from 'react'
import Link from 'next/link'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { CreditCard, Clock } from 'lucide-react'
import type { Employer, Plan, Purchase } from '@/payload-types'

interface SubscriptionCardProps {
  employer: Employer
  recentPurchase: Purchase | null
}

export function SubscriptionCard({ employer, recentPurchase }: SubscriptionCardProps) {
  // Get plan info
  const plan = typeof employer.activePlan === 'object' ? employer.activePlan : null
  const planName = plan?.title || 'Free'
  const planType = 'Monthly' // All plans are monthly by default

  // Calculate joined date from employer creation
  const joinedDate = employer.createdAt
    ? new Date(employer.createdAt).toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : 'N/A'

  // Calculate days left from most recent purchase (30 days billing cycle)
  let daysLeft = 0
  if (recentPurchase?.createdAt) {
    const purchaseDate = new Date(recentPurchase.createdAt)
    const renewalDate = new Date(purchaseDate)
    renewalDate.setDate(renewalDate.getDate() + 30) // 30-day billing cycle
    const now = new Date()
    const diffTime = renewalDate.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    daysLeft = Math.max(0, diffDays)
  }

  // Calculate credits remaining
  const interviewCredits = employer.wallet?.interviewCredits || 0
  const contactUnlockCredits = employer.wallet?.contactUnlockCredits || 0
  const totalCredits = interviewCredits + contactUnlockCredits
  
  // For max credits, use the plan's entitlements if available
  // The max represents the credits granted per billing cycle, even if user has accumulated more
  const planInterviewCredits = plan?.entitlements?.interviewCreditsGranted || 0
  const planContactCredits = plan?.entitlements?.contactUnlockCreditsGranted || 0
  const planMaxCredits = planInterviewCredits + planContactCredits
  const maxCredits = planMaxCredits > 0 ? planMaxCredits : (totalCredits > 0 ? totalCredits : 1)
  
  // Progress circle: cap at 100% if credits exceed plan max
  const creditsProgress = Math.min((totalCredits / maxCredits) * 100, 100)
  
  // Calculate circumference for circular progress
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
              <span>Joined on </span>
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
                  Automatic renewal
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="size-4 text-[#353535]" />
                <span className="text-xs font-normal text-[#353535]">
                  {daysLeft} Days left
                </span>
              </div>
            </div>
          </div>

          {/* Circle Progress */}
          <div className="relative flex size-24 shrink-0 items-center justify-center">
            {/* Outer ring */}
            <svg className="absolute inset-0 size-full -rotate-90" viewBox="0 0 100 100">
              {/* Background circle */}
              <circle
                cx="50"
                cy="50"
                r="40"
                fill="none"
                stroke="#ededed"
                strokeWidth="8"
              />
              {/* Progress circle */}
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
            {/* Center content */}
            <div className="flex flex-col items-center text-center z-10">
              <div className="flex items-baseline gap-0.5 text-[#222]">
                <span className="text-base font-semibold">{totalCredits}</span>
                {maxCredits > 0 && (
                  <span className="text-xs font-normal text-[#515151]">/{maxCredits}</span>
                )}
              </div>
              <span className="text-[10px] font-normal text-[#515151] mt-0.5">Credits</span>
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
              Manage Subscription
            </span>
          </Button>
        </Link>
      </div>
    </Card>
  )
}
