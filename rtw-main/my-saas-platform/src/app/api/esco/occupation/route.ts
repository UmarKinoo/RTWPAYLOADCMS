/**
 * GET /api/esco/occupation?uri=...&language=...
 *
 * Fetches full occupation details including essential and optional skills.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getOccupation } from '@/lib/esco/occupation'
import { EscoUnavailableError } from '@/lib/esco/client'

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const uri = (sp.get('uri') ?? '').trim()
  const language = (sp.get('language') ?? 'en').toLowerCase().slice(0, 5)
  const escoLanguage = ['ar', 'fr'].includes(language) ? language : 'en'

  if (!uri) {
    return NextResponse.json({ error: 'uri is required' }, { status: 400 })
  }

  try {
    const occupation = await getOccupation(uri, escoLanguage)
    if (!occupation) {
      return NextResponse.json({ error: 'Occupation not found' }, { status: 404 })
    }
    return NextResponse.json({ occupation })
  } catch (err) {
    if (err instanceof EscoUnavailableError) {
      return NextResponse.json(
        {
          error: 'esco_unavailable',
          message: 'ESCO is temporarily unavailable. Please try again.',
        },
        { status: 503 },
      )
    }
    console.error('[ESCO occupation] unexpected error:', err)
    return NextResponse.json({ error: 'Failed to fetch occupation' }, { status: 500 })
  }
}
