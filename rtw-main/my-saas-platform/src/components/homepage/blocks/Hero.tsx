'use client'

import React, { useState, FormEvent } from 'react'
import { useRouter } from '@/i18n/routing'
import { HomepageSection } from '../HomepageSection'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageWithSkeleton } from '../ImageWithSkeleton'
import { Search, Building2, User } from 'lucide-react'
import { useTranslations } from 'next-intl'

// Image assets from public/assets/
const imgBusinessmanMakingCoffee20252 = '/assets/5902659f7a1d069cd46ab37be664dbed528febb1.webp'
const imgBusinessmanMakingCoffee20251 = '/assets/9067d496e1f10f37d480e3dc99e0dd3a6af0fb6c.svg'


interface HeroProps {
  /** Show Smart Search bar (employers only). Hidden for guests and candidates. */
  showSmartSearch?: boolean
}

export const Hero: React.FC<HeroProps> = ({ showSmartSearch = false }) => {
  const t = useTranslations('homepage.hero')
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const query = searchQuery.trim()
    if (query.length >= 2) {
      router.push(`/candidates?search=${encodeURIComponent(query)}`)
    }
  }

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
              {(() => {
                const title = t('title')
                const highlightWord = t('titleHighlight')
                const parts = highlightWord
                  ? title.split(new RegExp(`(${highlightWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`))
                  : title.split(/(Talent)/i)
                return parts.map((part, index) => {
                  const isHighlight = highlightWord ? part === highlightWord : /^Talent$/i.test(part)
                  if (isHighlight) {
                    return (
                      <span key={index} className="bg-[#d8e530] text-[#16252d] px-1.5 sm:px-2 rounded-md inline-block">
                        {part}
                      </span>
                    )
                  }
                  return <span key={index}>{part}</span>
                })
              })()}
            </h1>

            {/* Subtitle */}
            <p className="text-sm sm:text-base lg:text-lg font-semibold font-inter leading-relaxed text-white/90 mb-4 sm:mb-5">
              {t('subtitle')}
            </p>

            {/* Description */}
            {t('description') && (
              <p className="text-sm sm:text-base lg:text-lg font-normal font-inter leading-relaxed text-white/90 mb-6 sm:mb-8">
                {t('description')}
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/employer/register')}
                className="h-auto rounded-xl px-4 py-3 flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-wide bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 w-full sm:w-auto"
              >
                <Building2 className="w-5 h-5" />
                <span>{t('forEmployer')}</span>
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push('/register')}
                className="h-auto rounded-xl px-4 py-3 flex items-center justify-center gap-2.5 text-sm font-bold uppercase tracking-wide bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 w-full sm:w-auto"
              >
                <User className="w-5 h-5" />
                <span>{t('forCandidates')}</span>
              </Button>
            </div>

            {/* Smart Search – employers only */}
            {showSmartSearch && (
              <form onSubmit={handleSearch} className="relative w-full max-w-md">
                <div className="relative backdrop-blur-md bg-white/20 rounded-xl flex items-center">
                  <Input
                    type="text"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-transparent border-none text-white !placeholder-white placeholder:text-white text-sm sm:text-base font-normal px-4 py-3 h-12 pe-14 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                  <Button
                    type="submit"
                    variant="default"
                    size="icon"
                    className="absolute end-1.5 bg-white rounded-lg w-10 h-10 hover:bg-gray-100 shadow-sm"
                    disabled={searchQuery.trim().length < 2}
                  >
                    <Search className="w-4 h-4 text-[#16252d]" />
                  </Button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </HomepageSection>
  )
}
