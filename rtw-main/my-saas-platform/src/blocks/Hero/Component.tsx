'use client'

import React from 'react'

import type { HeroBlock as HeroBlockProps } from '@/payload-types'

import RichText from '@/components/RichText'
import { CMSLink } from '@/components/Link'
import { Media } from '@/components/Media'
import { Container } from '@/components/ds'

/**
 * Hero Block Component
 * Follows the "Full-Width / Centered-Content" pattern:
 * - Outer: <section> with w-full for background
 * - Inner: <Container> for centered content
 */
export const HeroBlock: React.FC<HeroBlockProps> = ({
  title,
  subtitle,
  backgroundImage,
  overlayOpacity = 36,
  links,
  enableSearch,
  searchPlaceholder,
}) => {
  return (
    <section className="relative w-full overflow-hidden rounded-[50px] px-4 md:px-8">
      {/* Background Image */}
      {backgroundImage && (
        <div className="absolute inset-0">
          <Media
            resource={backgroundImage}
            className="h-full w-full"
            imgClassName="h-full w-full object-cover"
            htmlElement="div"
          />
        </div>
      )}

      {/* Overlay */}
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          backgroundColor: `rgba(0, 0, 0, ${(overlayOpacity ?? 36) / 100})`,
        }}
      />

      {/* Content - Using Container for centered content with left/right spacing */}
      <Container className="relative z-10 py-32 md:py-40 px-0">
        <div className="max-w-4xl mx-auto text-center text-white">
          {/* Title */}
          {title && (
            <div className="mb-6">
              <RichText className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight" data={title} enableGutter={false} />
            </div>
          )}

          {/* Subtitle */}
          {subtitle && (
            <p className="text-xl md:text-2xl lg:text-3xl mb-8 leading-relaxed max-w-3xl mx-auto">
              {subtitle}
            </p>
          )}

          {/* CTA Buttons */}
          {links && links.length > 0 && (
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mt-10">
              {links.map(({ link }, i) => (
                <CMSLink
                  key={i}
                  size="lg"
                  {...link}
                  className="px-8 py-4 rounded-[30px] font-semibold text-lg uppercase transition-opacity hover:opacity-90"
                />
              ))}
            </div>
          )}

          {/* Search Section */}
          {enableSearch && (
            <div className="mt-12 max-w-2xl mx-auto">
              <div className="backdrop-blur-[21.6px] bg-white/20 rounded-[30px] p-6 flex items-center gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder={searchPlaceholder || 'Smart Search'}
                    className="w-full bg-transparent border-none outline-none text-white placeholder:text-white/80 text-xl"
                  />
                </div>
                <button
                  type="button"
                  className="bg-white rounded-[20px] p-4 flex items-center justify-center hover:opacity-90 transition-opacity cursor-pointer"
                  aria-label="Search"
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="text-gray-800"
                  >
                    <path
                      d="M21 21L15 15M17 10C17 13.866 13.866 17 10 17C6.13401 17 3 13.866 3 10C3 6.13401 6.13401 3 10 3C13.866 3 17 6.13401 17 10Z"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </div>
      </Container>
    </section>
  )
}

