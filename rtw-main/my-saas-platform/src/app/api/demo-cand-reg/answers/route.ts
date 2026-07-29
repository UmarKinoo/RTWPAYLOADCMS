/**
 * POST /api/demo-cand-reg/answers
 *
 * Persists candidate answers to a qualification template, linked to the
 * candidate-occupation they just confirmed.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

interface AnswerPayload {
  questionId: string
  answer: unknown
}

interface Body {
  sessionId: string
  candidateOccupationId: string
  templateId?: string | null
  answers: AnswerPayload[]
}

function isValidAnswer(answer: unknown): boolean {
  if (answer === null || answer === undefined) return false
  if (typeof answer === 'string') return answer.trim().length > 0
  if (typeof answer === 'boolean' || typeof answer === 'number') return true
  if (Array.isArray(answer)) return answer.every((a) => typeof a === 'string')
  return false
}

export async function POST(request: NextRequest) {
  let body: Body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { sessionId, candidateOccupationId, templateId, answers } = body

  if (!sessionId || !candidateOccupationId) {
    return NextResponse.json(
      { error: 'sessionId and candidateOccupationId are required' },
      { status: 400 },
    )
  }

  if (!Array.isArray(answers) || answers.length === 0) {
    return NextResponse.json({ error: 'answers array is required' }, { status: 400 })
  }

  for (const a of answers) {
    if (!a.questionId || !isValidAnswer(a.answer)) {
      return NextResponse.json(
        { error: `Invalid answer for question ${a.questionId ?? '(missing id)'}` },
        { status: 400 },
      )
    }
  }

  try {
    const payload = await getPayload({ config })

    // Verify the occupation belongs to this session
    const occupation = await payload.findByID({
      collection: 'candidate-occupations',
      id: candidateOccupationId,
    })
    if (!occupation || occupation.sessionId !== sessionId) {
      return NextResponse.json({ error: 'Occupation not found for this session' }, { status: 404 })
    }

    // If a template id is provided, verify it exists (optional for fallback)
    if (templateId) {
      try {
        await payload.findByID({
          collection: 'qualification-templates',
          id: templateId,
        })
      } catch {
        return NextResponse.json({ error: 'Template not found' }, { status: 404 })
      }
    }

    // Replace any previous answers for this occupation (idempotent re-submit)
    await payload.delete({
      collection: 'candidate-qualification-answers',
      where: { candidateOccupation: { equals: candidateOccupationId } },
    })

    await Promise.all(
      answers.map((a) =>
        payload.create({
          collection: 'candidate-qualification-answers',
          data: {
            candidateOccupation: Number(candidateOccupationId),
            template: templateId ? Number(templateId) : null,
            questionId: a.questionId,
            answer: { value: a.answer },
            status: 'candidate-declared',
          },
        }),
      ),
    )

    return NextResponse.json({
      success: true,
      answerCount: answers.length,
    })
  } catch (err) {
    console.error('[demo-cand-reg answers] error:', err)
    return NextResponse.json({ error: 'Failed to save answers' }, { status: 500 })
  }
}
