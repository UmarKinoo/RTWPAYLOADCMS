'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from '@/i18n/routing'
import { HomepageSection } from '../homepage/HomepageSection'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import { mockPurchase, startPayment } from '@/lib/purchases'
import { useTranslations } from 'next-intl'
import type { Plan } from '@/lib/payload/plans'

interface PricingCardsProps {
  plans: Plan[]
  usePaymentGateway?: boolean
  paymentResult?: string | null
}

const PricingCard: React.FC<{ plan: Plan; onPurchase: (planSlug: string) => Promise<void> }> = ({
  plan,
  onPurchase,
}) => {
  const [isLoading, setIsLoading] = useState(false)
  const t = useTranslations('pricing.cards')
  const isCustom = plan.entitlements.isCustom
  const isPopular = plan.slug === 'top-picks'

  const handleClick = async () => {
    if (isCustom) {
      // Route to custom request form
      window.location.href = '/custom-request'
      return
    }

    setIsLoading(true)
    try {
      await onPurchase(plan.slug)
    } finally {
      setIsLoading(false)
    }
  }

  const formatPrice = () => {
    if (plan.price === null) return 'N/A'
    return `${plan.currency} ${plan.price}`
  }

  const getSubtitle = () => {
    if (plan.slug === 'skilled') return t('skilled')
    if (plan.slug === 'specialty') return t('specialty')
    if (plan.slug === 'elite-specialty') return t('eliteSpecialty')
    if (plan.slug === 'top-picks') return 'N/A'
    if (plan.slug === 'custom') return t('custom')
    return ''
  }

  const getFeatures = () => {
    const features = []
    if (plan.entitlements.interviewCreditsGranted > 0) {
      features.push(t('features.interviewCandidates', { count: plan.entitlements.interviewCreditsGranted }))
    }
    if (plan.entitlements.basicFilters) {
      features.push(t('features.basicFilters'))
    }
    if (plan.entitlements.contactUnlockCreditsGranted > 0) {
      features.push(
        t('features.contactUnlock', {
          count: plan.entitlements.contactUnlockCreditsGranted,
          plural: plan.entitlements.contactUnlockCreditsGranted > 1 ? 's' : '',
        }),
      )
    }
    if (plan.entitlements.nationalityRestriction === 'SAUDI') {
      features.push(t('features.saudiOnly'))
    }
    if (isCustom) {
      features.push(t('features.customMoreThan5'))
      features.push(t('features.customTargetProfiles'))
      features.push(t('features.customRespondQuestions'))
      features.push(t('features.customAccessContact'))
    }
    return features
  }

  return (
    <Card
      className={cn(
        'relative bg-white border-[1.5px] border-[#e7e9ef] rounded-2xl',
        'shadow-sm p-5 sm:p-6 flex flex-col h-full',
        'hover:shadow-lg hover:border-[#4644b8]/30 transition-all duration-300',
      )}
    >
      {/* Popular Badge */}
      {isPopular && (
        <Badge className="absolute -top-3 end-4 bg-[#d8e530] hover:bg-[#c8d520] text-[#222] px-3 py-1 rounded-full text-xs font-medium">
          {t('topPicks')}
        </Badge>
      )}

      <CardHeader className="p-0 pb-4">
        {/* Plan Name & Subtitle */}
        <div className="space-y-1">
          <h3 className="text-xl sm:text-2xl md:text-3xl font-bold font-inter text-[#16252d] leading-tight">
            {plan.slug === 'top-picks' ? t('saudiNationals') : plan.title}
          </h3>
          <p className="text-sm sm:text-base text-[#757575] font-medium">{getSubtitle()}</p>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1">
        {/* Price */}
        <p className="text-2xl sm:text-3xl md:text-4xl font-bold font-inter text-[#16252d] mb-4 sm:mb-5">
          {formatPrice()}
        </p>

        {/* Features */}
        <div className="space-y-2.5">
          {getFeatures().map((feature, index) => (
            <div key={index} className="flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#d8e530] flex-shrink-0 mt-0.5" />
              <p className="text-sm sm:text-base font-medium text-[#16252d] leading-snug">{feature}</p>
            </div>
          ))}
        </div>
      </CardContent>

      <CardFooter className="p-0 pt-5 sm:pt-6 mt-auto">
        <Button
          onClick={handleClick}
          disabled={isLoading}
          className="w-full bg-[#4644b8] hover:bg-[#3a3aa0] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl h-11 sm:h-12 text-sm sm:text-base font-semibold transition-all"
        >
          {isLoading ? t('processing') : t('getStarted')}
        </Button>
      </CardFooter>
    </Card>
  )
}

export const PricingCards: React.FC<PricingCardsProps> = ({
  plans,
  usePaymentGateway = false,
  paymentResult,
}) => {
  const router = useRouter()
  const t = useTranslations('pricing.cards')

  useEffect(() => {
    if (paymentResult === 'success') {
      toast.success(t('toasts.creditsAdded'), {
        description: t('toasts.paymentSuccessDescription'),
      })
    } else if (paymentResult === 'failed' || paymentResult === 'error') {
      toast.error(t('toasts.purchaseFailed'), {
        description: t('toasts.paymentFailedDescription'),
      })
    }
  }, [paymentResult, t])

  const handlePurchase = async (planSlug: string) => {
    try {
      if (usePaymentGateway) {
        const result = await startPayment(planSlug)
        if (result.success && result.paymentUrl) {
          window.location.href = result.paymentUrl
          return
        }
        toast.error(t('toasts.purchaseFailed'), {
          description: result.error || t('toasts.purchaseFailedDescription'),
        })
        return
      }

      const result = await mockPurchase(planSlug)
      if (result.success) {
        toast.success(t('toasts.creditsAdded'), {
          description: t('toasts.creditsAddedDescription', {
            interviewCredits: result.wallet?.interviewCredits || 0,
            contactCredits: result.wallet?.contactUnlockCredits || 0,
          }),
        })
        router.push('/candidates')
      } else {
        toast.error(t('toasts.purchaseFailed'), {
          description: result.error || t('toasts.purchaseFailedDescription'),
        })
      }
    } catch (error) {
      console.error('Purchase error:', error)
      toast.error(t('toasts.purchaseFailed'), {
        description: t('toasts.purchaseFailedError'),
      })
    }
  }

  // Separate plans into rows: first 3, then remaining 2
  const firstRow = plans.filter((p) => !p.entitlements.isCustom).slice(0, 3)
  const secondRow = plans.filter((p) => p.entitlements.isCustom || p.slug === 'top-picks').slice(0, 2)

  return (
    <HomepageSection className="pb-12 sm:pb-16 md:pb-20">
      {/* First Row - 3 Cards */}
      {firstRow.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mb-4 sm:mb-5 md:mb-6">
          {firstRow.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onPurchase={handlePurchase} />
          ))}
        </div>
      )}

      {/* Second Row - 2 Cards Centered */}
      {secondRow.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 md:gap-6 lg:max-w-[66%] mx-auto">
          {secondRow.map((plan) => (
            <PricingCard key={plan.id} plan={plan} onPurchase={handlePurchase} />
          ))}
        </div>
      )}
    </HomepageSection>
  )
}
