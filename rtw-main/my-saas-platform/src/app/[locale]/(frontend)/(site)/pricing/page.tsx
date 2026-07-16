import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { PricingHero, PricingIntro, PricingCards } from '@/components/pricing'
import { FAQ } from '@/components/homepage/blocks/FAQ'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { getPlans } from '@/lib/payload/plans'
import { getCurrentUserType } from '@/lib/currentUserType'
import { reconcilePendingPurchases } from '@/lib/fulfillPurchase'
import { getLocale } from 'next-intl/server'
import { generateMeta } from '@/utilities/generateMeta'
import { getPageBySlug } from '@/utilities/getPageBySlug'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale()
  const pricingPage = await getPageBySlug('pricing')
  return generateMeta({ doc: pricingPage, path: `${locale}/pricing` })
}

export default async function PricingPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ payment?: string }>
}) {
  const { locale } = await params
  const { payment: paymentResult } = await searchParams

  // If this employer paid but never completed the browser callback (closed the
  // tab on the payment page), grant the pending credits now
  const userType = await getCurrentUserType()
  if (userType?.kind === 'employer') {
    try {
      await reconcilePendingPurchases(userType.employer.id, 5, false)
    } catch (error) {
      console.error('[pricing] purchase reconciliation failed:', error)
    }
  }

  const plans = await getPlans(locale)
  // Use the real gateway when a token is set. In production without a token, still
  // take the gateway path (which fails with a clear error) rather than silently
  // falling back to mock checkout and granting free credits.
  const usePaymentGateway =
    !!(process.env.MYFATOORAH_TOKEN?.trim?.()) ||
    (process.env.NODE_ENV === 'production' && process.env.ALLOW_MOCK_CHECKOUT !== 'true')

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <PricingHero />
      <PricingIntro />
      <PricingCards plans={plans} usePaymentGateway={usePaymentGateway} paymentResult={paymentResult} />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  )
}

