'use client'

import React, { useState } from 'react'
import { HomepageSection } from '../HomepageSection'
import { Button } from '@/components/ui/button'
import { ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { subscribeNewsletter } from '@/lib/newsletter'

export const Newsletter: React.FC = () => {
  const t = useTranslations('homepage.newsletter')
  const [email, setEmail] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [status, setStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email.trim()) {
      return
    }

    setIsSubmitting(true)
    setStatus(null)

    try {
      const result = await subscribeNewsletter(email.trim(), 'homepage')
      
      if (result.success) {
        setStatus({
          type: 'success',
          message: result.message || 'Successfully subscribed to our newsletter!',
        })
        setEmail('')
        setTimeout(() => {
          setStatus(null)
        }, 5000)
      } else {
        setStatus({
          type: 'error',
          message: result.error || 'Failed to subscribe. Please try again.',
        })
      }
    } catch (error) {
      setStatus({
        type: 'error',
        message: 'An unexpected error occurred. Please try again later.',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <HomepageSection className="pb-0">
      <style dangerouslySetInnerHTML={{
        __html: `
          .newsletter-email-input::placeholder {
            color: white !important;
            opacity: 1 !important;
          }
        `
      }} />
      <div className="bg-[rgba(175,183,255,0.5)] -mx-4 sm:-mx-6 md:-mx-8 lg:-mx-12 2xl:-mx-[95px] py-8 sm:py-10 md:py-12 lg:py-14">
        <div className="px-4 sm:px-6 md:px-8 lg:px-12 2xl:px-[95px]">
          <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6 lg:gap-10">
            {/* Heading */}
            <div className="flex-1">
              <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold font-inter text-[#16252d] leading-tight">
                {t('title')}
              </h2>
            </div>

            {/* Email Input Section */}
            <div className="flex-1 flex flex-col gap-2.5">
              {/* Status Message */}
              {status && (
                <div
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                    status.type === 'success'
                      ? 'bg-green-50 text-green-700 border border-green-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}
                >
                  {status.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  )}
                  <span>{status.message}</span>
                </div>
              )}

              {/* Email Input Container */}
              <div className="bg-[#4644b8] rounded-xl sm:rounded-2xl px-4 sm:px-5 py-3 sm:py-3.5 flex items-center gap-3">
                <label className="text-xs sm:text-sm font-bold font-inter text-white uppercase flex-shrink-0">
                  {t('emailLabel')}
                </label>
                <input
                  type="email"
                  placeholder={t('emailPlaceholder')}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                  className="newsletter-email-input flex-1 bg-transparent border-none text-white text-sm sm:text-base font-normal outline-none h-8 disabled:opacity-50"
                />
                <Button
                  type="submit"
                  variant="ghost"
                  size="icon"
                  disabled={isSubmitting}
                  className="flex-shrink-0 bg-white/20 hover:bg-white/30 rounded-lg w-8 h-8 sm:w-9 sm:h-9 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                  )}
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
