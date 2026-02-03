import type { MetadataRoute } from 'next'
import { getServerSideURL } from '@/utilities/getURL'

/**
 * Served at /robots.txt. References sitemap for SEO.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/admin/', '/dashboard/', '/employer/dashboard/', '/next/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
