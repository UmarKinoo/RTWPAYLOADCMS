import type { Candidate } from '@/payload-types'

export type ProfileCompletenessField =
  | 'profilePicture'
  | 'resume'
  | 'location'
  | 'nationality'
  | 'visaStatus'
  | 'availabilityDate'
  | 'experienceYears'
  | 'jobTitle'
  | 'primarySkill'
  | 'aboutMe'
  | 'education'
  | 'languages'
  | 'jobPreferences'
  | 'jobBenefits'
  | 'whatsappNumber'

export type ProfileFieldMeta = {
  field: ProfileCompletenessField
  /** Display weight — all fields sum to 100 */
  points: number
  /** English label for ReadyBot / emails */
  label: string
  /** next-intl key under candidateDashboard.profileCompleteness.fields */
  i18nKey: string
  /** Dashboard deep link (path + optional hash) */
  href: string
  /** CTA verb key: add | upload | confirm */
  actionKey: 'add' | 'upload' | 'confirm'
}

export type ProfileFieldItem = {
  field: ProfileCompletenessField
  label: string
  i18nKey: string
  href: string
  actionKey: 'add' | 'upload' | 'confirm'
  points: number
}

export type ProfileFieldStatus = ProfileFieldItem & {
  isComplete: boolean
}

export type MissingProfileField = ProfileFieldItem

export type CompletedProfileField = ProfileFieldItem

export type ProfileCompleteness = {
  percent: number
  filled: number
  total: number
  earnedPoints: number
  totalPoints: number
  missing: MissingProfileField[]
  completed: CompletedProfileField[]
}

/** Hire-readiness checklist aligned with dashboard sections. Weights sum to 100. */
export const PROFILE_COMPLETENESS_FIELDS: ProfileFieldMeta[] = [
  {
    field: 'resume',
    points: 12,
    label: 'Resume/CV',
    i18nKey: 'resume',
    href: '/dashboard/resume',
    actionKey: 'upload',
  },
  {
    field: 'profilePicture',
    points: 6,
    label: 'Profile photo',
    i18nKey: 'profilePicture',
    href: '/dashboard#profile',
    actionKey: 'upload',
  },
  {
    field: 'primarySkill',
    points: 10,
    label: 'Primary job role',
    i18nKey: 'primarySkill',
    href: '/dashboard#skills',
    actionKey: 'add',
  },
  {
    field: 'aboutMe',
    points: 8,
    label: 'About me',
    i18nKey: 'aboutMe',
    href: '/dashboard#about-me',
    actionKey: 'add',
  },
  {
    field: 'jobTitle',
    points: 7,
    label: 'Job title',
    i18nKey: 'jobTitle',
    href: '/dashboard#work-experience',
    actionKey: 'add',
  },
  {
    field: 'experienceYears',
    points: 7,
    label: 'Years of experience',
    i18nKey: 'experienceYears',
    href: '/dashboard#work-experience',
    actionKey: 'add',
  },
  {
    field: 'availabilityDate',
    points: 5,
    label: 'Availability date',
    i18nKey: 'availabilityDate',
    href: '/dashboard#work-experience',
    actionKey: 'add',
  },
  {
    field: 'location',
    points: 5,
    label: 'Current location',
    i18nKey: 'location',
    href: '/dashboard#personal-info',
    actionKey: 'add',
  },
  {
    field: 'nationality',
    points: 4,
    label: 'Nationality',
    i18nKey: 'nationality',
    href: '/dashboard#personal-info',
    actionKey: 'add',
  },
  {
    field: 'education',
    points: 8,
    label: 'Education',
    i18nKey: 'education',
    href: '/dashboard#education',
    actionKey: 'add',
  },
  {
    field: 'visaStatus',
    points: 6,
    label: 'Visa status',
    i18nKey: 'visaStatus',
    href: '/dashboard#visa',
    actionKey: 'add',
  },
  {
    field: 'languages',
    points: 5,
    label: 'Languages',
    i18nKey: 'languages',
    href: '/dashboard#languages',
    actionKey: 'add',
  },
  {
    field: 'jobPreferences',
    points: 6,
    label: 'Job preferences',
    i18nKey: 'jobPreferences',
    href: '/dashboard#job-preferences',
    actionKey: 'add',
  },
  {
    field: 'jobBenefits',
    points: 5,
    label: 'Preferred benefits',
    i18nKey: 'jobBenefits',
    href: '/dashboard#job-benefits',
    actionKey: 'add',
  },
  {
    field: 'whatsappNumber',
    points: 6,
    label: 'WhatsApp number',
    i18nKey: 'whatsappNumber',
    href: '/dashboard/settings',
    actionKey: 'confirm',
  },
]

const TOTAL_POINTS = PROFILE_COMPLETENESS_FIELDS.reduce((sum, f) => sum + f.points, 0)

