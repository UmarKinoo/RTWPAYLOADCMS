/**
 * Helper functions for accessing localized CMS content
 * This demonstrates the pattern for bilingual fields in Payload CMS
 */

type Locale = 'en' | 'ar'

/**
 * Get localized field value from CMS document
 * Falls back to English, then to the base field, then to empty string
 *
 * @param doc - The CMS document (e.g., Page, Post)
 * @param fieldBase - Base field name (e.g., 'title', 'content')
 * @param locale - Current locale ('en' or 'ar')
 * @returns Localized field value or fallback
 *
 * @example
 * const pageTitle = getLocalizedField(page, 'title', 'ar')
 * // Returns page.title_ar || page.title_en || page.title || ''
 */
export function getLocalizedField<T extends Record<string, any>>(
  doc: T | null | undefined,
  fieldBase: string,
  locale: Locale
): string {
  if (!doc) return ''

  // Try locale-specific field first
  const localizedField = `${fieldBase}_${locale}` as keyof T
  if (doc[localizedField] && typeof doc[localizedField] === 'string') {
    return doc[localizedField] as string
  }

  // Fallback to English
  if (locale === 'ar') {
    const englishField = `${fieldBase}_en` as keyof T
    if (doc[englishField] && typeof doc[englishField] === 'string') {
      return doc[englishField] as string
    }
  }

  // Fallback to base field
  if (doc[fieldBase] && typeof doc[fieldBase] === 'string') {
    return doc[fieldBase] as string
  }

  return ''
}

/**
 * Get localized field with custom fallback chain
 *
 * @param doc - The CMS document
 * @param fieldBase - Base field name
 * @param locale - Current locale
 * @param fallbackChain - Custom fallback order (e.g., ['title_ar', 'title_en', 'title'])
 * @returns Localized field value or empty string
 */
export function getLocalizedFieldWithFallback<T extends Record<string, any>>(
  doc: T | null | undefined,
  fieldBase: string,
  locale: Locale,
  fallbackChain: string[] = []
): string {
  if (!doc) return ''

  // Use custom fallback chain if provided
  if (fallbackChain.length > 0) {
    for (const fieldName of fallbackChain) {
      if (doc[fieldName] && typeof doc[fieldName] === 'string') {
        return doc[fieldName] as string
      }
    }
    return ''
  }

  // Default fallback chain
  return getLocalizedField(doc, fieldBase, locale)
}





