'use client'

import { useState } from 'react'
import { LoginForm } from '@/components/auth/login-form'
import { LoginPageToast } from '@/components/auth/login-page-toast'
import { RegisterTypeModalWrapper } from '@/components/auth/RegisterTypeModalWrapper'
import { Link } from '@/i18n/routing'
import { useTranslations } from 'next-intl'
import Image from 'next/image'
import { User, Building2, ArrowRight, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

// Background image
const backgroundImage = '/assets/c2df08f896cde0b8275e3431e7c61726d4317c88.webp'
// Logo
const logoSrc = '/assets/03bdd9d6f0fa9e8b68944b910c59a8474fc37999.svg'

interface LoginPageClientProps {
  success?: string
  error?: string
  initialCollection?: string
}

export function LoginPageClient({ success, error, initialCollection }: LoginPageClientProps) {
  const t = useTranslations('auth')
  const [selectedType, setSelectedType] = useState<'candidate' | 'employer' | null>(
    initialCollection === 'employers' ? 'employer' : 
    initialCollection === 'candidates' ? 'candidate' : 
    null
  )

  return (
    <div className="fixed inset-0 w-full h-full overflow-hidden">
      {/* Full-screen Background Image */}
      <div className="absolute inset-0 w-full h-full">
        <Image
          src={backgroundImage}
          alt="Background"
          fill
          className="object-cover"
          priority
          sizes="100vw"
        />
        {/* Dark gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-black/60" />
      </div>

      {/* Back to Home Link - Top Left */}
      <Link 
        href="/" 
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-white/90 hover:text-white transition-colors group"
      >
        <svg 
          className="w-5 h-5 transform group-hover:-translate-x-1 transition-transform" 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        <span className="text-sm font-medium">Back to Home</span>
      </Link>

      {/* Centered Login Card */}
      <div className="relative z-10 flex items-center justify-center min-h-full px-4 py-8">
        <div className="w-full max-w-[400px]">
          {/* Login Card */}
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Card Header with Logo */}
            <div className="px-6 pt-6 pb-3 text-center">
              {/* Logo - aspect ratio preserved */}
              <div className="mb-3 flex justify-center">
                <Image
                  src={logoSrc}
                  alt="Ready to Work"
                  width={160}
                  height={25}
                  className="h-auto w-auto max-w-[160px]"
                  priority
                />
              </div>

              {/* Title */}
              <h1 className="text-lg font-bold text-[#16252d]">
                {selectedType ? t('login') : t('loginAs')}
              </h1>
              <p className="mt-0.5 text-xs text-gray-500">
                {selectedType 
                  ? `Sign in as ${selectedType === 'candidate' ? 'Candidate' : 'Employer'}`
                  : 'Select your account type to continue'
                }
              </p>
            </div>

            {/* Card Body */}
            <div className="px-6 pb-5">
              {/* Toast Messages */}
              {(success || error) && (
                <div className="mb-3">
                  <LoginPageToast success={success} error={error} />
                </div>
              )}

              {/* Type Selection or Login Form */}
              {!selectedType ? (
                /* Type Selection */
                <div className="space-y-3">
                  {/* Candidate Option */}
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex items-center gap-3 hover:bg-[#4644b8]/5 hover:border-[#4644b8] transition-all group"
                    onClick={() => setSelectedType('candidate')}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#4644b8]/10 flex items-center justify-center group-hover:bg-[#4644b8]/20 transition-colors flex-shrink-0">
                      <User className="w-5 h-5 text-[#4644b8]" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm text-[#16252d]">{t('candidate')}</div>
                      <div className="text-xs text-gray-500">Looking for work opportunities</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#4644b8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Button>

                  {/* Employer Option */}
                  <Button
                    variant="outline"
                    className="w-full h-auto p-4 flex items-center gap-3 hover:bg-[#4644b8]/5 hover:border-[#4644b8] transition-all group"
                    onClick={() => setSelectedType('employer')}
                  >
                    <div className="w-10 h-10 rounded-full bg-[#4644b8]/10 flex items-center justify-center group-hover:bg-[#4644b8]/20 transition-colors flex-shrink-0">
                      <Building2 className="w-5 h-5 text-[#4644b8]" />
                    </div>
                    <div className="flex-1 text-left">
                      <div className="font-semibold text-sm text-[#16252d]">{t('employer')}</div>
                      <div className="text-xs text-gray-500">Hiring talent for your company</div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[#4644b8] opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                  </Button>
                </div>
              ) : (
                /* Login Form */
                <div>
                  {/* Back Button */}
                  <button
                    onClick={() => setSelectedType(null)}
                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#4644b8] transition-colors mb-3 group"
                  >
                    <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
                    <span>Change account type</span>
                  </button>

                  {/* Login Form */}
                  <LoginForm collection={selectedType === 'employer' ? 'employers' : 'candidates'} />
                </div>
              )}

              {/* Sign Up Link */}
              <div className="mt-4 pt-3 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  {t('dontHaveAccount')}{' '}
                  <RegisterTypeModalWrapper>
                    <button className="text-[#4644b8] hover:text-[#3a3aa0] font-semibold transition-colors hover:underline underline-offset-2">
                      {t('signUpNow')}
                    </button>
                  </RegisterTypeModalWrapper>
                </p>
              </div>
            </div>
          </div>

          {/* Footer Links */}
          <div className="mt-6 text-center">
            <p className="text-xs text-white/70">
              © {new Date().getFullYear()} Ready to Work. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

