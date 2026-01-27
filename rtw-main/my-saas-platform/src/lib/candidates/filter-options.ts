'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'

export interface FilterOptions {
  locations: string[]
  countries: string[]
  states: string[]
  nationalities: string[]
  languages: string[]
  disciplines: string[]
  categories: string[]
  subCategories: string[]
  /** discipline name -> category names */
  categoriesByDiscipline: Record<string, string[]>
  /** category name -> subcategory names */
  subCategoriesByCategory: Record<string, string[]>
}

export async function getFilterOptions(): Promise<FilterOptions> {
  try {
    const payload = await getPayload({ config: await configPromise })

    // Fetch all candidates with termsAccepted = true
    const candidates = await payload.find({
      collection: 'candidates',
      where: {
        termsAccepted: {
          equals: true,
        },
      },
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
              if (discipline.name) {
                disciplines.add(discipline.name)
              }
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

    allDisciplines.docs.forEach((d) => {
      disciplines.add(d.name)
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
      const disc = c.discipline as { id?: string; name?: string } | null | undefined
      const discName = disc && typeof disc === 'object' && disc.name ? disc.name : ''
      if (discName && c.name) {
        if (!categoriesByDiscipline[discName]) categoriesByDiscipline[discName] = []
        categoriesByDiscipline[discName].push(c.name)
      }
    })
    Object.keys(categoriesByDiscipline).forEach((k) => {
      categoriesByDiscipline[k] = categoriesByDiscipline[k].toSorted((a, b) =>
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
      subCategoriesByCategory[k] = subCategoriesByCategory[k].toSorted((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: 'base' }),
      )
    })

    // Use nationality for countries (users select their nationality/country)
    // Use location for states/cities (users select city within a country)
    // Both fields are already collected from the registration form
    const countries = new Set<string>(nationalities) // Nationality = Country
    const states = new Set<string>(locations) // Location = City/State

    const localeSort = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })
    return {
      locations: Array.from(locations).sort(localeSort),
      countries: Array.from(countries).sort(localeSort),
      states: Array.from(states).sort(localeSort),
      nationalities: Array.from(nationalities).sort(localeSort),
      languages: Array.from(languages).sort(localeSort),
      disciplines: Array.from(disciplines).sort(localeSort),
      categories: Array.from(categories).sort(localeSort),
      subCategories: Array.from(subCategories).sort(localeSort),
      categoriesByDiscipline,
      subCategoriesByCategory,
    }
  } catch (error: any) {
    console.error('Error fetching filter options:', error)
    throw new Error('Failed to fetch filter options')
  }
}
