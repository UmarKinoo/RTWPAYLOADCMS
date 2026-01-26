'use client'

import React from 'react'
import { PageHero } from '../shared/PageHero'

// Hero background image
const imgHeroBackground = '/assets/72a7dc683281a0bfe193c81609cc3ea29e31fd5b.webp'

export const ContactHero: React.FC = () => {
  return (
    <PageHero
      imageSrc={imgHeroBackground}
      imageAlt="Contact us background"
      title="Contact Us"
      overlayOpacity="black/40"
      titleColor="white"
      objectFit="cover"
      objectPosition="center"
    />
  )
}

