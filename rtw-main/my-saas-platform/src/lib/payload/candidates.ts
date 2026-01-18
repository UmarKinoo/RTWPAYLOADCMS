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
  email?: string // Temporarily added
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
    email: doc.email || undefined, // Temporarily added
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

  // Build where clause
  const where: any = {
    // Only show candidates who accepted terms (valid registrations)
    termsAccepted: {
      equals: true,
    },
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

  // Apply billing class filter (or skillLevel if it maps to billing class)
  if (billingClass) {
    where.billingClass = {
      equals: billingClass,
    }
  } else if (skillLevel) {
    // Map skill level to billing class if needed
    // For now, we'll skip this as skillLevel might not directly map
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

  // Apply taxonomy filters (discipline, category, subCategory)
  // These filter through primarySkill relationship
  let skillIdsToFilter: number[] | null = null

  if (discipline || category || subCategory) {
    try {
      let disciplineIds: number[] = []
      let categoryIds: number[] = []
      let subCategoryIds: number[] = []

      // 1. Filter by discipline if provided
      if (discipline) {
        const disciplineResult = await payload.find({
          collection: 'disciplines',
          where: {
            name: {
              equals: discipline,
            },
          },
          limit: 1000,
        })
        disciplineIds = disciplineResult.docs.map((d) => d.id)
      }

      // 2. Filter by category if provided
      if (category) {
        const categoryWhere: any = {
          name: {
            equals: category,
          },
        }
        if (disciplineIds.length > 0) {
          categoryWhere.discipline = {
            in: disciplineIds,
          }
        }
        const categoryResult = await payload.find({
          collection: 'categories',
          where: categoryWhere,
          limit: 1000,
        })
        categoryIds = categoryResult.docs.map((c) => c.id)
      } else if (disciplineIds.length > 0) {
        // If only discipline is provided, get all categories for that discipline
        const categoryResult = await payload.find({
          collection: 'categories',
          where: {
            discipline: {
              in: disciplineIds,
            },
          },
          limit: 1000,
        })
        categoryIds = categoryResult.docs.map((c) => c.id)
      }

      // 3. Filter by subCategory if provided
      if (subCategory) {
        const subCategoryWhere: any = {
          name: {
            equals: subCategory,
          },
        }
        if (categoryIds.length > 0) {
          subCategoryWhere.category = {
            in: categoryIds,
          }
        }
        const subCategoryResult = await payload.find({
          collection: 'subcategories',
          where: subCategoryWhere,
          limit: 1000,
        })
        subCategoryIds = subCategoryResult.docs.map((sc) => sc.id)
      } else if (categoryIds.length > 0) {
        // If category is provided, get all subcategories for that category
        const subCategoryResult = await payload.find({
          collection: 'subcategories',
          where: {
            category: {
              in: categoryIds,
            },
          },
          limit: 1000,
        })
        subCategoryIds = subCategoryResult.docs.map((sc) => sc.id)
      }

      // 4. Get all skills for the filtered subcategories
      if (subCategoryIds.length > 0) {
        const skillsResult = await payload.find({
          collection: 'skills',
          where: {
            subCategory: {
              in: subCategoryIds,
            },
          },
          limit: 1000,
        })
        skillIdsToFilter = skillsResult.docs.map((s) => s.id)
      } else if (discipline || category || subCategory) {
        // If filters were provided but no results, return empty
        skillIdsToFilter = []
      }
    } catch (error) {
      console.error('Error filtering by taxonomy:', error)
    }
  }

  // Apply primarySkill filter (from taxonomy filters or disciplineSlug)
  if (skillIdsToFilter !== null) {
    if (skillIdsToFilter.length > 0) {
      where.primarySkill = {
        in: skillIdsToFilter,
      }
    } else {
      // No skills found, return empty result
      where.primarySkill = {
        equals: -1, // Non-existent ID to return no results
      }
    }
  } else if (disciplineSlug) {
    // Legacy disciplineSlug filter
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

