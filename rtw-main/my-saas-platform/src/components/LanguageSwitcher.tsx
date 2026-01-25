'use client'

import { usePathname, useRouter } from '@/i18n/routing'
import { useLocale } from 'next-intl'
import { Button } from '@/components/ui/button'
import { locales, defaultLocale } from '@/i18n/config'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()
  const currentLocale = useLocale()

  // Get the other locale
  const otherLocale = locales.find((loc) => loc !== currentLocale) || defaultLocale

  // Get display name for locale
  const getLocaleDisplayName = (locale: string) => {
    switch (locale) {
      case 'ar':
        return 'العربية'
      case 'en':
        return 'English'
      default:
        return locale.toUpperCase()
    }
  }

  // Switch locale while preserving the rest of the path
  const switchLocale = () => {
    const pathWithoutLocale = pathname.replace(`/${currentLocale}`, '') || '/'
    const newPath = `/${otherLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    router.push(newPath)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="flex items-center gap-2 w-full justify-start"
      aria-label={`Switch to ${otherLocale === 'ar' ? 'Arabic' : 'English'}`}
    >
      <Globe className="h-4 w-4" />
      <span className="font-semibold">{getLocaleDisplayName(otherLocale)}</span>
    </Button>
  )
}


