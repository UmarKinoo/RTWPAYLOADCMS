import React from 'react'
import { HomepageSection } from '../homepage/HomepageSection'
import { getTranslations } from 'next-intl/server'

export async function PricingIntro() {
  const t = await getTranslations('pricing.intro')

  return (
    <HomepageSection className="py-10 sm:py-12 md:py-16 lg:py-20">
      <div className="max-w-4xl">
        {/* Main Heading */}
        <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold font-inter text-[#16252d] leading-tight mb-4 sm:mb-5">
          {t('title')}
        </h2>

        {/* Description */}
        <p className="text-sm sm:text-base md:text-lg lg:text-xl font-normal text-[#16252d]/80 leading-relaxed">
          {t('description')}
        </p>
      </div>
    </HomepageSection>
  )
}
