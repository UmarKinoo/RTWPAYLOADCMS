import type { Candidate } from '@/payload-types'
import { isExcludedFromReadyBot } from '../lib/candidateReadyBot'
import {
  getMissingProfileFields,
  type MissingProfileField,
} from '@/lib/candidates/profile-completeness'

export type MissingFieldCheck = {
  field: string
  label: string
}

export function detectMissingFields(candidate: Candidate): MissingFieldCheck[] {
  if (isExcludedFromReadyBot(candidate)) return []

  return getMissingProfileFields(candidate).map((m: MissingProfileField) => ({
    field: m.field,
    label: m.label,
  }))
}

export function hasNoMissingFields(candidate: Candidate): boolean {
  return detectMissingFields(candidate).length === 0
}
