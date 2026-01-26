'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { PageHero } from '../shared/PageHero'

// Image assets
const imgHeroBackground = '/assets/c2df08f896cde0b8275e3431e7c61726d4317c88.webp'

export const AboutHero: React.FC = () => {
  const t = useTranslations('about.hero')

  return (
    <PageHero
      imageSrc={imgHeroBackground}
      imageAlt="About us background"
      title={t('title')}
      overlayOpacity="black/30"
      titleColor="white"
      objectPosition="center top"
    />
  )
}
