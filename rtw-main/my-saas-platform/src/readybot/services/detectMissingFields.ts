import type { Candidate } from '@/payload-types'
import { isExcludedFromReadyBot, resolveWhatsAppNumber } from '../lib/candidateReadyBot'

export type MissingFieldCheck = {
  field: string
  label: string
}

const PROFILE_CHECKS: Array<{
  field: string
  label: string
  isMissing: (c: Candidate) => boolean
}> = [
  { field: 'resume', label: 'Resume/CV', isMissing: (c) => !c.resume },
  { field: 'location', label: 'Current location', isMissing: (c) => !c.location?.trim() },
  { field: 'visaStatus', label: 'Visa status', isMissing: (c) => !c.visaStatus },
  { field: 'availabilityDate', label: 'Availability date', isMissing: (c) => !c.availabilityDate },
  { field: 'experienceYears', label: 'Years of experience', isMissing: (c) => c.experienceYears == null },
  { field: 'jobTitle', label: 'Job title', isMissing: (c) => !c.jobTitle?.trim() },
  { field: 'primarySkill', label: 'Primary skill', isMissing: (c) => !c.primarySkill },
  { field: 'aboutMe', label: 'About me', isMissing: (c) => !c.aboutMe?.trim() },
  {
    field: 'whatsappNumber',
    label: 'WhatsApp number',
    isMissing: (c) => !resolveWhatsAppNumber(c),
  },
]

export function detectMissingFields(candidate: Candidate): MissingFieldCheck[] {
  if (isExcludedFromReadyBot(candidate)) return []

  const missing: MissingFieldCheck[] = []
  for (const check of PROFILE_CHECKS) {
    if (check.isMissing(candidate)) {
      missing.push({ field: check.field, label: check.label })
    }
  }
  return missing
}

export function hasNoMissingFields(candidate: Candidate): boolean {
  return detectMissingFields(candidate).length === 0
}
