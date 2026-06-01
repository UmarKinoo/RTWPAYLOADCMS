import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { query as dbQuery } from '@/lib/db'

/** URL slug from discipline name (matches seed-disciplines / homepage). */
export function disciplineSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Resolve a discipline URL param (slug or display name) to a discipline id.
 */
export async function resolveDisciplineId(disciplineParam: string): Promise<number | null> {
  const param = disciplineParam.trim()
  if (!param) return null

  const payload = await getPayload({ config: configPromise })

  const bySlug = await payload.find({
    collection: 'disciplines',
    where: { slug: { equals: param } },
    limit: 1,
    overrideAccess: true,
  })
  if (bySlug.docs[0]?.id) return Number(bySlug.docs[0].id)

  const byName = await payload.find({
    collection: 'disciplines',
    where: {
      or: [
        { name: { equals: param } },
        { name_en: { equals: param } },
        { name_ar: { equals: param } },
      ],
    },
    limit: 1,
    overrideAccess: true,
  })
  if (byName.docs[0]?.id) return Number(byName.docs[0].id)

  try {
    const ci = await dbQuery<{ id: string }>(
      `SELECT id FROM disciplines
       WHERE LOWER(slug) = LOWER($1)
          OR LOWER(name) = LOWER($1)
          OR LOWER(COALESCE(name_en, '')) = LOWER($1)
       LIMIT 1`,
      [param],
    )
    if (ci.rows[0]?.id) return Number(ci.rows[0].id)
  } catch {
    // fall through to generated-slug match
  }

  const all = await payload.find({
    collection: 'disciplines',
    limit: 1000,
    overrideAccess: true,
  })
  const paramLower = param.toLowerCase()
  for (const d of all.docs) {
    const candidates = [
      d.slug,
      d.name,
      d.name_en,
      d.name_ar,
      d.name ? disciplineSlugFromName(d.name) : null,
      d.name_en ? disciplineSlugFromName(d.name_en) : null,
    ].filter(Boolean) as string[]
    if (candidates.some((c) => c.toLowerCase() === paramLower)) {
      return Number(d.id)
    }
  }

  return null
}

/**
 * Candidate ids whose primary skill belongs to the given discipline (via job matrix).
 */
export async function getCandidateIdsForDiscipline(disciplineId: number): Promise<number[]> {
  const result = await dbQuery<{ id: string }>(
    `
    SELECT DISTINCT c.id
    FROM candidates c
    INNER JOIN skills s ON c.primary_skill_id = s.id
    INNER JOIN subcategories sc ON s.sub_category_id = sc.id
    INNER JOIN categories cat ON sc.category_id = cat.id
    WHERE cat.discipline_id = $1
      AND c.terms_accepted = true
    ORDER BY c.id DESC
    `,
    [disciplineId],
  )
  return result.rows.map((row) => Number(row.id))
}

/**
 * Candidate ids matching job-matrix taxonomy (discipline / category / subcategory).
 * Any provided filter narrows results; all are combined with AND.
 */
export async function getCandidateIdsForTaxonomy(options: {
  disciplineId?: number | null
  categoryName?: string
  subCategoryName?: string
}): Promise<number[]> {
  const { disciplineId, categoryName, subCategoryName } = options
  const hasDiscipline = disciplineId != null
  const hasCategory = Boolean(categoryName?.trim())
  const hasSubCategory = Boolean(subCategoryName?.trim())

  if (!hasDiscipline && !hasCategory && !hasSubCategory) {
    return []
  }

  const params: unknown[] = []
  const conditions: string[] = ['c.terms_accepted = true']

  if (hasDiscipline) {
    params.push(disciplineId)
    conditions.push(`cat.discipline_id = $${params.length}`)
  }

  if (hasCategory) {
    params.push(categoryName!.trim())
    const i = params.length
    conditions.push(
      `(cat.name ILIKE $${i} OR COALESCE(cat.name_en, '') ILIKE $${i} OR COALESCE(cat.name_ar, '') ILIKE $${i})`,
    )
  }

  if (hasSubCategory) {
    params.push(subCategoryName!.trim())
    const i = params.length
    conditions.push(
      `(sc.name ILIKE $${i} OR COALESCE(sc.name_en, '') ILIKE $${i} OR COALESCE(sc.name_ar, '') ILIKE $${i})`,
    )
  }

  const result = await dbQuery<{ id: string }>(
    `
    SELECT DISTINCT c.id
    FROM candidates c
    INNER JOIN skills s ON c.primary_skill_id = s.id
    INNER JOIN subcategories sc ON s.sub_category_id = sc.id
    INNER JOIN categories cat ON sc.category_id = cat.id
    WHERE ${conditions.join(' AND ')}
    ORDER BY c.id DESC
    `,
    params,
  )
  return result.rows.map((row) => Number(row.id))
}

/** Candidates whose job preference work type matches (or is "any"). */
export async function getCandidateIdsForJobType(workType: string): Promise<number[]> {
  const result = await dbQuery<{ id: string }>(
    `
    SELECT id FROM candidates
    WHERE terms_accepted = true
      AND (job_preferences_work_type = $1 OR job_preferences_work_type = 'any')
    ORDER BY id DESC
    `,
    [workType],
  )
  return result.rows.map((row) => Number(row.id))
}
