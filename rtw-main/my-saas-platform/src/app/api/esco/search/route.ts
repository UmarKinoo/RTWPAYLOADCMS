/**
 * POST /api/esco/search
 *
 * Main pipeline:
 *  1. Check esco-aliases for admin-defined mappings
 *  2. Check esco-query-cache for a fresh AI interpretation
 *  3. Call AI interpreter (fallback: raw input if AI fails)
 *  4. Search ESCO in parallel for each term
 *  5. Merge, dedupe, rank results
 *  6. Log the search (fire-and-forget)
 *  7. Return ranked occupations
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import crypto from 'crypto'

import { searchOccupations } from '@/lib/esco/search'
import { getOccupation } from '@/lib/esco/occupation'
import { interpretQuery } from '@/lib/esco/interpreter'
import { rankResults, type RankedOccupation } from '@/lib/esco/rank'
import { EscoUnavailableError } from '@/lib/esco/client'

/** Number of results shown before the candidate taps "load more". */
const PAGE_SIZE = 12

/**
 * ESCO search results contain no description, so fetch it for the results the
 * candidate actually sees. Detail responses are cached for 30 days, so this is
 * usually free on repeat searches. A failed lookup degrades to no description
 * rather than failing the whole search.
 */
async function attachDescriptions(
  results: RankedOccupation[],
  language: string,
): Promise<RankedOccupation[]> {
  return Promise.all(
    results.map(async (result) => {
      try {
        const detail = await getOccupation(result.uri, language)
        if (!detail) return result
        return {
          ...result,
          description: detail.description,
          altLabels: result.altLabels.length ? result.altLabels : detail.altLabels.slice(0, 3),
        }
      } catch {
        return result
      }
    }),
  )
}

// Simple in-memory rate limiter: max 10 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 60_000 })
    return true
  }
  if (entry.count >= 10) return false
  entry.count++
  return true
}

