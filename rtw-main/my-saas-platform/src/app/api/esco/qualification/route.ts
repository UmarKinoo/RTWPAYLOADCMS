/**
 * POST /api/esco/qualification
 *
 * Returns a cached qualification template for an ESCO occupation, or generates
 * one (once) when no valid cache exists. Falls back to a universal question set
 * if AI generation fails so the candidate is never blocked.
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

import { getOccupation } from '@/lib/esco/occupation'
import {
  PROMPT_VERSION,
  SCHEMA_VERSION,
  occupationChecksum,
  generateQualificationTemplate,
  getFallbackTemplate,
  type QualificationQuestion,
  type QualificationTemplateResponse,
} from '@/lib/esco/qualification'

// Per-IP rate limit: 10 requests / minute
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

/** Prevent concurrent generations for the same occupation+language. */
const inflight = new Map<string, Promise<QualificationTemplateResponse>>()

function mapDocQuestions(doc: {
  questions?: Array<{
    questionId?: string | null
    category?: string | null
    type?: string | null
    label?: string | null
    options?: Array<{ value?: string | null } | string> | null
    required?: boolean | null
    showWhen?: {
      questionId?: string | null
      operator?: string | null
      value?: string | null
    } | null
    sourceSkillUris?: Array<{ uri?: string | null } | string> | null
  }> | null
}): QualificationQuestion[] {
  if (!doc.questions?.length) return []
  return doc.questions
    .map((q) => {
      const options = (q.options ?? [])
        .map((o) => (typeof o === 'string' ? o : o?.value ?? ''))
        .filter(Boolean)
      const showWhen =
        q.showWhen?.questionId && q.showWhen?.operator
          ? {
              questionId: q.showWhen.questionId,
              operator: q.showWhen.operator as 'equals' | 'includes',
              value: parseShowWhenValue(q.showWhen.value),
            }
          : undefined
      const sourceSkillUris = (q.sourceSkillUris ?? [])
        .map((s) => (typeof s === 'string' ? s : s?.uri ?? ''))
        .filter(Boolean)

      return {
        id: q.questionId ?? '',
        category: q.category as QualificationQuestion['category'],
        type: q.type as QualificationQuestion['type'],
        label: q.label ?? '',
        required: q.required ?? true,
        options: options.length ? options : undefined,
        showWhen,
        sourceSkillUris: sourceSkillUris.length ? sourceSkillUris : undefined,
      }
    })
    .filter((q) => q.id && q.label)
}

function parseShowWhenValue(raw: string | null | undefined): string | boolean | number {
  if (raw === 'true') return true
  if (raw === 'false') return false
  if (raw != null && raw !== '' && !Number.isNaN(Number(raw)) && String(Number(raw)) === raw) {
    return Number(raw)
  }
  return raw ?? ''
}

function questionsToPayloadFields(questions: QualificationQuestion[]) {
  return questions.map((q, index) => ({
    questionId: q.id,
    category: q.category,
    type: q.type,
    label: q.label,
    required: q.required,
    order: index,
    options: q.options?.map((value) => ({ value })),
    showWhen: q.showWhen
      ? {
          questionId: q.showWhen.questionId,
          operator: q.showWhen.operator,
          value: String(q.showWhen.value),
        }
      : undefined,
    sourceSkillUris: q.sourceSkillUris?.map((uri) => ({ uri })),
  }))
}

async function resolveTemplate(
  escoUri: string,
  language: string,
): Promise<QualificationTemplateResponse> {
  const escoLanguage = ['ar', 'fr'].includes(language) ? language : 'en'
  const occupation = await getOccupation(escoUri, escoLanguage)
  if (!occupation) {
    return getFallbackTemplate(escoUri, 'Unknown occupation', language)
  }

  const checksum = occupationChecksum(occupation)
  const payload = await getPayload({ config })

  // Cache lookup
  const existing = await payload.find({
    collection: 'qualification-templates',
    where: {
      and: [
        { escoUri: { equals: escoUri } },
        { language: { equals: language } },
        { promptVersion: { equals: PROMPT_VERSION } },
        { schemaVersion: { equals: SCHEMA_VERSION } },
        { status: { equals: 'active' } },
      ],
    },
    limit: 1,
  })

  const cached = existing.docs[0]
  if (cached && cached.escoChecksum === checksum) {
    // Bump lastUsedAt (best-effort)
    payload
      .update({
        collection: 'qualification-templates',
        id: cached.id,
        data: { lastUsedAt: new Date().toISOString() },
      })
      .catch((e) => console.error('[qualification] lastUsedAt update error:', e))

    return {
      templateId: String(cached.id),
      escoOccupationUri: escoUri,
      occupationLabel: cached.occupationLabel as string,
      language,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      source: 'cached',
      questions: mapDocQuestions(cached),
    }
  }

  // Disable stale template if checksum changed
  if (cached && cached.escoChecksum !== checksum) {
    payload
      .update({
        collection: 'qualification-templates',
        id: cached.id,
        data: { status: 'disabled' },
      })
      .catch((e) => console.error('[qualification] disable stale error:', e))
  }

  // Generate
  try {
    const generated = await generateQualificationTemplate(occupation, language)
    const now = new Date().toISOString()

    const created = await payload.create({
      collection: 'qualification-templates',
      data: {
        escoUri,
        occupationLabel: generated.occupationLabel,
        language,
        promptVersion: PROMPT_VERSION,
        schemaVersion: SCHEMA_VERSION,
        escoChecksum: checksum,
        status: 'active',
        questions: questionsToPayloadFields(generated.questions),
        generatedAt: now,
        lastUsedAt: now,
      },
    })

    return {
      templateId: String(created.id),
      escoOccupationUri: escoUri,
      occupationLabel: generated.occupationLabel,
      language,
      promptVersion: PROMPT_VERSION,
      schemaVersion: SCHEMA_VERSION,
      source: 'generated',
      questions: generated.questions,
    }
  } catch (err) {
    console.error('[qualification] generation failed, using fallback:', err)
    return getFallbackTemplate(escoUri, occupation.preferredLabel, language)
  }
}

export async function POST(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  if (!checkRateLimit(ip)) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
  }

  let body: { escoUri?: string; language?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const escoUri = (body.escoUri ?? '').trim()
  const language = (body.language ?? 'en').toLowerCase().slice(0, 5)

  if (!escoUri) {
    return NextResponse.json({ error: 'escoUri is required' }, { status: 400 })
  }

  const key = `${escoUri}::${language}`
  let promise = inflight.get(key)
  if (!promise) {
    promise = resolveTemplate(escoUri, language).finally(() => {
      inflight.delete(key)
    })
    inflight.set(key, promise)
  }

  try {
    const template = await promise
    return NextResponse.json({ template })
  } catch (err) {
    console.error('[qualification] unexpected error:', err)
    return NextResponse.json(
      { template: getFallbackTemplate(escoUri, 'Occupation', language) },
      { status: 200 },
    )
  }
}
