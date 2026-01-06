'use client'

import React from 'react'
import { HomepageSection } from '../HomepageSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import { Search, Building2, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Image assets from public/assets/
const imgBusinessmanMakingCoffee20252 = '/assets/5902659f7a1d069cd46ab37be664dbed528febb1.webp'
const imgBusinessmanMakingCoffee20251 = '/assets/9067d496e1f10f37d480e3dc99e0dd3a6af0fb6c.svg'

export const Hero: React.FC = () => {
  const t = useTranslations('homepage.hero')

  return (
    <HomepageSection className="pt-20 sm:pt-24 md:pt-28 lg:pt-32 pb-8 sm:pb-12 md:pb-16">
      {/* Content container */}
      <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden min-h-[400px] sm:min-h-[450px] md:min-h-[500px] lg:min-h-[550px] flex items-center">
        {/* Background */}
        <div className="absolute inset-0">
          <div className="absolute inset-0">
            <div
              className="absolute inset-0 rounded-2xl sm:rounded-3xl"
              style={{
                maskImage: `url('${imgBusinessmanMakingCoffee20251}')`,
                WebkitMaskImage: `url('${imgBusinessmanMakingCoffee20251}')`,
                maskSize: 'cover',
                maskPosition: 'center',
                maskRepeat: 'no-repeat',
              }}
            >
              <ImageWithSkeleton
                src={imgBusinessmanMakingCoffee20252}
                alt="Businessman making coffee"
                fill
                priority
                className="rounded-2xl sm:rounded-3xl"
                objectFit="cover"
                objectPosition="center right"
              />
            </div>
          </div>
          <div className="absolute inset-0 bg-black/60 mix-blend-multiply rounded-2xl sm:rounded-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full px-4 sm:px-6 md:px-8 lg:px-12 py-6 sm:py-8 md:py-10 lg:py-12">
          <div className="max-w-2xl">
            {/* Main Heading */}
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold font-inter leading-tight text-white mb-4 sm:mb-6">
              {t('title')}{' '}
              <span className="bg-[#d8e530] text-[#16252d] px-1.5 sm:px-2 rounded-md inline-block">
                {t('titleHighlight')}
              </span>{' '}
              {t('titleEnd')}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg font-normal font-inter leading-relaxed text-white/90 mb-6 sm:mb-8">
              {t('subtitle')}
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                variant="outline"
                size="lg"
                className="h-auto rounded-xl px-4 py-3 flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-wide bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 w-full sm:w-auto"
              >
                <Building2 className="w-5 h-5" />
                <span>{t('forEmployer')}</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="h-auto rounded-xl px-4 py-3 flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-wide bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 w-full sm:w-auto"
              >
                <User className="w-5 h-5" />
                <span>{t('forCandidates')}</span>
              </Button>
            </div>

            {/* Search Bar */}
            <div className="relative w-full max-w-md">
              <div className="relative backdrop-blur-md bg-white/20 rounded-xl flex items-center">
                <Input
                  type="text"
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-transparent border-none text-white placeholder-white/70 text-sm sm:text-base font-normal px-4 py-3 h-12 pe-14 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
                <Button
                  variant="default"
                  size="icon"
                  className="absolute end-1.5 bg-white rounded-lg w-10 h-10 hover:bg-gray-100 shadow-sm"
                >
                  <Search className="w-4 h-4 text-[#16252d]" />
                </Button>
              </div>
            </div>
          </div>

          {/* Bottom Right Text - Hidden on very small screens */}
          <p className="hidden sm:block absolute bottom-4 sm:bottom-6 end-4 sm:end-6 md:end-8 text-xs sm:text-sm font-medium text-white/80 text-end max-w-[200px] leading-tight">
            {t('verifiedLogo')}
          </p>
        </div>
      </div>
    </HomepageSection>
  )
}
