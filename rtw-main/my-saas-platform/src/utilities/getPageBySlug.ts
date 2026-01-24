import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { cache } from 'react'

/**
 * Get a page by slug from Payload CMS (cached)
 * Used for fetching SEO metadata for public pages
 */
export const getPageBySlug = cache(async (slug: string) => {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pages',
    where: {
      slug: {
        equals: slug,
      },
    },
    limit: 1,
    depth: 2,
  })
  return result.docs[0] || null
})
