'use client'

import React from 'react'
import { PageHero } from '../shared/PageHero'

// Hero background image
const imgHeroBackground = '/assets/1c9081eb8a1bf7184d09a0304d1ffbda9a8d0678.webp'

export const EmployerRegistrationHero: React.FC = () => {
  return (
    <PageHero
      imageSrc={imgHeroBackground}
      imageAlt="Employer registration background"
      title="Employer Account"
      overlayOpacity="black/40"
      titleColor="white"
      objectFit="cover"
      objectPosition="center"
    />
  )
}












