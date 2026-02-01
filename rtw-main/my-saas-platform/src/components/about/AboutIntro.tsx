'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { HomepageSection } from '../homepage/HomepageSection'
import { ImageWithSkeleton } from '../homepage/ImageWithSkeleton'

const imgAboutIntro = '/assets/3c17a3ff86c43991781ca31089548715d93490e0.webp'

export const AboutIntro: React.FC = () => {
  const t = useTranslations('about.aboutIntro')

  return (
    <HomepageSection className="py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        {/* Left Side - Text Content */}
        <div className="order-2 lg:order-1">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-inter text-[#16252d] leading-tight mb-4 md:mb-6">
            {t('title')}
          </h2>
          <p className="text-sm sm:text-base md:text-lg font-normal text-[#16252d]/80 leading-relaxed">
            {t('description')}
          </p>
        </div>

        {/* Right Side - Image */}
        <div className="order-1 lg:order-2 relative w-full aspect-[4/3] lg:aspect-square rounded-2xl sm:rounded-3xl overflow-hidden">
          <ImageWithSkeleton
            src={imgAboutIntro}
            alt="Ready to Work - Saudi recruitment"
            fill
            objectFit="cover"
            objectPosition="left center"
          />
        </div>
      </div>
    </HomepageSection>
  )
}
