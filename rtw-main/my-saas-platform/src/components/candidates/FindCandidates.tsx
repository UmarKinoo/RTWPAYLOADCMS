'use client'

import React from 'react'
import Link from 'next/link'
import { HomepageSection } from '../homepage/HomepageSection'
import { useTranslations } from 'next-intl'

interface LocationLink {
  labelKey: string
  href: string
}

const locationLinks: LocationLink[] = [
  { labelKey: 'locationRiyadh', href: '/candidates?location=riyadh' },
  { labelKey: 'locationJeddah', href: '/candidates?location=jeddah' },
  { labelKey: 'locationRiyadh', href: '/candidates?location=riyadh' },
  { labelKey: 'locationJeddah', href: '/candidates?location=jeddah' },
  { labelKey: 'locationDammam', href: '/candidates?location=dammam' },
  { labelKey: 'locationMakkah', href: '/candidates?location=makkah' },
  { labelKey: 'locationDammam', href: '/candidates?location=dammam' },
  { labelKey: 'locationMakkah', href: '/candidates?location=makkah' },
]

export const FindCandidates: React.FC = () => {
  const t = useTranslations('findCandidates')
  return (
    <HomepageSection className="py-12 sm:py-14 md:py-16 lg:py-20">
      <h2 className="text-[28px] xs:text-[32px] sm:text-[36px] md:text-[42px] lg:text-[48px] xl:text-[55px] 2xl:text-[65px] 3xl:text-[65px] font-bold font-inter text-[#16252d] leading-tight mb-6 sm:mb-8 md:mb-10">
        {t('title')}
      </h2>
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 sm:gap-x-8 md:gap-x-10 lg:gap-x-12 gap-y-3 sm:gap-y-4">
        {locationLinks.map((link, index) => (
          <Link
            key={index}
            href={link.href}
            className="text-[16px] sm:text-[18px] md:text-[20px] lg:text-[22px] xl:text-[24px] 2xl:text-[26px] font-semibold font-inter text-[#16252d] hover:text-[#4644b8] transition-colors leading-tight"
          >
            {t(link.labelKey)}
          </Link>
        ))}
      </div>
    </HomepageSection>
  )
}












