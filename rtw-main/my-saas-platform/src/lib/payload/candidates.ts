import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Candidate, Media } from '@/payload-types'
import type { BillingClass } from '@/lib/billing'
import type { CandidateListItem, CandidateDetail } from '@/types/candidate'
import {
  getCandidateIdsForDiscipline,
  getCandidateIdsForJobType,
  getCandidateIdsForTaxonomy,
  resolveDisciplineId,
} from '@/lib/candidates/discipline-filter'
import {
  normalizeJobTypeFilter,
  skillLevelToBillingClass,
} from '@/lib/candidates/filter-params'
import { publicCandidateWhere } from '@/lib/candidates/profile-status'

// Re-export for server code that imports from this file
export type { CandidateListItem, CandidateDetail }

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extract URL from media field (handles both populated and ID reference)
 */
function getMediaUrl(media: number | Media | null | undefined): string | null {
  if (!media) return null
  if (typeof media === 'number') return null // Not populated
  return media.url || null
}

/**
 * Transform raw Candidate doc to CandidateListItem
 */
function toListItem(doc: Candidate): CandidateListItem {
  return {
    id: doc.id,
    firstName: doc.firstName,
    lastName: doc.lastName,
    jobTitle: doc.jobTitle,
    location: doc.location,
    nationality: doc.nationality,
    experienceYears: doc.experienceYears,
    saudiExperience: doc.saudiExperience,
    profilePictureUrl: getMediaUrl(doc.profilePicture),
    billingClass: (doc.billingClass as BillingClass) || null,
    email: doc.email || undefined, // Temporarily added
  }
}

type NamedTaxonomy = {
  name?: string
  name_en?: string | null
  name_ar?: string | null
}

function localizedTaxonomyName(doc: NamedTaxonomy | null | undefined, locale: string): string | null {
  if (!doc) return null
  const ar = doc.name_ar?.trim()
  const en = doc.name_en?.trim()
  const fallback = doc.name?.trim()
  if (locale === 'ar') {
    if (ar) return ar
    if (fallback) return fallback
    if (en) return en
    return null
  }
  if (en) return en
  if (fallback) return fallback
  if (ar) return ar
  return null
}

/**
 * Full path chosen on the job matrix: discipline → category → subcategory → primary skill.
 * Comma-separated for display (e.g. "Agriculture…, Veterinarian, Livestock…, Agricultural Logistics…").
 */
function jobMatrixSelectionFromPrimarySkill(
  primarySkill: Candidate['primarySkill'],
  locale: string,
): string | null {
  if (!primarySkill || typeof primarySkill === 'number') return null

  const skillName = localizedTaxonomyName(primarySkill, locale)
  const sub = primarySkill.subCategory

  if (!sub || typeof sub === 'number') {
    return skillName
  }

  const subName = localizedTaxonomyName(sub, locale)
  const cat = sub.category

  if (!cat || typeof cat === 'number') {
    const parts = [subName, skillName].filter(Boolean) as string[]
    return parts.length ? parts.join(', ') : null
  }

  const catName = localizedTaxonomyName(cat, locale)
  const disc = cat.discipline

  if (!disc || typeof disc === 'number') {
    const parts = [catName, subName, skillName].filter(Boolean) as string[]
    return parts.length ? parts.join(', ') : null
  }

  const discName = localizedTaxonomyName(disc, locale)
  const parts = [discName, catName, subName, skillName].filter(Boolean) as string[]
  return parts.length ? parts.join(', ') : null
}

/**
 * Transform raw Candidate doc to CandidateDetail
 */
function toDetail(doc: Candidate, locale: string): CandidateDetail {
  return {
    ...toListItem(doc),
    phone: doc.phone,
    whatsapp: doc.whatsapp || null,
    gender: doc.gender,
    dob: doc.dob,
    languages: doc.languages,
    jobMatrixSelection: jobMatrixSelectionFromPrimarySkill(doc.primarySkill, locale),
    currentEmployer: doc.currentEmployer || null,
    availabilityDate: doc.availabilityDate,
    visaStatus: doc.visaStatus,
    visaExpiry: doc.visaExpiry || null,
    visaProfession: doc.visaProfession || null,
    resumeUrl: getMediaUrl(doc.resume),
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
  }
}

