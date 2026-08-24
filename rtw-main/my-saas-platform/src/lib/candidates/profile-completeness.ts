import type { Candidate } from '@/payload-types'

export type ProfileCompletenessField =
  | 'resume'
  | 'location'
  | 'visaStatus'
  | 'availabilityDate'
  | 'experienceYears'
  | 'jobTitle'
  | 'primarySkill'
  | 'aboutMe'
  | 'whatsappNumber'

export type ProfileFieldMeta = {
  field: ProfileCompletenessField
  /** English label for ReadyBot / emails */
  label: string
  /** next-intl key under candidateDashboard.profileCompleteness.fields */
  i18nKey: string
  /** Dashboard deep link (path + optional hash) */
  href: string
  /** CTA verb key: add | upload | confirm */
  actionKey: 'add' | 'upload' | 'confirm'
}

export type MissingProfileField = {
  field: ProfileCompletenessField
  label: string
  i18nKey: string
  href: string
  actionKey: 'add' | 'upload' | 'confirm'
}

export type ProfileCompleteness = {
  percent: number
  filled: number
  total: number
  missing: MissingProfileField[]
}

/** Same hire-readiness checklist ReadyBot uses for screening. */
export const PROFILE_COMPLETENESS_FIELDS: ProfileFieldMeta[] = [
  {
    field: 'resume',
    label: 'Resume/CV',
    i18nKey: 'resume',
    href: '/dashboard/resume',
    actionKey: 'upload',
  },
  {
    field: 'location',
    label: 'Current location',
    i18nKey: 'location',
    href: '/dashboard#personal-info',
    actionKey: 'add',
  },
  {
    field: 'visaStatus',
    label: 'Visa status',
    i18nKey: 'visaStatus',
    href: '/dashboard#visa',
    actionKey: 'add',
  },
  {
    field: 'availabilityDate',
    label: 'Availability date',
    i18nKey: 'availabilityDate',
    href: '/dashboard#work-experience',
    actionKey: 'add',
  },
  {
    field: 'experienceYears',
    label: 'Years of experience',
    i18nKey: 'experienceYears',
    href: '/dashboard#work-experience',
    actionKey: 'add',
  },
  {
    field: 'jobTitle',
    label: 'Job title',
    i18nKey: 'jobTitle',
    href: '/dashboard#work-experience',
    actionKey: 'add',
  },
  {
    field: 'primarySkill',
    label: 'Primary skill',
    i18nKey: 'primarySkill',
    href: '/dashboard#skills',
    actionKey: 'add',
  },
  {
    field: 'aboutMe',
    label: 'About me',
    i18nKey: 'aboutMe',
    href: '/dashboard#about-me',
    actionKey: 'add',
  },
  {
    field: 'whatsappNumber',
    label: 'WhatsApp number',
    i18nKey: 'whatsappNumber',
    href: '/dashboard/settings',
    actionKey: 'confirm',
  },
]

function hasWhatsAppContact(candidate: Candidate): boolean {
  const rb = candidate.readyBot as { whatsappNumber?: string | null } | null | undefined
  const explicit = rb?.whatsappNumber?.trim()
  if (explicit) return true
  if (candidate.whatsapp?.trim()) return true
  return Boolean(candidate.phone?.trim())
}

function isFieldMissing(field: ProfileCompletenessField, candidate: Candidate): boolean {
  switch (field) {
    case 'resume':
      return !candidate.resume
    case 'location':
      return !candidate.location?.trim()
    case 'visaStatus':
      return !candidate.visaStatus
    case 'availabilityDate':
      return !candidate.availabilityDate
    case 'experienceYears':
      return candidate.experienceYears == null
    case 'jobTitle':
      return !candidate.jobTitle?.trim()
    case 'primarySkill':
      return !candidate.primarySkill
    case 'aboutMe':
      return !candidate.aboutMe?.trim()
    case 'whatsappNumber':
      return !hasWhatsAppContact(candidate)
    default:
      return false
  }
}

export function getMissingProfileFields(candidate: Candidate): MissingProfileField[] {
  const missing: MissingProfileField[] = []
  for (const meta of PROFILE_COMPLETENESS_FIELDS) {
    if (isFieldMissing(meta.field, candidate)) {
      missing.push({
        field: meta.field,
        label: meta.label,
        i18nKey: meta.i18nKey,
        href: meta.href,
        actionKey: meta.actionKey,
      })
    }
  }
  return missing
}

export function getProfileCompleteness(candidate: Candidate): ProfileCompleteness {
  const total = PROFILE_COMPLETENESS_FIELDS.length
  const missing = getMissingProfileFields(candidate)
  const filled = total - missing.length
  const percent = total === 0 ? 100 : Math.round((filled / total) * 100)
  return { percent, filled, total, missing }
}

export function isProfileComplete(candidate: Candidate): boolean {
  return getMissingProfileFields(candidate).length === 0
}
