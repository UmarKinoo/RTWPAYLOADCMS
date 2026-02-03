import type { MetadataRoute } from 'next'
import { unstable_cache } from 'next/cache'
import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { getServerSideURL } from '@/utilities/getURL'
import { locales } from '@/i18n/config'

// -----------------------------------------------------------------------------
// Cached Payload data (revalidated when Payload hooks call revalidateTag)
// -----------------------------------------------------------------------------

async function fetchSitemapPages() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'pages',
    draft: false,
    limit: 2000,
    pagination: false,
    overrideAccess: false,
    select: { slug: true, updatedAt: true },
  })
  return (result.docs || []).filter((p) => p.slug && p.slug !== 'home') as Array<{
    slug: string
    updatedAt: string
  }>
}

async function fetchSitemapPosts() {
  const payload = await getPayload({ config: configPromise })
  const result = await payload.find({
    collection: 'posts',
    draft: false,
    limit: 2000,
    pagination: false,
    overrideAccess: false,
    where: { _status: { equals: 'published' } },
    select: { slug: true, updatedAt: true },
  })
  return (result.docs || []).filter((p) => p.slug) as Array<{
    slug: string
    updatedAt: string
  }>
}

const getCachedSitemapPages = () =>
  unstable_cache(fetchSitemapPages, ['sitemap-pages'], {
    tags: ['pages-sitemap'],
    revalidate: 3600, // 1 hour fallback
  })

const getCachedSitemapPosts = () =>
  unstable_cache(fetchSitemapPosts, ['sitemap-posts'], {
    tags: ['posts-sitemap'],
    revalidate: 3600,
  })

// -----------------------------------------------------------------------------
// Static paths (no locale prefix in path; we add locale in the loop)
// -----------------------------------------------------------------------------

const STATIC_PATHS = [
  '', // home
  'about',
  'blog',
  'candidates',
  'contact',
  'pricing',
  'register',
  'employer/register',
  'login',
  'register-type',
  'privacy-policy',
  'terms-and-conditions',
  'disclaimer',
  'custom-request',
] as const

// -----------------------------------------------------------------------------
// Sitemap entry builder
// -----------------------------------------------------------------------------

function entry(
  baseUrl: string,
  locale: string,
  path: string,
  options: {
    lastModified?: string
    changeFrequency?: MetadataRoute.Sitemap[0]['changeFrequency']
    priority?: number
  } = {}
): MetadataRoute.Sitemap[0] {
  const pathSegment = path ? `/${path}` : ''
  const url = `${baseUrl}/${locale}${pathSegment}`
  return {
    url,
    lastModified: options.lastModified ? new Date(options.lastModified) : undefined,
    changeFrequency: options.changeFrequency,
    priority: options.priority,
  }
}

// -----------------------------------------------------------------------------
// Default export (Next.js App Router)
// -----------------------------------------------------------------------------

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = getServerSideURL().replace(/\/$/, '')

  const [pages, posts] = await Promise.all([
    getCachedSitemapPages()(),
    getCachedSitemapPosts()(),
  ])

  const entries: MetadataRoute.Sitemap = []

  for (const locale of locales) {
    // Homepage and main static pages
    entries.push(
      entry(baseUrl, locale, '', {
        changeFrequency: 'daily',
        priority: 1,
      })
    )
    for (const path of STATIC_PATHS) {
      if (path === '') continue
      entries.push(
        entry(baseUrl, locale, path, {
          changeFrequency: path === 'blog' || path === 'candidates' ? 'daily' : 'monthly',
          priority: path === 'about' || path === 'candidates' ? 0.9 : 0.8,
        })
      )
    }

    // Payload CMS pages ([slug])
    for (const page of pages) {
      entries.push(
        entry(baseUrl, locale, page.slug, {
          lastModified: page.updatedAt,
          changeFrequency: 'weekly',
          priority: 0.7,
        })
      )
    }

    // Blog posts
    for (const post of posts) {
      entries.push(
        entry(baseUrl, locale, `posts/${post.slug}`, {
          lastModified: post.updatedAt,
          changeFrequency: 'monthly',
          priority: 0.7,
        })
      )
    }
  }

  return entries
}
