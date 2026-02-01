'use client'

import React from 'react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { HomepageSection } from '../homepage/HomepageSection'
import { ImageWithSkeleton } from '../homepage/ImageWithSkeleton'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

// Image assets
const imgBusinessPeople = '/assets/fbc9c5538a6e82eb01ee5e9124191e1a63fbc758.webp'
const imgBusinessPeopleMask = '/assets/9067d496e1f10f37d480e3dc99e0dd3a6af0fb6c.svg'

export const OurWork: React.FC = () => {
  const t = useTranslations('about.ourWork')

  return (
    <HomepageSection className="py-12 sm:py-16 md:py-20 lg:py-24">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 lg:gap-16 items-center">
        {/* Left Side - Image (alternates with AboutIntro) */}
        <div className="order-1 lg:order-1 relative w-full aspect-[4/3] lg:aspect-square">
          <div
            className="absolute inset-0"
            style={{
              maskImage: `url('${imgBusinessPeopleMask}')`,
              WebkitMaskImage: `url('${imgBusinessPeopleMask}')`,
              maskSize: 'contain',
              maskPosition: 'center',
              maskRepeat: 'no-repeat',
            }}
          >
            <ImageWithSkeleton
              src={imgBusinessPeople}
              alt="Successful business people in modern office"
              fill
              objectFit="cover"
              objectPosition="center"
            />
          </div>
        </div>

        {/* Right Side - Text Content */}
        <div className="order-2 lg:order-2">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold font-inter text-[#16252d] leading-tight mb-4 md:mb-6">
            {t('title')}
          </h2>
          <div className="space-y-4 md:space-y-5 text-sm sm:text-base md:text-lg font-normal text-[#16252d]/80 leading-relaxed mb-6 md:mb-8">
            <p>{t('paragraph1')}</p>
            <p>{t('paragraph2')}</p>
            <p>{t('paragraph3')}</p>
            <p>{t('paragraph4')}</p>
          </div>
          <Link href="/learn-more">
            <Button
              className="group bg-[#4644b8] hover:bg-[#3a3aa0] text-white rounded-xl px-5 sm:px-6 py-2.5 sm:py-3 h-auto text-sm sm:text-base font-bold uppercase gap-2 transition-all"
            >
              <span>{t('learnMore')}</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </div>
    </HomepageSection>
  )
}