// ============================================================================
// Data Fetching Functions (Internal)
// ============================================================================

async function fetchCandidates(options?: {
  limit?: number
  page?: number
  disciplineSlug?: string
  location?: string
  nationality?: string
  billingClass?: string
  experience?: string
  country?: string
  state?: string
  jobType?: string
  discipline?: string
  category?: string
  subCategory?: string
  skillLevel?: string
  availability?: string
  language?: string
}): Promise<{
  candidates: CandidateListItem[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}> {
  const payload = await getPayload({ config: configPromise })

  const {
    limit = 20,
    page = 1,
    disciplineSlug,
    location,
    nationality,
    billingClass,
    experience,
    country,
    state,
    jobType,
    discipline,
    category,
    subCategory,
    skillLevel,
    availability,
    language,
  } = options || {}

  // Build where clause — only approved profiles on the public site
  const where: any = {
    ...publicCandidateWhere(),
  }

  // Apply location filter (city/state)
  // Note: location field stores city names like "Riyadh", "Jeddah", "PORT LOUIS"
  if (state || location) {
    const locationFilter = state || location
    if (locationFilter) {
      where.location = {
        contains: locationFilter,
      }
    }
  }

  // Apply country filter - country should filter by nationality field
  // Based on filter-options.ts, countries come from nationalities
  if (country) {
    where.nationality = {
      contains: country,
    }
  }

  // Apply nationality filter (if explicitly provided, separate from country)
  if (nationality && !country) {
    // Only apply if country wasn't already set (country and nationality are the same field)
    where.nationality = {
      contains: nationality,
    }
  }

  // Apply language filter
  if (language) {
    where.languages = {
      contains: language,
    }
  }

  // Apply billing class filter (explicit param or skill-level dropdown)
  const billingFromSkillLevel = skillLevel ? skillLevelToBillingClass(skillLevel) : null
  const effectiveBillingClass = billingClass || billingFromSkillLevel
  if (effectiveBillingClass) {
    where.billingClass = {
      equals: effectiveBillingClass,
    }
  }

  // Apply experience filter (range) - handle both old format and new format
  if (experience) {
    const experienceRanges: Record<string, { min: number; max?: number }> = {
      '0-1': { min: 0, max: 1 },
      '1-3': { min: 1, max: 3 },
      '3-5': { min: 3, max: 5 },
      '5-10': { min: 5, max: 10 },
      '10+': { min: 10 },
      '0-1 years': { min: 0, max: 1 },
      '1-3 years': { min: 1, max: 3 },
      '3-5 years': { min: 3, max: 5 },
      '5-10 years': { min: 5, max: 10 },
      '10+ years': { min: 10 },
    }

    const range = experienceRanges[experience]
    if (range) {
      if (range.max !== undefined) {
        where.experienceYears = {
          greater_than_equal: range.min,
          less_than_equal: range.max,
        }
      } else {
        where.experienceYears = {
          greater_than_equal: range.min,
        }
      }
    }
  }

  // Apply availability filter
  if (availability) {
    const now = new Date()
    now.setHours(0, 0, 0, 0) // Start of today
    
    const availabilityRanges: Record<string, { min?: Date; max: Date }> = {
      'Immediate': { max: now }, // Available today or before
      '1 Week': { max: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
      '2 Weeks': { max: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
      '1 Month': { max: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) },
      '2+ Months': { max: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000) },
    }

    const range = availabilityRanges[availability]
    if (range) {
      if (range.min) {
        where.availabilityDate = {
          greater_than_equal: range.min.toISOString(),
          less_than_equal: range.max.toISOString(),
        }
      } else {
        where.availabilityDate = {
          less_than_equal: range.max.toISOString(),
        }
      }
    }
  }

  // Narrow by candidate id sets (discipline, taxonomy, job type) — intersect when multiple apply
  let constrainedIds: number[] | undefined

  const intersectCandidateIds = (next: number[]): void => {
    if (constrainedIds !== undefined && constrainedIds.length === 0) return
    if (next.length === 0) {
      constrainedIds = []
      return
    }
    if (constrainedIds === undefined) {
      constrainedIds = next
      return
    }
    const allowed = new Set(next)
    constrainedIds = constrainedIds.filter((id) => allowed.has(id))
  }

  const hasTaxonomy = Boolean(category?.trim() || subCategory?.trim())
  const disciplineOnlyParam =
    !hasTaxonomy ? (disciplineSlug || discipline) : undefined

  try {
    if (disciplineOnlyParam) {
      const disciplineId = await resolveDisciplineId(disciplineOnlyParam)
      if (!disciplineId) {
        intersectCandidateIds([])
      } else {
        intersectCandidateIds(await getCandidateIdsForDiscipline(disciplineId))
      }
    } else if (discipline || category || subCategory) {
      const disciplineId = discipline ? await resolveDisciplineId(discipline) : null
      if (discipline && !disciplineId) {
        intersectCandidateIds([])
      } else {
        intersectCandidateIds(
          await getCandidateIdsForTaxonomy({
            disciplineId,
            categoryName: category,
            subCategoryName: subCategory,
          }),
        )
      }
    }

    if (jobType) {
      const workType = normalizeJobTypeFilter(jobType)
      if (workType) {
        intersectCandidateIds(await getCandidateIdsForJobType(workType))
      }
    }
  } catch (error) {
    console.error('Error applying candidate id filters:', error)
  }

  if (constrainedIds !== undefined) {
    if (constrainedIds.length === 0) {
      where.id = { equals: -1 }
    } else {
      where.id = { in: constrainedIds }
    }
  }

  const result = await payload.find({
    collection: 'candidates',
    limit,
    page,
    sort: '-createdAt', // Newest first
    depth: 1, // Populate profilePicture
    overrideAccess: true, // Public listing
    where,
  })

  return {
    candidates: result.docs.map(toListItem),
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page || 1,
    hasNextPage: result.hasNextPage,
    hasPrevPage: result.hasPrevPage,
  }
}

async function fetchCandidateById(id: number, locale: string): Promise<CandidateDetail | null> {
  const payload = await getPayload({ config: configPromise })

  try {
    const doc = await payload.findByID({
      collection: 'candidates',
      id,
      // Populate profilePicture + primarySkill → subCategory → category → discipline
      depth: 4,
      overrideAccess: true, // Public access for detail view
    })

    if (!doc || !doc.termsAccepted || doc.profileStatus !== 'approved') {
      return null
    }

    return toDetail(doc, locale)
  } catch {
    return null
  }
}

// ============================================================================
// Cached Public API
// ============================================================================

/**
 * Get paginated list of candidates (cached with 'candidates' tag)
 */
export const getCandidates = (options?: {
  limit?: number
  page?: number
  disciplineSlug?: string
  location?: string
  nationality?: string
  billingClass?: string
  experience?: string
  country?: string
  state?: string
  jobType?: string
  discipline?: string
  category?: string
  subCategory?: string
  skillLevel?: string
  availability?: string
  language?: string
}) =>
  unstable_cache(
    async () => fetchCandidates(options),
    [
      'candidates',
      `page-${options?.page || 1}`,
      `limit-${options?.limit || 20}`,
      `discipline-${options?.disciplineSlug || options?.discipline || 'all'}`,
      `location-${options?.location || options?.country || options?.state || 'all'}`,
      `nationality-${options?.nationality || 'all'}`,
      `billingClass-${options?.billingClass || 'all'}`,
      `experience-${options?.experience || 'all'}`,
      `category-${options?.category || 'all'}`,
      `subCategory-${options?.subCategory || 'all'}`,
      `availability-${options?.availability || 'all'}`,
      `language-${options?.language || 'all'}`,
      `jobType-${options?.jobType || 'all'}`,
      `skillLevel-${options?.skillLevel || 'all'}`,
    ],
    {
      tags: ['candidates'],
      revalidate: 60, // Revalidate every 60 seconds as fallback
    },
  )()

/**
 * Get single candidate by ID (cached with 'candidate:${id}' tag)
 * @param locale Used for localized job matrix path (discipline → category → subcategory → skill).
 */
export const getCandidateById = (id: number, locale: string) =>
  unstable_cache(async () => fetchCandidateById(id, locale), ['candidate', String(id), locale], {
    tags: [`candidate:${id}`, 'candidates'],
    revalidate: 60,
  })()

// ============================================================================
// Utility: Format experience for display
// ============================================================================
// Re-export from utils for backward compatibility
export { formatExperience, getNationalityFlag } from '@/lib/utils/candidate-utils'

