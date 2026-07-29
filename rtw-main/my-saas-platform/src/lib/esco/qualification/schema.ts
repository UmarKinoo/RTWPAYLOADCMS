import { z } from 'zod'

export const PROMPT_VERSION = '1.1'
export const SCHEMA_VERSION = '1'

export const QUESTION_CATEGORIES = [
  'experience',
  'tasks',
  'equipment',
  'licence',
  'environment',
  'verification',
  'availability',
] as const

export const QUESTION_TYPES = [
  'single_select',
  'multi_select',
  'yes_no',
  'number_range',
  'date',
  'short_text',
] as const

export type QuestionCategory = (typeof QUESTION_CATEGORIES)[number]
export type QuestionType = (typeof QUESTION_TYPES)[number]

const showWhenSchema = z.object({
  questionId: z.string().min(1),
  operator: z.enum(['equals', 'includes', 'not_equals']),
  value: z.union([z.string(), z.boolean(), z.number()]),
})

/**
 * OpenAI structured outputs require every property key to appear in `required`.
 * Optional fields are therefore modelled as `.nullable()` and normalised after
 * generation (null → undefined / omitted).
 */
export const qualificationQuestionSchema = z.object({
  id: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, 'Question id must be snake_case'),
  category: z.enum(QUESTION_CATEGORIES),
  type: z.enum(QUESTION_TYPES),
  label: z.string().min(3).max(200),
  required: z.boolean(),
  options: z.array(z.string().min(1).max(120)).max(12).nullable(),
  showWhen: showWhenSchema.nullable(),
  sourceSkillUris: z.array(z.string()).nullable(),
})

export const qualificationTemplateSchema = z.object({
  escoOccupationUri: z.string().min(1),
  occupationLabel: z.string().min(1),
  language: z.string().min(2).max(5),
  promptVersion: z.string(),
  questions: z.array(qualificationQuestionSchema).min(6).max(10),
})

export type QualificationQuestionRaw = z.infer<typeof qualificationQuestionSchema>
export type QualificationTemplatePayloadRaw = z.infer<typeof qualificationTemplateSchema>

export type QualificationQuestion = {
  id: string
  category: QuestionCategory
  type: QuestionType
  label: string
  required: boolean
  options?: string[]
  showWhen?: ShowWhen
  sourceSkillUris?: string[]
}

export type QualificationTemplatePayload = {
  escoOccupationUri: string
  occupationLabel: string
  language: string
  promptVersion: string
  questions: QualificationQuestion[]
}

export type ShowWhen = z.infer<typeof showWhenSchema>

/** Fill omitted optional fields with null so OpenAI / zod nullable schemas accept them. */
export function coerceNullableFields(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const obj = raw as { questions?: unknown[] }
  if (!Array.isArray(obj.questions)) return raw
  return {
    ...obj,
    questions: obj.questions.map((q) => {
      if (!q || typeof q !== 'object') return q
      const question = q as Record<string, unknown>
      return {
        ...question,
        options: question.options === undefined ? null : question.options,
        showWhen: question.showWhen === undefined ? null : question.showWhen,
        sourceSkillUris:
          question.sourceSkillUris === undefined ? null : question.sourceSkillUris,
      }
    }),
  }
}

/** Normalise nullable AI output into the client/server question shape. */
export function normalizeQuestion(q: QualificationQuestionRaw): QualificationQuestion {
  return {
    id: q.id,
    category: q.category,
    type: q.type,
    label: q.label,
    required: q.required,
    options: q.options ?? undefined,
    showWhen: q.showWhen ?? undefined,
    sourceSkillUris: q.sourceSkillUris ?? undefined,
  }
}

export function normalizeTemplate(
  raw: QualificationTemplatePayloadRaw,
): QualificationTemplatePayload {
  return {
    escoOccupationUri: raw.escoOccupationUri,
    occupationLabel: raw.occupationLabel,
    language: raw.language,
    promptVersion: raw.promptVersion,
    questions: raw.questions.map(normalizeQuestion),
  }
}

/** Public shape returned to the client (includes template id when persisted). */
export interface QualificationTemplateResponse {
  templateId: string | null
  escoOccupationUri: string
  occupationLabel: string
  language: string
  promptVersion: string
  schemaVersion: string
  source: 'cached' | 'generated' | 'fallback'
  questions: QualificationQuestion[]
}
