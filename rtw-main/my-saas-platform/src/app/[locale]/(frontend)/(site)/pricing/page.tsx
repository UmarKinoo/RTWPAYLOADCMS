import type { Metadata } from 'next'
import { HomepageNavbarWrapper } from '@/components/homepage/NavbarWrapper'
import { PricingHero, PricingIntro, PricingCards } from '@/components/pricing'
import { FAQ } from '@/components/homepage/blocks/FAQ'
import { Newsletter } from '@/components/homepage/blocks/Newsletter'
import { Footer } from '@/components/homepage/blocks/Footer'
import { getPlans } from '@/lib/payload/plans'

export const metadata: Metadata = {
  title: 'Pricing | Ready to Work',
  description: 'Flexible pricing for every team size. Find the right talent without complexity.',
}

export default async function PricingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  const plans = await getPlans(locale)

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <HomepageNavbarWrapper />
      <PricingHero />
      <PricingIntro />
      <PricingCards plans={plans} />
      <FAQ />
      <Newsletter />
      <Footer />
    </div>
  )
}

