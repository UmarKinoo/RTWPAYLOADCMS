'use client'

import { useTranslations } from 'next-intl'
import { MiniLoader } from '@/components/ui/mini-loader'

/** Shown while the RegistrationWizard chunk is loading (dynamic import). */
export function RegistrationWizardFallback() {
  const t = useTranslations('registration')
  return (
    <MiniLoader
      message={t('loading')}
      fullScreen
      size="md"
      className="min-h-[60vh]"
    />
  )
}
