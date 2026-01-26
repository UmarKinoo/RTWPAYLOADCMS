'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { PageHero } from '../shared/PageHero'

// Hero background image
const imgHeroBackground = '/assets/acc753bf6d1482fc1e525a2d76bd0e0e70d1eb03.webp'

export const PricingHero: React.FC = () => {
  const t = useTranslations('pricing.hero')

  return (
    <PageHero
      imageSrc={imgHeroBackground}
      imageAlt="Pricing hero background"
      title={t('title')}
      overlayOpacity="black/20"
      titleColor="white"
      objectPosition="center top"
    />
  )
}
