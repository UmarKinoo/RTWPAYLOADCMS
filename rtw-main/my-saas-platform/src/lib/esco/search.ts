import { unstable_cache } from 'next/cache'
import { escoFetch, EscoUnavailableError } from './client'

export interface EscoOccupationResult {
  uri: string
  preferredLabel: string
  altLabels: string[]
  /** The ESCO label that actually matched the query, when it differs from the preferred label */
  matchedLabel?: string
  description?: string
}

/** ESCO search results carry no description, so only a subset of fields is present here. */
interface EscoSearchHit {
  uri?: string
  title?: string
  searchHit?: string
}

async function _searchOccupations(
  term: string,
  language: string,
): Promise<EscoOccupationResult[]> {
  try {
    const data = (await escoFetch('/search', {
      type: 'occupation',
      text: term,
      language,
      limit: '20',
    })) as { _embedded?: { results?: EscoSearchHit[] } }

    const hits = data?._embedded?.results ?? []

    return hits
      .map((hit) => {
        const preferredLabel = hit.title ?? ''
        const matchedLabel = hit.searchHit ?? ''
        return {
          uri: hit.uri ?? '',
          preferredLabel,
          // Surface the matched label only when it adds information
          altLabels:
            matchedLabel && matchedLabel !== preferredLabel ? [matchedLabel] : [],
          matchedLabel: matchedLabel || undefined,
        }
      })
      .filter((result) => result.uri && result.preferredLabel)
  } catch (err) {
    if (err instanceof EscoUnavailableError) throw err
    console.error('[ESCO search] unexpected error:', err)
    return []
  }
}

/**
 * Search ESCO occupations for a single term in a given language.
 * Results are cached per (term + language) for 7 days.
 */
export function searchOccupations(
  term: string,
  language: string,
): Promise<EscoOccupationResult[]> {
  const normalized = term.trim().toLowerCase()
  return unstable_cache(
    () => _searchOccupations(normalized, language),
    ['esco-search', normalized, language],
    { tags: ['esco-search'], revalidate: 60 * 60 * 24 * 7 },
  )()
}
