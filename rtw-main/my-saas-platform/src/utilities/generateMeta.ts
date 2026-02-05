import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { getServerSideURL } from './getURL'

/**
 * Single source of truth for page metadata. Returns only the fields that Next.js 15
 * reliably puts in <head>. No openGraph/twitter here to avoid layout+page merge
 * putting <title> or <link canonical> in the body.
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

  return {
    metadataBase: new URL(baseUrl),
    title,
    description,
    ...(canonicalUrl && { alternates: { canonical: canonicalUrl } }),
  }
}
