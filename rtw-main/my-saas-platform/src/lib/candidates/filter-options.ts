'use server'

import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { disciplineSlugFromName } from '@/lib/candidates/discipline-filter'
import { publicCandidateWhere } from '@/lib/candidates/profile-status'

export interface FilterOptions {
  nationalities: string[]
  disciplines: string[]
  categories: string[]
  subCategories: string[]
  /** discipline slug -> category names */
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

async function fetchFilterOptions(locale?: string): Promise<FilterOptions> {
  try {
    const payload = await getPayload({ config: await configPromise })

    // Taxonomy + nationalities only (removed filters no longer need candidate field scans)
    const [candidates, allDisciplines, allCategories, allSubCategories] = await Promise.all([
      payload.find({
        collection: 'candidates',
        where: publicCandidateWhere(),
        limit: 10000,
        depth: 0,
        // Only need nationality for the remaining filter dropdown
        select: { nationality: true },
        overrideAccess: true,
      }),
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

    const nationalities = new Set<string>()
    const disciplines = new Set<string>()
    const categories = new Set<string>()
    const subCategories = new Set<string>()

    candidates.docs.forEach((candidate) => {
      if (candidate.nationality) {
        nationalities.add(candidate.nationality)
      }
    })

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

    const localeSort = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' })

    // Build localized label maps for discipline/category/subCategory when locale is provided
    let labelMaps: FilterOptions['labelMaps'] | undefined
    if (locale === 'ar' || locale === 'en') {
      const disciplineMap: Record<string, string> = {}
      const categoryMap: Record<string, string> = {}
      const subCategoryMap: Record<string, string> = {}
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
      nationalities: Array.from(nationalities).sort(localeSort),
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

/**
 * Cached filter dropdown options. Revalidates with candidates tag (profile approve/update)
 * and every 5 minutes as a fallback.
 */
export async function getFilterOptions(locale?: string): Promise<FilterOptions> {
  const localeKey = locale || 'en'
  return unstable_cache(
    async () => fetchFilterOptions(localeKey),
    ['filter-options', localeKey],
    {
      tags: ['filter-options', 'candidates'],
      revalidate: 300,
    },
  )()
}
