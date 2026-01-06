import configPromise from '@payload-config'
import { getPayload } from 'payload'
import { unstable_cache } from 'next/cache'
import type { Candidate, Media } from '@/payload-types'
import type { BillingClass } from '@/lib/billing'

// ============================================================================
// Types
// ============================================================================

export interface CandidateListItem {
  id: number
  firstName: string
  lastName: string
  jobTitle: string
  location: string
  nationality: string
  experienceYears: number
  saudiExperience: number
  profilePictureUrl: string | null
  billingClass: BillingClass | null
}

export interface CandidateDetail extends CandidateListItem {
  phone: string
  whatsapp: string | null
  gender: 'male' | 'female'
  dob: string
  languages: string
  currentEmployer: string | null
  availabilityDate: string
  visaStatus: 'active' | 'expired' | 'nearly_expired' | 'none'
  visaExpiry: string | null
  visaProfession: string | null
  resumeUrl: string | null
  createdAt: string
  updatedAt: string
}

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
  }
}

/**
 * Transform raw Candidate doc to CandidateDetail
 */
function toDetail(doc: Candidate): CandidateDetail {
  return {
    ...toListItem(doc),
    phone: doc.phone,
    whatsapp: doc.whatsapp || null,
    gender: doc.gender,
    dob: doc.dob,
    languages: doc.languages,
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
}): Promise<{
  candidates: CandidateListItem[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}> {
  const payload = await getPayload({ config: configPromise })

  const { limit = 20, page = 1, disciplineSlug } = options || {}

  // Build where clause
  const where: any = {
    // Only show candidates who accepted terms (valid registrations)
    termsAccepted: {
      equals: true,
    },
  }

  // If discipline filter is provided, filter by discipline through relationship chain
  if (disciplineSlug) {
    try {
      // 1. Find discipline by slug
      const disciplineResult = await payload.find({
        collection: 'disciplines',
        where: {
          slug: {
            equals: disciplineSlug,
          },
        },
        limit: 1,
      })

      if (disciplineResult.docs.length > 0) {
        const disciplineId = disciplineResult.docs[0].id

        // 2. Find all categories for this discipline
        const categoriesResult = await payload.find({
          collection: 'categories',
          where: {
            discipline: {
              equals: disciplineId,
            },
          },
          limit: 1000,
        })

        const categoryIds = categoriesResult.docs.map((cat) => cat.id)

        if (categoryIds.length > 0) {
          // 3. Find all subcategories for these categories
          const subCategoriesResult = await payload.find({
            collection: 'subcategories',
            where: {
              category: {
                in: categoryIds,
              },
            },
            limit: 1000,
          })

          const subCategoryIds = subCategoriesResult.docs.map((sub) => sub.id)

          if (subCategoryIds.length > 0) {
            // 4. Find all skills for these subcategories
            const skillsResult = await payload.find({
              collection: 'skills',
              where: {
                subCategory: {
                  in: subCategoryIds,
                },
              },
              limit: 1000,
            })

            const skillIds = skillsResult.docs.map((skill) => skill.id)

            if (skillIds.length > 0) {
              // 5. Filter candidates by primarySkill
              where.primarySkill = {
                in: skillIds,
              }
            } else {
              // No skills found, return empty result
              where.primarySkill = {
                equals: -1, // Non-existent ID to return no results
              }
            }
          } else {
            // No subcategories found, return empty result
            where.primarySkill = {
              equals: -1,
            }
          }
        } else {
          // No categories found, return empty result
          where.primarySkill = {
            equals: -1,
          }
        }
      } else {
        // Discipline not found, return empty result
        where.primarySkill = {
          equals: -1,
        }
      }
    } catch (error) {
      console.error('Error filtering by discipline:', error)
      // On error, don't filter (show all candidates)
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

async function fetchCandidateById(id: number): Promise<CandidateDetail | null> {
  const payload = await getPayload({ config: configPromise })

  try {
    const doc = await payload.findByID({
      collection: 'candidates',
      id,
      depth: 1, // Populate media fields
      overrideAccess: true, // Public access for detail view
    })

    if (!doc || !doc.termsAccepted) {
      return null
    }

    return toDetail(doc)
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
export const getCandidates = (options?: { limit?: number; page?: number; disciplineSlug?: string }) =>
  unstable_cache(
    async () => fetchCandidates(options),
    [
      'candidates',
      `page-${options?.page || 1}`,
      `limit-${options?.limit || 20}`,
      `discipline-${options?.disciplineSlug || 'all'}`,
    ],
    {
      tags: ['candidates'],
      revalidate: 60, // Revalidate every 60 seconds as fallback
    },
  )()

/**
 * Get single candidate by ID (cached with 'candidate:${id}' tag)
 */
export const getCandidateById = (id: number) =>
  unstable_cache(async () => fetchCandidateById(id), ['candidate', String(id)], {
    tags: [`candidate:${id}`, 'candidates'],
    revalidate: 60,
  })()

// ============================================================================
// Utility: Format experience for display
// ============================================================================
// Re-export from utils for backward compatibility
export { formatExperience, getNationalityFlag } from '@/lib/utils/candidate-utils'

