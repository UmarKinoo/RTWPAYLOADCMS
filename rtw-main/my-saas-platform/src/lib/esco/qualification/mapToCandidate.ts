/**
 * Maps universal qualification answers (label-based, EN or AR) to the typed
 * fields the `candidates` collection expects. Used when the demo registration
 * flow creates the real candidate account at the end.
 */

export type UniversalAnswerMap = Record<string, string | string[] | number | boolean>

export interface MappedCandidateFields {
  experienceYears: number
  saudiExperience: number
  currentEmployer?: string
  availabilityDate: string
  visaStatus: 'active' | 'expired' | 'nearly_expired' | 'none'
  visaExpiry?: string
  visaProfession?: string
}

/** Option label → years (representative lower bound), EN + AR. */
const EXPERIENCE_YEARS: Record<string, number> = {
  'None yet': 0,
  'Less than 1 year': 0,
  '1–2 years': 1,
  '3–5 years': 3,
  'More than 5 years': 6,
  'لا يوجد بعد': 0,
  'أقل من سنة': 0,
  '1–2 سنوات': 1,
  '3–5 سنوات': 3,
  'أكثر من 5 سنوات': 6,
}

const VISA_STATUS: Record<string, MappedCandidateFields['visaStatus']> = {
  Active: 'active',
  'Nearly expired': 'nearly_expired',
  Expired: 'expired',
  'No visa': 'none',
  'سارية': 'active',
  'قاربت على الانتهاء': 'nearly_expired',
  'منتهية': 'expired',
  'لا توجد تأشيرة': 'none',
}

function asString(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function toYears(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.max(0, Math.round(value))
  const label = asString(value)
  if (!label) return undefined
  return EXPERIENCE_YEARS[label]
}

function toDate(value: unknown): string | undefined {
  const raw = asString(value)
  if (!raw) return undefined
  const date = new Date(raw)
  if (isNaN(date.getTime())) return undefined
  return date.toISOString().split('T')[0]
}

/**
 * Missing answers fall back to safe neutral values (0 years, available today,
 * no visa) so a candidate who skipped the qualification step — e.g. via the
 * "occupation not listed" path — can still register. ReadyBot follows up on gaps.
 */
export function mapUniversalAnswers(answers: UniversalAnswerMap): MappedCandidateFields {
  const visaStatusLabel = asString(answers.visa_status)
  const visaStatus = (visaStatusLabel && VISA_STATUS[visaStatusLabel]) || 'none'

  return {
    experienceYears: toYears(answers.experience_years) ?? 0,
    saudiExperience: toYears(answers.saudi_experience) ?? 0,
    currentEmployer: asString(answers.current_employer),
    availabilityDate: toDate(answers.availability_date) ?? new Date().toISOString().split('T')[0],
    visaStatus,
    visaExpiry: visaStatus === 'none' ? undefined : toDate(answers.visa_expiry),
    visaProfession: visaStatus === 'none' ? undefined : asString(answers.visa_profession),
  }
}
