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
    // Get the actual browser pathname to ensure we have the full path
    const actualPathname = typeof window !== 'undefined' ? window.location.pathname : ''
    
    // Extract path without locale (remove /en or /ar prefix)
    let pathWithoutLocale = actualPathname.replace(/^\/(en|ar)/, '') || '/'
    
    // Ensure path starts with /
    if (!pathWithoutLocale.startsWith('/')) {
      pathWithoutLocale = `/${pathWithoutLocale}`
    }
    
    // Construct the new path with the other locale
    const newPath = pathWithoutLocale === '/' 
      ? `/${otherLocale}` 
      : `/${otherLocale}${pathWithoutLocale}`
    
    // Preserve query string and hash if they exist
    const search = typeof window !== 'undefined' ? window.location.search : ''
    const hash = typeof window !== 'undefined' ? window.location.hash : ''
    const fullPath = `${newPath}${search}${hash}`
    
    // Use window.location for direct navigation to avoid locale conflicts
    window.location.href = fullPath
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


