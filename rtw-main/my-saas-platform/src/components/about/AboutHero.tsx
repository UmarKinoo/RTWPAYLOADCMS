'use client'

import React from 'react'
import { useTranslations } from 'next-intl'
import { ImageWithSkeleton } from '../homepage/ImageWithSkeleton'

// Image assets
const imgHeroBackground = '/assets/c2df08f896cde0b8275e3431e7c61726d4317c88.webp'

export const AboutHero: React.FC = () => {
  const t = useTranslations('about.hero')

  return (
    <section className="relative w-full min-h-[675px] overflow-hidden rounded-bl-3xl rounded-br-3xl sm:rounded-bl-[40px] sm:rounded-br-[40px] md:rounded-bl-[50px] md:rounded-br-[50px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithSkeleton
          alt="About us background"
          fill
          priority
          src={imgHeroBackground}
          objectPosition="center top"
        />
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/30" />

      {/* Content - positioned at bottom left */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-inter text-white leading-tight">
          {t('title')}
        </h1>
      </div>
    </section>
  )
}
