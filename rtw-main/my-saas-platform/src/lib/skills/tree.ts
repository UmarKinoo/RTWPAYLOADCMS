import { unstable_cache } from 'next/cache'
import { getPayload } from 'payload'
import configPromise from '@payload-config'

export type Locale = 'en' | 'ar'

export interface SkillTreeRole {
  id: string
  name: string
}

export interface SkillTreeCategory {
  id: string
  name: string
  roles: SkillTreeRole[]
}

export interface SkillTreeIndustry {
  id: string
  name: string
  /** English / canonical name for image map lookup */
  nameEn: string
  roleCount: number
  categories: SkillTreeCategory[]
}

export interface SkillTree {
  industries: SkillTreeIndustry[]
}

function localizedName(
  doc: { name?: string | null; name_en?: string | null; name_ar?: string | null } | null | undefined,
  locale: Locale,
): string {
  if (!doc) return ''
  const ok = (s: unknown) => typeof s === 'string' && s.trim().length > 0
  if (locale === 'ar') {
    if (ok(doc.name_ar)) return doc.name_ar!
    if (ok(doc.name)) return doc.name!
    if (ok(doc.name_en)) return doc.name_en!
    return ''
  }
  if (ok(doc.name_en)) return doc.name_en!
  if (ok(doc.name)) return doc.name!
  if (ok(doc.name_ar)) return doc.name_ar!
  return ''
}

function relationId(value: unknown): string | null {
  if (value == null) return null
  if (typeof value === 'object' && value !== null && 'id' in value) {
    return String((value as { id: string | number }).id)
  }
  if (typeof value === 'string' || typeof value === 'number') return String(value)
  return null
}

export async function fetchSkillTree(locale: Locale): Promise<SkillTree> {
  const payload = await getPayload({ config: await configPromise })

  const [disciplines, categories, subcategories, skills] = await Promise.all([
    payload.find({
      collection: 'disciplines',
      limit: 1000,
      sort: 'displayOrder',
      overrideAccess: true,
    }),
    payload.find({
      collection: 'categories',
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'subcategories',
      limit: 2000,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'skills',
      limit: 5000,
      depth: 0,
      overrideAccess: true,
    }),
  ])

  // subcategoryId -> categoryId
  const subcategoryToCategory = new Map<string, string>()
  for (const sc of subcategories.docs) {
    const catId = relationId(sc.category)
    if (catId) subcategoryToCategory.set(String(sc.id), catId)
  }

  // categoryId -> disciplineId
  const categoryToDiscipline = new Map<string, string>()
  for (const c of categories.docs) {
    const discId = relationId(c.discipline)
    if (discId) categoryToDiscipline.set(String(c.id), discId)
  }

  // categoryId -> roles (dedupe by skill id)
  const rolesByCategory = new Map<string, Map<string, SkillTreeRole>>()

  for (const skill of skills.docs) {
    const subId = relationId(skill.subCategory)
    if (!subId) continue
    const catId = subcategoryToCategory.get(subId)
    if (!catId) continue

    const name = localizedName(skill, locale)
    if (!name) continue

    if (!rolesByCategory.has(catId)) rolesByCategory.set(catId, new Map())
    rolesByCategory.get(catId)!.set(String(skill.id), {
      id: String(skill.id),
      name,
    })
  }

  const localeSort = (a: string, b: string) =>
    a.localeCompare(b, locale === 'ar' ? 'ar' : 'en', { sensitivity: 'base' })

  const industries: SkillTreeIndustry[] = disciplines.docs
    .map((d) => {
      const discId = String(d.id)
      const discName = localizedName(d, locale)
      if (!discName) return null
      const nameEn =
        (typeof d.name_en === 'string' && d.name_en.trim()) ||
        (typeof d.name === 'string' && d.name.trim()) ||
        discName

      const cats: SkillTreeCategory[] = categories.docs
        .filter((c) => categoryToDiscipline.get(String(c.id)) === discId)
        .map((c) => {
          const catId = String(c.id)
          const catName = localizedName(c, locale)
          const roleMap = rolesByCategory.get(catId)
          const roles = roleMap
            ? Array.from(roleMap.values()).sort((a, b) => localeSort(a.name, b.name))
            : []
          return {
            id: catId,
            name: catName || c.name || '',
            roles,
          }
        })
        .filter((c) => c.name && c.roles.length > 0)
        .sort((a, b) => localeSort(a.name, b.name))

      const roleCount = cats.reduce((sum, c) => sum + c.roles.length, 0)
      if (roleCount === 0) return null

      return {
        id: discId,
        name: discName,
        nameEn,
        roleCount,
        categories: cats,
      }
    })
    .filter((x): x is SkillTreeIndustry => x !== null)

  return { industries }
}

/**
 * Full Industry → Category → Role tree for the job role picker.
 * Matrix changes rarely; cache for 1 hour.
 */
export async function getSkillTree(locale: Locale = 'en'): Promise<SkillTree> {
  return unstable_cache(
    async () => fetchSkillTree(locale),
    ['skills-tree-v2', locale],
    {
      tags: ['skills-tree', 'skills'],
      revalidate: 3600,
    },
  )()
}
