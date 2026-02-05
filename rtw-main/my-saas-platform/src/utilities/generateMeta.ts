import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = (image as any).sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | { meta?: { title?: string; description?: string; image?: Media | Config['db']['defaultIDType'] | null } } | null
  /** Path including locale for canonical and og:url (e.g. "en/about"). Required for correct SEO with locales. */
  path?: string
  /** Fallback title and description when doc is null (e.g. for static pages without CMS page). */
  fallback?: { title: string; description: string }
}): Promise<Metadata> => {
  const { doc, path: pathWithLocale, fallback } = args
  const baseUrl = getServerSideURL().replace(/\/$/, '')
  const canonicalUrl = pathWithLocale ? `${baseUrl}/${pathWithLocale}` : undefined

  const ogImage = getImageURL(doc?.meta?.image)

  const suffix = ' | Ready to Work'
  const rawTitle = doc?.meta?.title?.trim() ?? fallback?.title?.trim()
  const title = rawTitle
    ? rawTitle.endsWith(suffix)
      ? rawTitle
      : rawTitle + suffix
    : 'Ready to Work'

  const description = doc?.meta?.description?.trim() ?? fallback?.description?.trim() ?? undefined

  // Next.js 15: setting openGraph.url or openGraph.type in page-level metadata can cause
  // <title> and meta tags to render in the body instead of <head>. We omit both here;
  // alternates.canonical is enough for SEO when path is provided.
  const mergedOg = mergeOpenGraph({
    description: description ?? '',
    images: ogImage ? [{ url: ogImage }] : undefined,
    title,
  })
  let openGraphSafe: Metadata['openGraph'] = mergedOg ?? undefined
  if (mergedOg != null && typeof mergedOg === 'object' && !Array.isArray(mergedOg)) {
    const copy = { ...mergedOg }
    delete (copy as Record<string, unknown>).type
    delete (copy as Record<string, unknown>).url
    openGraphSafe = copy as Metadata['openGraph']
  }

  return {
    metadataBase: new URL(baseUrl),
    description,
    title,
    alternates: canonicalUrl ? { canonical: canonicalUrl } : undefined,
    openGraph: openGraphSafe,
  }
}
