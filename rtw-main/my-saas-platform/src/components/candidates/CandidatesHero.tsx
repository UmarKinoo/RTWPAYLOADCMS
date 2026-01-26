'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { PageHero } from '../shared/PageHero'

// Hero background image
const imgHeroBackground = '/assets/ee37e2e81115be02a56e755bd886e01749e53950.webp'

export const CandidatesHero: React.FC = () => {
  const t = useTranslations('candidatesPage')

  return (
    <PageHero
      imageSrc={imgHeroBackground}
      imageAlt="Candidates hero background"
      title={t('heroTitle')}
      overlayOpacity="white/10"
      titleColor="colored"
      objectPosition="center top"
    />
  )
}
