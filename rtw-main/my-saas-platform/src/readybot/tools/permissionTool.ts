/**
 * ReadyBot field permissions — AI may only touch allowlisted candidate fields.
 * Maps spec names to actual Payload field paths where they differ.
 */

/** Payload paths SafeBot may auto-update when confidence >= threshold. */
export const SAFE_AUTO_UPDATE_FIELDS = new Set([
  'location',
  'jobTitle',
  'experienceYears',
  'availabilityDate',
  'aboutMe',
  'whatsapp',
  'readyBot.whatsappNumber',
  'readyBot.preferredContactChannel',
  'jobPreferences.preferredSalary',
  'jobPreferences.preferredLocation',
])

/** Always route to human review — never auto-apply. */
export const HUMAN_REVIEW_ONLY_FIELDS = new Set([
  'visaStatus',
  'visaExpiry',
  'visaProfession',
  'legalWorkEligibility',
  'visaValidation',
  'identityDocumentApproval',
  'candidateRejection',
  'blacklistStatus',
  'employerFacingRecommendation',
  'verifiedBadge',
  'billingClass',
  'primarySkill',
])

/** Forbidden tool actions (never implement in registry). */
export const FORBIDDEN_ACTIONS = new Set([
  'delete_candidate',
  'change_employer_credits',
  'approve_employer_payment',
  'final_hiring_decision',
  'delete_audit_logs',
  'generic_db_update',
])

export type PermissionResult =
  | { allowed: true; normalized: Record<string, unknown> }
  | { allowed: false; reason: string; requiresHumanReview?: boolean }

/** Normalize extraction keys (spec aliases → Payload paths). */
const FIELD_ALIASES: Record<string, string> = {
  currentCity: 'location',
  country: 'nationality',
  mainSkill: 'primarySkill',
  yearsOfExperience: 'experienceYears',
  expectedSalary: 'jobPreferences.preferredSalary',
  currency: 'jobPreferences.preferredSalary',
  whatsappNumber: 'readyBot.whatsappNumber',
}

export function normalizeFieldKey(key: string): string {
  return FIELD_ALIASES[key] ?? key
}

export function filterSafeExtractedFields(
  fields: Record<string, unknown>,
): PermissionResult {
  const normalized: Record<string, unknown> = {}
  const blocked: string[] = []
  const humanOnly: string[] = []

  for (const [rawKey, value] of Object.entries(fields)) {
    const key = normalizeFieldKey(rawKey)
    if (FORBIDDEN_ACTIONS.has(key)) {
      return { allowed: false, reason: `Forbidden field/action: ${key}` }
    }
    if (HUMAN_REVIEW_ONLY_FIELDS.has(key)) {
      humanOnly.push(key)
      continue
    }
    if (SAFE_AUTO_UPDATE_FIELDS.has(key)) {
      normalized[key] = value
      continue
    }
    blocked.push(key)
  }

  if (humanOnly.length > 0) {
    return {
      allowed: false,
      reason: `Fields require human review: ${humanOnly.join(', ')}`,
      requiresHumanReview: true,
    }
  }
  if (blocked.length > 0) {
    return {
      allowed: false,
      reason: `Fields not in safe allowlist: ${blocked.join(', ')}`,
      requiresHumanReview: true,
    }
  }
  if (Object.keys(normalized).length === 0) {
    return { allowed: false, reason: 'No safe fields to apply' }
  }
  return { allowed: true, normalized }
}

/**
 * Admin approved a human-review task — apply extracted fields (aboutMe, location, etc.)
 * without the auto-update allowlist. Still blocks forbidden actions.
 */
export function filterHumanApprovedFields(
  fields: Record<string, unknown>,
): PermissionResult {
  const normalized: Record<string, unknown> = {}

  for (const [rawKey, value] of Object.entries(fields)) {
    const key = normalizeFieldKey(rawKey)
    if (FORBIDDEN_ACTIONS.has(key)) {
      return { allowed: false, reason: `Forbidden field/action: ${key}` }
    }
    normalized[key] = value
  }

  if (Object.keys(normalized).length === 0) {
    return { allowed: false, reason: 'No fields to apply' }
  }
  return { allowed: true, normalized }
}
