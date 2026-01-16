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

    // Use nationality for countries (users select their nationality/country)
    // Use location for states/cities (users select city within a country)
    // Both fields are already collected from the registration form
    const countries = new Set<string>(nationalities) // Nationality = Country
    const states = new Set<string>(locations) // Location = City/State

    return {
      locations: Array.from(locations).sort(),
      countries: Array.from(countries).sort(),
      states: Array.from(states).sort(),
      nationalities: Array.from(nationalities).sort(),
      languages: Array.from(languages).sort(),
      disciplines: Array.from(disciplines).sort(),
      categories: Array.from(categories).sort(),
      subCategories: Array.from(subCategories).sort(),
    }
  } catch (error: any) {
    console.error('Error fetching filter options:', error)
    throw new Error('Failed to fetch filter options')
  }
}
