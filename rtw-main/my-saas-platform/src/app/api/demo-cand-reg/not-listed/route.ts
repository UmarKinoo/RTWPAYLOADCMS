/**
 * POST /api/demo-cand-reg/not-listed
 *
 * Saves a custom job title when the candidate cannot find their occupation in ESCO.
 * Adds to the admin review queue via candidate-occupations (source: unmapped).
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface NotListedBody {
  sessionId: string
  customTitle: string
  originalWording?: string
  language?: string
}

export async function POST(request: NextRequest) {
  let body: NotListedBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sessionId, customTitle, originalWording, language } = body

  if (!sessionId || !customTitle?.trim()) {
    return NextResponse.json(
      { error: 'sessionId and customTitle are required' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })

    const occupation = await payload.create({
      collection: 'candidate-occupations',
      data: {
        sessionId,
        escoUri: '',
        preferredLabel: customTitle.trim(),
        language: language ?? 'en',
        originalWording: originalWording ?? customTitle.trim(),
        source: 'unmapped',
        customTitle: customTitle.trim(),
        verificationStatus: 'unverified',
      },
    })

    // Also log this as a not-listed search (fire-and-forget)
    payload
      .create({
        collection: 'esco-search-logs',
        data: {
          originalInput: originalWording ?? customTitle,
          detectedLanguage: language ?? 'en',
          notListed: true,
          customTitle: customTitle.trim(),
          resultCount: 0,
          durationMs: 0,
          aiFailed: false,
          escoFailed: false,
          sessionId,
        },
      })
      .catch((e) => console.error('[not-listed] log error:', e))

    return NextResponse.json({
      success: true,
      occupationId: String(occupation.id),
    })
  } catch (err) {
    console.error('[demo-cand-reg not-listed] error:', err)
    return NextResponse.json({ error: 'Failed to save custom title' }, { status: 500 })
  }
}
