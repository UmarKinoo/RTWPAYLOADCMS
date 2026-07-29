import type { QualificationQuestion, QualificationTemplatePayload } from './schema'
import { qualificationTemplateSchema, normalizeTemplate, coerceNullableFields } from './schema'

/** Keywords that indicate unsafe / discriminatory questions (en + ar + fr). */
const BANNED_PATTERNS: RegExp[] = [
  /\brelig(ion|ious)\b/i,
  /\brace\b/i,
  /\bethnic(ity)?\b/i,
  /\bpolitic(al|s)?\b/i,
  /\bpregnan(t|cy)\b/i,
  /\bmarital\b/i,
  /\bmarried\b/i,
  /\bsexual\s+orient/i,
  /\bgender\b/i,
  /\bdisability\b/i,
  /\bdisabled\b/i,
  /\bhealth\s+condition\b/i,
  /\bappearance\b/i,
  /\baccent\b/i,
  /\bnationality\b/i,
  /\bage\b(?!\s*(of\s+)?(vehicle|equipment|machine|building))/i,
  /\bhow\s+old\b/i,
  /\bskin\s+colou?r\b/i,
  /دين|عرق|سياسة|حامل|متزوج|إعاقة|جنسية|عمر|مظهر/,
  /religion|ethnie|politique|enceinte|marié|handicap|nationalité|âge/i,
]

const VAGUE_LABELS = /^(tell us about|describe|explain|what do you think)/i

/**
 * Post-schema validation. Returns an array of human-readable reasons (empty = valid).
 * Reasons are fed back to the AI on regeneration attempts.
 */
export function validateTemplate(payload: unknown): {
  ok: boolean
  data?: QualificationTemplatePayload
  errors: string[]
} {
  const parsed = qualificationTemplateSchema.safeParse(coerceNullableFields(payload))
  if (!parsed.success) {
    return {
      ok: false,
      errors: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`),
    }
  }

  const data = normalizeTemplate(parsed.data)
  const errors: string[] = []
  const questions = data.questions
  const ids = new Set<string>()
  const labels = new Set<string>()

  for (const q of questions) {
    if (ids.has(q.id)) errors.push(`Duplicate question id: ${q.id}`)
    ids.add(q.id)

    const labelKey = q.label.trim().toLowerCase()
    if (labels.has(labelKey)) errors.push(`Duplicate question label: ${q.label}`)
    labels.add(labelKey)

    if (VAGUE_LABELS.test(q.label)) {
      errors.push(`Vague label: "${q.label}"`)
    }

    // Select types must have options
    if (
      (q.type === 'single_select' || q.type === 'multi_select' || q.type === 'number_range') &&
      (!q.options || q.options.length < 2)
    ) {
      errors.push(`Question "${q.id}" (${q.type}) needs at least 2 options`)
    }

    // yes_no / date / short_text should not have options
    if (
      (q.type === 'yes_no' || q.type === 'date' || q.type === 'short_text') &&
      q.options &&
      q.options.length > 0
    ) {
      errors.push(`Question "${q.id}" (${q.type}) should not have options`)
    }

    if (q.showWhen) {
      const target = questions.find((x) => x.id === q.showWhen!.questionId)
      if (!target) {
        errors.push(`Question "${q.id}" showWhen references unknown id: ${q.showWhen.questionId}`)
      }
    }

    // Safety screen
    for (const pattern of BANNED_PATTERNS) {
      if (pattern.test(q.label) || q.options?.some((o) => pattern.test(o))) {
        errors.push(`Unsafe / discriminatory content in question "${q.id}": ${q.label}`)
        break
      }
    }
  }

  // Ensure showWhen targets exist (second pass after all ids collected)
  for (const q of questions) {
    if (q.showWhen && !ids.has(q.showWhen.questionId)) {
      errors.push(`Question "${q.id}" showWhen references unknown id: ${q.showWhen.questionId}`)
    }
  }

  // Prefer at least one occupation-specific category (experience / availability /
  // verification are covered by the universal registration set on the client).
  const specificCategories = new Set(['tasks', 'equipment', 'licence', 'environment'])
  if (!questions.some((q) => specificCategories.has(q.category))) {
    errors.push(
      'Template must include at least one occupation-specific question (tasks, equipment, licence, or environment)',
    )
  }

  return { ok: errors.length === 0, data: errors.length === 0 ? data : undefined, errors }
}

/** Evaluate whether a conditional question should be shown given current answers. */
export function isQuestionVisible(
  question: QualificationQuestion,
  answers: Record<string, unknown>,
): boolean {
  if (!question.showWhen) return true
  const { questionId, operator, value } = question.showWhen
  const answer = answers[questionId]
  if (answer === undefined || answer === null) return false

  if (operator === 'equals') {
    return answer === value
  }
  if (operator === 'not_equals') {
    return answer !== value
  }
  if (operator === 'includes') {
    if (Array.isArray(answer)) return answer.includes(value)
    return String(answer) === String(value)
  }
  return false
}
