'use client'

import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { locales, defaultLocale } from '@/i18n/config'
import { Globe } from 'lucide-react'

export function LanguageSwitcher() {
  const router = useRouter()
  const pathname = usePathname()

  // Extract current locale from pathname
  const pathSegments = pathname.split('/').filter(Boolean)
  const currentLocale = pathSegments[0] || defaultLocale

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
    const pathWithoutLocale = '/' + pathSegments.slice(1).join('/')
    const newPath = `/${otherLocale}${pathWithoutLocale === '/' ? '' : pathWithoutLocale}`
    router.push(newPath)
  }

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={switchLocale}
      className="flex items-center gap-2"
      aria-label={`Switch to ${otherLocale === 'ar' ? 'Arabic' : 'English'}`}
    >
      <Globe className="h-4 w-4" />
      <span className="font-semibold">{getLocaleDisplayName(otherLocale)}</span>
    </Button>
  )
}


