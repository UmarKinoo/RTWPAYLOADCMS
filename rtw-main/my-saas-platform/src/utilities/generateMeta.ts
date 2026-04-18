import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { getServerSideURL } from './getURL'

function mediaToAbsoluteUrl(
  media: number | Media | null | undefined,
  baseUrl: string,
): string | null {
  if (!media || typeof media === 'number') return null
  const url = media.url
  if (!url) return null
  if (/^https?:\/\//i.test(url)) return url
  return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`
}

/**
 * Prefer CMS images for og:image so Next.js does not fall back to the app-level
 * `opengraph-image` (starter) for posts/pages that have a hero or SEO image.
 */
function pickOgImageUrl(
  doc: Partial<Page> | Partial<Post> | { meta?: { image?: Media | Config['db']['defaultIDType'] | null } } | null,
  baseUrl: string,
): string | null {
  if (!doc) return null
  if ('heroImage' in doc) {
    const post = doc as Partial<Post>
    return (
      mediaToAbsoluteUrl(post.heroImage, baseUrl) ||
      mediaToAbsoluteUrl(post.meta?.image, baseUrl) ||
      null
    )
  }
  if ('hero' in doc && doc.hero && typeof doc.hero === 'object') {
    const page = doc as Partial<Page>
    return (
      mediaToAbsoluteUrl(page.meta?.image, baseUrl) ||
      mediaToAbsoluteUrl(page.hero?.media, baseUrl) ||
      null
    )
  }
  return mediaToAbsoluteUrl(
    (doc as { meta?: { image?: Media | Config['db']['defaultIDType'] | null } }).meta?.image,
    baseUrl,
  )
}

/**
 * Single source of truth for page metadata. Sets canonical URL and, when the
 * document has a populated image, openGraph/twitter so social previews use the
 * CMS image instead of the default route `opengraph-image`.
 */
export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | { meta?: { title?: string; description?: string; image?: Media | Config['db']['defaultIDType'] | null } } | null
  /** Path including locale for canonical (e.g. "en/about"). Required for <link rel="canonical"> in head. */
  path?: string
  /** Fallback title and description when doc is null (e.g. for static pages without CMS page). */
  fallback?: { title: string; description: string }
}): Promise<Metadata> => {
  const { doc, path: pathWithLocale, fallback } = args
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  const canonicalUrl = pathWithLocale ? `${baseUrl}/${pathWithLocale}` : undefined

  const suffix = ' | Ready to Work'
  const rawTitle = doc?.meta?.title?.trim() ?? fallback?.title?.trim()
  const title = rawTitle
    ? rawTitle.endsWith(suffix)
      ? rawTitle
      : rawTitle + suffix
    : 'Ready to Work'

  const description = doc?.meta?.description?.trim() ?? fallback?.description?.trim() ?? undefined

  const ogImageUrl = pickOgImageUrl(doc, baseUrl)

  const isPost = doc != null && 'heroImage' in doc

  const openGraphTwitter: Pick<Metadata, 'openGraph' | 'twitter'> | undefined = ogImageUrl
    ? {
        openGraph: {
          type: isPost ? 'article' : 'website',
          title,
          description,
          url: canonicalUrl,
          images: [{ url: ogImageUrl }],
        },
        twitter: {
          card: 'summary_large_image',
          title,
          description,
          images: [ogImageUrl],
        },
      }
    : undefined

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    ...(canonicalUrl && { alternates: { canonical: canonicalUrl } }),
    ...openGraphTwitter,
  }
}
