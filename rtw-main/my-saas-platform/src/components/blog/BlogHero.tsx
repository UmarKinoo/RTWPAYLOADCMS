import React from 'react'
import { PageHero } from '@/components/shared/PageHero'

const HERO_IMAGE = '/assets/ee37e2e81115be02a56e755bd886e01749e53950.webp'

export const BlogHero: React.FC = () => {
  return (
    <PageHero
      imageSrc={HERO_IMAGE}
      imageAlt="Blog"
      title="Blog Post"
      overlayOpacity="black/20"
      titleColor="white"
      objectFit="cover"
    />
  )
}
