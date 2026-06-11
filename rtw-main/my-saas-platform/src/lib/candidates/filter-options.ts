'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { disciplineSlugFromName } from '@/lib/candidates/discipline-filter'
import { publicCandidateWhere } from '@/lib/candidates/profile-status'

export interface FilterOptions {
  locations: string[]
  countries: string[]
  states: string[]
  nationalities: string[]
  languages: string[]
  jobTypes: string[]
  disciplines: string[]
  categories: string[]
  subCategories: string[]
  /** discipline name -> category names */
  categoriesByDiscipline: Record<string, string[]>
  /** category name -> subcategory names */
  subCategoriesByCategory: Record<string, string[]>
  /** Optional: canonical name -> localized label for dropdown display (when locale is passed) */
  labelMaps?: {
    discipline: Record<string, string>
    category: Record<string, string>
    subCategory: Record<string, string>
  }
}

function getLocalizedName(doc: { name?: string | null; name_en?: string | null; name_ar?: string | null }, locale: string): string {
  if (locale === 'ar' && doc.name_ar) return doc.name_ar
  if (doc.name_en) return doc.name_en
  return doc.name ?? ''
}

export async function getFilterOptions(locale?: string): Promise<FilterOptions> {
  try {
    const payload = await getPayload({ config: await configPromise })

    const candidates = await payload.find({
      collection: 'candidates',
      where: publicCandidateWhere(),
      limit: 10000,
      depth: 2, // Populate primarySkill and its relationships
      overrideAccess: true,
    })

    // Extract unique values
    const locations = new Set<string>()
    const nationalities = new Set<string>()
    const languages = new Set<string>()
    const disciplines = new Set<string>()
    const categories = new Set<string>()
    const subCategories = new Set<string>()
    const jobTypes = new Set<string>()

    candidates.docs.forEach((candidate) => {
      if (candidate.location) {
        locations.add(candidate.location)
      }
      if (candidate.nationality) {
        nationalities.add(candidate.nationality)
      }
      if (candidate.languages) {
        // Languages is comma-separated
        candidate.languages.split(',').forEach((lang) => {
          const trimmed = lang.trim()
          if (trimmed) languages.add(trimmed)
        })
      }

      const workType = (candidate as { jobPreferences?: { workType?: string } }).jobPreferences?.workType
      if (workType && workType !== 'any') {
        jobTypes.add(workType)
      }

      // Extract taxonomy from primarySkill
      if (candidate.primarySkill && typeof candidate.primarySkill === 'object') {
        const skill = candidate.primarySkill as any
        if (skill.subCategory && typeof skill.subCategory === 'object') {
          const subCategory = skill.subCategory
          if (subCategory.name) {
            subCategories.add(subCategory.name)
          }

          if (subCategory.category && typeof subCategory.category === 'object') {
            const category = subCategory.category
            if (category.name) {
              categories.add(category.name)
            }

            if (category.discipline && typeof category.discipline === 'object') {
              const discipline = category.discipline
              const slug =
                discipline.slug ||
                (discipline.name ? disciplineSlugFromName(discipline.name) : '')
              if (slug) disciplines.add(slug)
            }
          }
        }
      }
    })

    // Also fetch all disciplines, categories, subcategories directly
    const [allDisciplines, allCategories, allSubCategories] = await Promise.all([
      payload.find({
        collection: 'disciplines',
        limit: 1000,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'categories',
        limit: 1000,
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'subcategories',
        limit: 1000,
        depth: 1,
        overrideAccess: true,
      }),
    ])

    const disciplineSlugByName = new Map<string, string>()
    allDisciplines.docs.forEach((d) => {
      const slug =
        d.slug ||
        disciplineSlugFromName(d.name || d.name_en || '')
      if (slug) {
        disciplines.add(slug)
        if (d.name) disciplineSlugByName.set(d.name, slug)
      }
    })

    allCategories.docs.forEach((c) => {
      categories.add(c.name)
    })

    allSubCategories.docs.forEach((sc) => {
      subCategories.add(sc.name)
    })

    // Build hierarchy maps for cascading filters
    const categoriesByDiscipline: Record<string, string[]> = {}
    const subCategoriesByCategory: Record<string, string[]> = {}

    allCategories.docs.forEach((c) => {
      const disc = c.discipline as { id?: string; name?: string; slug?: string } | null | undefined
      const discName = disc && typeof disc === 'object' && disc.name ? disc.name : ''
      const discSlug =
        disc && typeof disc === 'object'
          ? disc.slug || disciplineSlugByName.get(discName) || disciplineSlugFromName(discName)
          : ''
      if (discSlug && c.name) {
        if (!categoriesByDiscipline[discSlug]) categoriesByDiscipline[discSlug] = []
        categoriesByDiscipline[discSlug].push(c.name)
      }
    })
    Object.keys(categoriesByDiscipline).forEach((k) => {
      categoriesByDiscipline[k] = [...categoriesByDiscipline[k]].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      )
    })

    allSubCategories.docs.forEach((sc) => {
      const cat = sc.category as { id?: string; name?: string } | null | undefined
      const catName = cat && typeof cat === 'object' && cat.name ? cat.name : ''
      if (catName && sc.name) {
        if (!subCategoriesByCategory[catName]) subCategoriesByCategory[catName] = []
        subCategoriesByCategory[catName].push(sc.name)
      }
    })
    Object.keys(subCategoriesByCategory).forEach((k) => {
      subCategoriesByCategory[k] = [...subCategoriesByCategory[k]].sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      )
    })

    // Use nationality for countries (users select their nationality/country)
    // Use location for states/cities (users select city within a country)
    // Both fields are already collected from the registration form
    const countries = new Set<string>(nationalities) // Nationality = Country
    const states = new Set<string>(locations) // Location = City/State

    const localeSort = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })

    // Build localized label maps for discipline/category/subCategory when locale is provided
    let labelMaps: FilterOptions['labelMaps'] | undefined
    if (locale === 'ar' || locale === 'en') {
      const disciplineMap: Record<string, string> = {}
      const categoryMap: Record<string, string> = {}
      const subCategoryMap: Record<string, string> = {}
      // Keys must match option values (we use .name in the options arrays)
      allDisciplines.docs.forEach((d: any) => {
        const key =
          d.slug ||
          disciplineSlugFromName(d.name || d.name_en || '')
        if (key) disciplineMap[key] = getLocalizedName(d, locale)
      })
      allCategories.docs.forEach((c: any) => {
        const key = c.name ?? ''
        if (key) categoryMap[key] = getLocalizedName(c, locale)
      })
      allSubCategories.docs.forEach((sc: any) => {
        const key = sc.name ?? ''
        if (key) subCategoryMap[key] = getLocalizedName(sc, locale)
      })
      labelMaps = { discipline: disciplineMap, category: categoryMap, subCategory: subCategoryMap }
    }

    return {
      locations: Array.from(locations).sort(localeSort),
      countries: Array.from(countries).sort(localeSort),
      states: Array.from(states).sort(localeSort),
      nationalities: Array.from(nationalities).sort(localeSort),
      languages: Array.from(languages).sort(localeSort),
      jobTypes: Array.from(jobTypes).sort(localeSort),
      disciplines: Array.from(disciplines).sort(localeSort),
      categories: Array.from(categories).sort(localeSort),
      subCategories: Array.from(subCategories).sort(localeSort),
      categoriesByDiscipline,
      subCategoriesByCategory,
      labelMaps,
    }
  } catch (error: any) {
    console.error('Error fetching filter options:', error)
    throw new Error('Failed to fetch filter options')
  }
}