function hasWhatsAppContact(candidate: Candidate): boolean {
  const rb = candidate.readyBot as { whatsappNumber?: string | null } | null | undefined
  const explicit = rb?.whatsappNumber?.trim()
  if (explicit) return true
  if (candidate.whatsapp?.trim()) return true
  return Boolean(candidate.phone?.trim())
}

function hasEducation(candidate: Candidate): boolean {
  const education = (candidate as { education?: unknown[] }).education
  return Array.isArray(education) && education.length > 0
}

function hasJobPreferences(candidate: Candidate): boolean {
  const prefs = (candidate as { jobPreferences?: Record<string, unknown> }).jobPreferences
  if (!prefs || typeof prefs !== 'object') return false
  return Boolean(
    String(prefs.preferredJobTitle ?? '').trim() ||
      String(prefs.preferredLocation ?? '').trim() ||
      String(prefs.preferredSalary ?? '').trim() ||
      (prefs.workType && prefs.workType !== 'any') ||
      (prefs.shiftPreference && prefs.shiftPreference !== 'any'),
  )
}

function hasJobBenefits(candidate: Candidate): boolean {
  const benefits = (candidate as { preferredBenefits?: unknown[] }).preferredBenefits
  return Array.isArray(benefits) && benefits.length > 0
}

function isFieldMissing(field: ProfileCompletenessField, candidate: Candidate): boolean {
  switch (field) {
    case 'profilePicture':
      return !candidate.profilePicture
    case 'resume':
      return !candidate.resume
    case 'location':
      return !candidate.location?.trim()
    case 'nationality':
      return !candidate.nationality?.trim()
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
    case 'education':
      return !hasEducation(candidate)
    case 'languages':
      return !candidate.languages?.trim()
    case 'jobPreferences':
      return !hasJobPreferences(candidate)
    case 'jobBenefits':
      return !hasJobBenefits(candidate)
    case 'whatsappNumber':
      return !hasWhatsAppContact(candidate)
    default:
      return false
  }
}

function metaToItem(meta: ProfileFieldMeta): ProfileFieldItem {
  return {
    field: meta.field,
    label: meta.label,
    i18nKey: meta.i18nKey,
    href: meta.href,
    actionKey: meta.actionKey,
    points: meta.points,
  }
}

export function getMissingProfileFields(candidate: Candidate): MissingProfileField[] {
  const missing: MissingProfileField[] = []
  for (const meta of PROFILE_COMPLETENESS_FIELDS) {
    if (isFieldMissing(meta.field, candidate)) {
      missing.push(metaToItem(meta))
    }
  }
  return missing
}

export function getCompletedProfileFields(candidate: Candidate): CompletedProfileField[] {
  const completed: CompletedProfileField[] = []
  for (const meta of PROFILE_COMPLETENESS_FIELDS) {
    if (!isFieldMissing(meta.field, candidate)) {
      completed.push(metaToItem(meta))
    }
  }
  return completed
}

/** Full checklist in display order — every dashboard field, with completion status */
export function getAllProfileFieldStatuses(candidate: Candidate): ProfileFieldStatus[] {
  const missingFields = new Set(getMissingProfileFields(candidate).map((m) => m.field))
  return PROFILE_COMPLETENESS_FIELDS.map((meta) => ({
    ...metaToItem(meta),
    isComplete: !missingFields.has(meta.field),
  }))
}

export function getProfileCompleteness(candidate: Candidate): ProfileCompleteness {
  const total = PROFILE_COMPLETENESS_FIELDS.length
  const missing = getMissingProfileFields(candidate)
  const completed = getCompletedProfileFields(candidate)
  const filled = completed.length
  const earnedPoints = completed.reduce((sum, item) => sum + item.points, 0)
  const totalPoints = TOTAL_POINTS
  const percent =
    totalPoints === 0 ? 100 : Math.min(100, Math.round((earnedPoints / totalPoints) * 100))

  return {
    percent,
    filled,
    total,
    earnedPoints,
    totalPoints,
    missing,
    completed,
  }
}

export function isProfileComplete(candidate: Candidate): boolean {
  return getMissingProfileFields(candidate).length === 0
}

/** Map dashboard href hash to DOM id for scroll + highlight */
export function sectionIdFromHref(href: string): string | null {
  const hash = href.includes('#') ? href.split('#')[1] : null
  return hash || null
}

export function isSamePageDashboardLink(href: string): boolean {
  return href.startsWith('/dashboard#')
}

export const PROFILE_HIGHLIGHT_CLASS = 'profile-strength-highlight'

export function flashProfileSection(elementId: string, durationMs = 2200): void {
  const el = document.getElementById(elementId)
  if (!el) return
  el.classList.add(PROFILE_HIGHLIGHT_CLASS)
  window.setTimeout(() => {
    el.classList.remove(PROFILE_HIGHLIGHT_CLASS)
  }, durationMs)
}
