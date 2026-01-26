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
  // usePathname() from next-intl returns pathname WITHOUT locale prefix
  const switchLocale = () => {
    try {
      // Get the pathname without locale (already done by usePathname from next-intl)
      // Ensure we have a valid path
      let pathWithoutLocale = pathname || '/'
      
      // Remove any existing locale prefix if somehow it's there (defensive check)
      pathWithoutLocale = pathWithoutLocale.replace(/^\/(en|ar)/, '') || '/'
      
      // Ensure path starts with /
      if (!pathWithoutLocale.startsWith('/')) {
        pathWithoutLocale = `/${pathWithoutLocale}`
      }
      
      // Construct the new path with the other locale
      // If pathname is '/', we want '/ar' or '/en'
      // If pathname is '/about', we want '/ar/about' or '/en/about'
      const newPath = pathWithoutLocale === '/' 
        ? `/${otherLocale}` 
        : `/${otherLocale}${pathWithoutLocale}`
      
      // Use push to navigate to the new locale
      router.push(newPath)
    } catch (error) {
      console.error('Error switching locale:', error)
      // Fallback: just navigate to the other locale's homepage
      router.push(`/${otherLocale}`)
    }
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


