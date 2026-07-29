'use client'

import { useTranslations } from 'next-intl'
import { HomepageNavbar } from '@/components/homepage/Navbar'
import { EscoWizard } from '@/components/demo-cand-reg/EscoWizard'

export function DemoCandRegContent() {
  const t = useTranslations('demoCandReg')

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f7fb] via-gray-50 to-gray-50 flex flex-col">
      <HomepageNavbar />
      <main className="flex-1 pt-24 sm:pt-28 md:pt-32 pb-10 sm:pb-16">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <header className="mb-6 sm:mb-8 text-center max-w-3xl mx-auto">
            <p className="text-xs sm:text-sm font-semibold tracking-wide uppercase text-[#4644b8] mb-2">
              ReadyToWork
            </p>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#16252d] leading-tight">
              {t('pageTitle')}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#757575] leading-relaxed">
              {t('pageDescription')}
            </p>
          </header>
          <EscoWizard />
        </div>
      </main>
      <footer className="py-6 text-center text-xs text-gray-400 border-t border-gray-200 bg-white/60">
        <p>&copy; {new Date().getFullYear()} ReadyToWork. All rights reserved.</p>
      </footer>
    </div>
  )
}