function hashInput(input: string): string {
  return crypto.createHash('sha256').update(input.trim().toLowerCase()).digest('hex')
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { input?: string; language?: string; sessionId?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const rawInput = (body.input ?? '').trim()
  const language = (body.language ?? 'en').toLowerCase().slice(0, 5)
  const sessionId = body.sessionId ?? ''

  if (!rawInput || rawInput.length < 2) {
    return NextResponse.json({ error: 'Input too short' }, { status: 400 })
  }

  const startTime = Date.now()
  const normalizedInput = rawInput.toLowerCase()
  const inputHash = hashInput(rawInput)

  let searchTerms: string[] = []
  let detectedLanguage: string = language
  let aiFailed = false

  const payload = await getPayload({ config })

  // 1. Check esco-aliases
  try {
    const aliasResult = await payload.find({
      collection: 'esco-aliases',
      where: {
        and: [
          { aliasTerm: { equals: normalizedInput } },
          { active: { equals: true } },
        ],
      },
      limit: 1,
    })
    const alias = aliasResult.docs[0]
    if (alias?.searchTerms && Array.isArray(alias.searchTerms)) {
      searchTerms = (alias.searchTerms as { term: string }[]).map((s) => s.term).filter(Boolean)
    }
  } catch (err) {
    console.error('[ESCO search] alias lookup error:', err)
  }

  // 2. Check esco-query-cache
  if (!searchTerms.length) {
    try {
      const cacheResult = await payload.find({
        collection: 'esco-query-cache',
        where: {
          and: [
            { inputHash: { equals: inputHash } },
            { expiresAt: { greater_than: new Date().toISOString() } },
          ],
        },
        limit: 1,
      })
      const cached = cacheResult.docs[0]
      if (cached?.searchTerms && Array.isArray(cached.searchTerms)) {
        searchTerms = cached.searchTerms as string[]
        if (typeof cached.detectedLanguage === 'string') {
          detectedLanguage = cached.detectedLanguage
        }
      }
    } catch (err) {
      console.error('[ESCO search] cache lookup error:', err)
    }
  }

  // 3. AI interpreter
  if (!searchTerms.length) {
    try {
      const interpreted = await interpretQuery(rawInput)
      searchTerms = interpreted.searchTerms
      detectedLanguage = interpreted.detectedLanguage

      // Store in cache (fire-and-forget)
      const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      payload
        .create({
          collection: 'esco-query-cache',
          data: {
            inputHash,
            input: rawInput,
            detectedLanguage,
            searchTerms,
            expiresAt,
          },
        })
        .catch((e) => console.error('[ESCO search] cache write error:', e))
    } catch (err) {
      aiFailed = true
      console.error('[ESCO search] AI interpreter failed:', err)
      // Fallback: search with original input
      searchTerms = [rawInput, normalizedInput].filter(
        (t, i, arr) => arr.indexOf(t) === i,
      )
    }
  }

  // 4. Search ESCO in parallel
  const escoLanguage = ['ar', 'fr'].includes(language) ? language : 'en'
  let escoFailed = false
  let resultsByTerm: Awaited<ReturnType<typeof searchOccupations>>[] = []

  try {
    resultsByTerm = await Promise.all(
      searchTerms.map((term) => searchOccupations(term, escoLanguage).catch(() => [])),
    )
    if (resultsByTerm.every((r) => r.length === 0)) {
      escoFailed = true
    }
  } catch (err) {
    escoFailed = true
    if (err instanceof EscoUnavailableError) {
      console.error('[ESCO search] ESCO unavailable:', err.message)
    }
  }

  // 5. Get popular URIs for ranking boost
  let popularUris = new Set<string>()
  try {
    const topResult = await payload.find({
      collection: 'candidate-occupations',
      where: { source: { equals: 'candidate-declared' } },
      limit: 200,
    })
    const uriCounts = new Map<string, number>()
    for (const doc of topResult.docs) {
      const uri = doc.escoUri as string | undefined
      if (uri) uriCounts.set(uri, (uriCounts.get(uri) ?? 0) + 1)
    }
    // Keep URIs appearing more than once
    for (const [uri, count] of uriCounts) {
      if (count > 1) popularUris.add(uri)
    }
  } catch {
    // Non-critical
  }

  // Rank, then enrich only the page the candidate sees with descriptions
  const ranked = rankResults(resultsByTerm, searchTerms, rawInput, popularUris)
  const topResults = await attachDescriptions(ranked.slice(0, PAGE_SIZE), escoLanguage)

  const durationMs = Date.now() - startTime

  // 6. Log the search. The id is returned so the save step can record which
  // occupation the candidate ultimately chose.
  let searchLogId: string | null = null
  try {
    const log = await payload.create({
      collection: 'esco-search-logs',
      data: {
        originalInput: rawInput,
        detectedLanguage,
        aiSearchTerms: searchTerms,
        escoQueries: searchTerms,
        resultCount: topResults.length,
        topResultUris: topResults.map((r) => r.uri).slice(0, 10),
        durationMs,
        aiFailed,
        escoFailed,
        sessionId,
      },
    })
    searchLogId = String(log.id)
  } catch (err) {
    console.error('[ESCO search] log write error:', err)
  }

  if (escoFailed && !topResults.length) {
    return NextResponse.json(
      {
        error: 'esco_unavailable',
        message: 'ESCO is temporarily unavailable. Please try again.',
        input: rawInput,
      },
      { status: 503 },
    )
  }

  return NextResponse.json({
    results: topResults,
    searchTerms,
    searchLogId,
    detectedLanguage,
    aiFailed,
    escoFailed,
    total: ranked.length,
    hasMore: ranked.length > PAGE_SIZE,
    // Remaining ranked results back the "load more" action. They have no
    // description because only the first page is enriched.
    moreResults: ranked.slice(PAGE_SIZE),
  })
}
