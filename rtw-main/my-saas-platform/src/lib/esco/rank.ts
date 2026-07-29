import type { EscoOccupationResult } from './search'

export interface RankedOccupation extends EscoOccupationResult {
  score: number
  /** Which search term produced this result */
  sourceTermIndex: number
}

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\u0600-\u06ff\s]/g, ' ')
    .split(/\s+/)
    .filter(Boolean)
}

/**
 * Fraction of `needle`'s tokens that appear in `haystack`.
 *
 * Deliberately normalised by the needle length (not the longer string) so that
 * a specific ESCO title such as "heating, ventilation, air conditioning and
 * refrigeration engineering technician" is not penalised for being long when it
 * fully contains the search term "air conditioning technician".
 */
function coverage(needle: string, haystack: string): number {
  const needleTokens = tokenize(needle)
  if (!needleTokens.length) return 0
  const haystackTokens = new Set(tokenize(haystack))
  let matched = 0
  for (const token of needleTokens) {
    if (haystackTokens.has(token)) matched++
  }
  return matched / needleTokens.length
}

/**
 * Merge results from multiple search terms, dedupe by URI, and rank them.
 *
 * Scoring, highest first:
 *   200            exact preferred-label match to a search term
 *   +60            exact alternative-label match to a search term
 *   coverage^2*80  how completely the label covers the search term. Squaring
 *                  separates a full match (80) from a match on only a generic
 *                  role word like "technician" (~9 for a 3-token term).
 *   +25            bonus when the label covers every token of the search term
 *   +inputCov*15   similarity to the candidate's original wording
 *   +15            occupation already commonly selected on ReadyToWork
 *   -termIndex*3   earlier search terms outrank later ones
 *   -resultIndex/2 preserves ESCO's own relevance order as a tie-breaker
 */
export function rankResults(
  resultsByTerm: Array<EscoOccupationResult[]>,
  searchTerms: string[],
  originalInput: string,
  popularUris: Set<string> = new Set(),
): RankedOccupation[] {
  const seen = new Map<string, RankedOccupation>()

  resultsByTerm.forEach((results, termIndex) => {
    const term = (searchTerms[termIndex] ?? '').toLowerCase().trim()
    if (!term) return

    results.forEach((result, resultIndex) => {
      if (!result.uri) return

      const label = result.preferredLabel.toLowerCase().trim()
      let score: number

      if (label === term) {
        score = 200
      } else {
        const cov = coverage(term, label)
        score = cov * cov * 80
        if (cov === 1) score += 25
        if (result.altLabels.some((alt) => alt.toLowerCase().trim() === term)) {
          score += 60
        }
      }

      score += coverage(originalInput, result.preferredLabel) * 15
      if (popularUris.has(result.uri)) score += 15
      score -= termIndex * 3
      score -= resultIndex * 0.5

      const existing = seen.get(result.uri)
      if (!existing || existing.score < score) {
        seen.set(result.uri, { ...result, score, sourceTermIndex: termIndex })
      }
    })
  })

  return Array.from(seen.values()).sort((a, b) => b.score - a.score)
}
