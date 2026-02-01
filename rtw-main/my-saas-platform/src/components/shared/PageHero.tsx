'use client'

import React from 'react'
import { ImageWithSkeleton } from '../homepage/ImageWithSkeleton'
import { cn } from '@/lib/utils'

export interface PageHeroProps {
  /** Background image source URL */
  imageSrc: string
  /** Alt text for the background image */
  imageAlt: string
  /** Hero title (can be string or ReactNode for translations) */
  title: React.ReactNode
  /** Optional subtitle/description below the title */
  description?: React.ReactNode
  /** Overlay color and opacity (e.g., "black/30", "black/40", "white/10") */
  overlayOpacity?: string
  /** Title text color */
  titleColor?: 'white' | 'colored'
  /** Image object position */
  objectPosition?: string
  /** Image object fit */
  objectFit?: 'cover' | 'contain' | 'fill'
  /** Additional className for the section */
  className?: string
}

/**
 * Converts overlay opacity string (e.g., "black/30") to inline style
 */
const getOverlayStyle = (overlayOpacity: string): React.CSSProperties => {
  const [color, opacity] = overlayOpacity.split('/')
  const opacityValue = opacity ? Number.parseInt(opacity, 10) / 100 : 0.3
  
  if (color === 'black') {
    return { backgroundColor: `rgba(0, 0, 0, ${opacityValue})` }
  } else if (color === 'white') {
    return { backgroundColor: `rgba(255, 255, 255, ${opacityValue})` }
  }
  
  // Default to black/30
  return { backgroundColor: 'rgba(0, 0, 0, 0.3)' }
}

export const PageHero: React.FC<PageHeroProps> = ({
  imageSrc,
  imageAlt,
  title,
  description,
  overlayOpacity = 'black/30',
  titleColor = 'white',
  objectPosition = 'center',
  objectFit = 'cover',
  className,
}) => {
  return (
    <section
      className={cn(
        'relative w-full min-h-[355px] md:min-h-[675px] overflow-hidden rounded-bl-3xl rounded-br-3xl sm:rounded-bl-[40px] sm:rounded-br-[40px] md:rounded-bl-[50px] md:rounded-br-[50px]',
        className
      )}
    >
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithSkeleton
          alt={imageAlt}
          fill
          priority
          src={imageSrc}
          objectFit={objectFit}
          objectPosition={objectPosition}
        />
      </div>

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={getOverlayStyle(overlayOpacity)}
      />

      {/* Content - positioned at bottom left */}
      <div className="absolute bottom-0 left-0 right-0 z-10 px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px] pb-8 sm:pb-10 md:pb-12 lg:pb-16">
        <h1
          className={cn(
            'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold font-inter leading-tight',
            titleColor === 'white' ? 'text-white' : 'text-[#4644b8]'
          )}
        >
          {title}
        </h1>
        {description && (
          <p
            className={cn(
              'mt-4 sm:mt-5 max-w-2xl text-base sm:text-lg md:text-xl leading-relaxed',
              titleColor === 'white' ? 'text-white/95' : 'text-[#16252d]/90'
            )}
          >
            {description}
          </p>
        )}
      </div>
    </section>
  )
}
