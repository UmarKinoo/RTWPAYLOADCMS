'use client'

import React from 'react'
import { ImageWithSkeleton } from '../homepage/ImageWithSkeleton'

// Hero background image
const imgHeroBackground = '/assets/1c9081eb8a1bf7184d09a0304d1ffbda9a8d0678.webp'

export const EmployerRegistrationHero: React.FC = () => {
  return (
    <section className="relative w-full min-h-[675px] overflow-hidden rounded-bl-3xl rounded-br-3xl sm:rounded-bl-[40px] sm:rounded-br-[40px] md:rounded-bl-[50px] md:rounded-br-[50px]">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithSkeleton
          alt="Employer registration background"
          fill
          priority
          src={imgHeroBackground}
          objectFit="cover"
          objectPosition="center"
        />
      </div>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Content - positioned at bottom left */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-inter text-white leading-tight">
          Employer Account
        </h1>
      </div>
    </section>
  )
}












