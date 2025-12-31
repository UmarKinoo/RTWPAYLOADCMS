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
 * Get all plans (cached with 'plans' tag)
 */
export const getPlans = () =>
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
        title: doc.title,
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
    ['plans'],
    {
      tags: ['plans'],
      revalidate: 60, // Revalidate every 60 seconds
    },
  )()



