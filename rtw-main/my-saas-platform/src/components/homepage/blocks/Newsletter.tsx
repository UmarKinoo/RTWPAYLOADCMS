'use client'

import React, { useState } from 'react'
import { HomepageSection } from '../HomepageSection'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'
import { useTranslations } from 'next-intl'

export const Newsletter: React.FC = () => {
  const t = useTranslations('homepage.newsletter')
  const [email, setEmail] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    console.log('Newsletter signup:', email)
    setEmail('')
  }

  return (
    <HomepageSection className="pb-0">
      {/* Background container */}
      <div className="bg-[rgba(175,183,255,0.5)] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] py-8 sm:py-10 md:py-12 lg:py-14">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px]">
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 lg:gap-10">
            {/* Left Side - Heading */}
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-inter text-[#16252d] leading-tight">
                {t('title')}
              </h2>
            </div>

            {/* Right Side - Email Input and Privacy Text */}
            <div className="flex-1 flex flex-col gap-2.5">
              {/* Email Input Container */}
              <div className="relative bg-[#4644b8] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3">
                <label className="text-xs sm:text-sm font-bold font-inter text-white uppercase flex-shrink-0">
                  {t('emailLabel')}
                </label>
                <Input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent border-none text-white placeholder-white/60 text-sm sm:text-base font-normal focus-visible:ring-0 focus-visible:ring-offset-0 h-8"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  className="flex-shrink-0 bg-white/20 hover:bg-white/30 rounded-lg w-8 h-8 sm:w-9 sm:h-9"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                </Button>
              </div>

              {/* Privacy Text */}
              <p className="text-[10px] sm:text-xs font-normal font-inter text-black/70 uppercase">
                {t('privacyTextEnd') ? (
                  <>
                    {t('privacyText')}{' '}
                    <a href="#privacy" className="underline hover:text-black">
                      {t('privacyPolicy')}
                    </a>
                    {t('privacyTextEnd')}
                  </>
                ) : (
                  t('privacyText')
                )}
              </p>
            </div>
          </form>
        </div>
      </div>
    </HomepageSection>
  )
}
