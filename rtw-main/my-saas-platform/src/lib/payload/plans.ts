import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'

export interface Plan {
  id: number
  slug: string
  title: string
  price: number | null
  currency: string
  entitlements: {
    interviewCreditsGranted: number
    contactUnlockCreditsGranted: number
    basicFilters: boolean
    nationalityRestriction: 'NONE' | 'SAUDI'
    isCustom: boolean
  }
}

/**
 * Get localized plan title
 */
// Type for plan with localized title field
type PlanWithLocalizedTitle = {
  title?: string | { [key: string]: string } | null
  [key: string]: unknown
}

function getLocalizedPlanTitle(plan: PlanWithLocalizedTitle, locale: string): string {
  if (locale === 'ar' && plan.title_ar) {
    return plan.title_ar
  }
  if (locale === 'en' && plan.title_en) {
    return plan.title_en
  }
  // Fallback to title_en if available, otherwise use title
  return plan.title_en || plan.title || ''
}

/**
 * Get all plans (cached with 'plans' tag)
 * @param locale - Current locale ('en' or 'ar') for localized titles
 */
export const getPlans = (locale: string = 'en') =>
  unstable_cache(
    async () => {
      const payload = await getPayload({ config: configPromise })

      const result = await payload.find({
        collection: 'plans',
        limit: 100,
        sort: 'price', // Sort by price ascending
      })

      return result.docs.map((doc) => ({
        id: doc.id,
        slug: doc.slug,
        title: getLocalizedPlanTitle(doc, locale),
        price: doc.price,
        currency: doc.currency || 'SAR',
        entitlements: {
          interviewCreditsGranted: doc.entitlements?.interviewCreditsGranted || 0,
          contactUnlockCreditsGranted: doc.entitlements?.contactUnlockCreditsGranted || 0,
          basicFilters: doc.entitlements?.basicFilters || false,
          nationalityRestriction: (doc.entitlements?.nationalityRestriction as 'NONE' | 'SAUDI') || 'NONE',
          isCustom: doc.entitlements?.isCustom || false,
        },
      })) as Plan[]
    },
    ['plans', locale],
    {
      tags: ['plans'],
      revalidate: 60, // Revalidate every 60 seconds
    },
  )()






