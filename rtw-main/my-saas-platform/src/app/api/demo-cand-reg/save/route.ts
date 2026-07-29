/**
 * POST /api/demo-cand-reg/save
 *
 * Persists a confirmed occupation + selected skills from the demo wizard.
 * Also updates the matching search log with the candidate's selection.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface SkillPayload {
  escoSkillUri: string
  skillLabel: string
  skillType: 'essential' | 'optional'
  candidateSelected: boolean
}

interface SaveBody {
  sessionId: string
  escoUri: string
  preferredLabel: string
  language: string
  originalWording?: string
  skills: SkillPayload[]
  searchLogId?: string
}

export async function POST(request: NextRequest) {
  let body: SaveBody
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sessionId, escoUri, preferredLabel, language, originalWording, skills, searchLogId } =
    body

  if (!sessionId || !escoUri || !preferredLabel) {
    return NextResponse.json(
      { error: 'sessionId, escoUri, and preferredLabel are required' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayload({ config })

    // Create the occupation document
    const occupation = await payload.create({
      collection: 'candidate-occupations',
      data: {
        sessionId,
        escoUri,
        preferredLabel,
        language: language ?? 'en',
        originalWording: originalWording ?? '',
        source: 'candidate-declared',
        verificationStatus: 'unverified',
      },
    })

    // Create skill documents in parallel
    if (skills?.length) {
      await Promise.all(
        skills.map((skill) =>
          payload.create({
            collection: 'candidate-occupation-skills',
            data: {
              candidateOccupation: occupation.id,
              escoSkillUri: skill.escoSkillUri,
              skillLabel: skill.skillLabel,
              skillType: skill.skillType,
              candidateSelected: skill.candidateSelected,
              verificationStatus: 'unverified',
            },
          }),
        ),
      )
    }

    // Record the candidate's choice against the search that produced it, so
    // admins reviewing search quality can see what was actually selected.
    if (searchLogId) {
      try {
        await payload.update({
          collection: 'esco-search-logs',
          id: searchLogId,
          data: {
            selectedOccupationUri: escoUri,
            selectedOccupationLabel: preferredLabel,
          },
        })
      } catch (err) {
        console.error('[demo-cand-reg save] search log update error:', err)
      }
    }

    return NextResponse.json({
      success: true,
      occupationId: String(occupation.id),
      skillCount: skills?.length ?? 0,
    })
  } catch (err) {
    console.error('[demo-cand-reg save] error:', err)
    return NextResponse.json({ error: 'Failed to save occupation' }, { status: 500 })
  }
}
