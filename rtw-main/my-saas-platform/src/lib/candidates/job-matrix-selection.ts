import type { Candidate } from '@/payload-types'

type NamedTaxonomy = {
  name?: string
  name_en?: string | null
  name_ar?: string | null
}

export function localizedTaxonomyName(
  doc: NamedTaxonomy | null | undefined,
  locale: string,
): string | null {
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

export type JobMatrixPath = {
  discipline: string
  category: string
  subCategory: string
  skill: string
  careerPathway: string
}

const GROUP_TEXT_LABELS: Record<string, keyof Omit<JobMatrixPath, 'careerPathway'>> = {
  'Major Discipline': 'discipline',
  Category: 'category',
  Subcategory: 'subCategory',
  Skill: 'skill',
}

/** Parse `group_text` stored on skills, e.g. `Major Discipline: X | Category: Y | ...` */
export function jobMatrixPathFromGroupText(groupText: string): JobMatrixPath {
  const empty: JobMatrixPath = {
    discipline: '',
    category: '',
    subCategory: '',
    skill: '',
    careerPathway: '',
  }

  const trimmed = groupText.trim()
  if (!trimmed) return empty

  const path: JobMatrixPath = { ...empty }

  for (const part of trimmed.split('|')) {
    const segment = part.trim()
    const colon = segment.indexOf(':')
    if (colon === -1) continue

    const label = segment.slice(0, colon).trim()
    const value = segment.slice(colon + 1).trim()
    const field = GROUP_TEXT_LABELS[label]
    if (field && value) {
      path[field] = value
    }
  }

  const careerParts = [path.discipline, path.category, path.subCategory, path.skill].filter(Boolean)
  if (careerParts.length > 0) {
    path.careerPathway = careerParts.join(', ')
  }

  return path
}

function isDegeneratePathway(pathway: string): boolean {
  const parts = pathway.split(', ').filter(Boolean)
  return parts.length > 1 && new Set(parts).size === 1
}

/**
 * Resolve job matrix path from primary skill, falling back to skill `group_text`
 * when taxonomy relationships are not populated.
 */
export function jobMatrixPathWithFallback(
  primarySkill: Candidate['primarySkill'],
  locale = 'en',
): JobMatrixPath {
  const matrix = jobMatrixPathFromPrimarySkill(primarySkill, locale)
  const groupText =
    typeof primarySkill === 'object' && primarySkill?.group_text
      ? String(primarySkill.group_text).trim()
      : ''

  if (!groupText) return matrix

  const fromGroup = jobMatrixPathFromGroupText(groupText)
  if (!fromGroup.careerPathway) return matrix

  if (
    !matrix.discipline ||
    isDegeneratePathway(matrix.careerPathway) ||
    !matrix.careerPathway
  ) {
    return fromGroup
  }

  return matrix
}

/**
 * Job matrix path from primary skill: discipline → category → subcategory → skill.
 */
export function jobMatrixPathFromPrimarySkill(
  primarySkill: Candidate['primarySkill'],
  locale = 'en',
): JobMatrixPath {
  const empty: JobMatrixPath = {
    discipline: '',
    category: '',
    subCategory: '',
    skill: '',
    careerPathway: '',
  }

  if (!primarySkill || typeof primarySkill === 'number') return empty

  const skill = localizedTaxonomyName(primarySkill, locale) || ''
  const sub = primarySkill.subCategory

  if (!sub || typeof sub === 'number') {
    return {
      ...empty,
      skill,
      careerPathway: skill,
    }
  }

  const subCategory = localizedTaxonomyName(sub, locale) || ''
  const cat = sub.category

  if (!cat || typeof cat === 'number') {
    const careerPathway = [subCategory, skill].filter(Boolean).join(', ')
    return {
      discipline: '',
      category: '',
      subCategory,
      skill,
      careerPathway,
    }
  }

  const category = localizedTaxonomyName(cat, locale) || ''
  const disc = cat.discipline

  if (!disc || typeof disc === 'number') {
    const careerPathway = [category, subCategory, skill].filter(Boolean).join(', ')
    return {
      discipline: '',
      category,
      subCategory,
      skill,
      careerPathway,
    }
  }

  const discipline = localizedTaxonomyName(disc, locale) || ''
  const careerPathway = [discipline, category, subCategory, skill].filter(Boolean).join(', ')

  return {
    discipline,
    category,
    subCategory,
    skill,
    careerPathway,
  }
}

export function jobMatrixSelectionFromPrimarySkill(
  primarySkill: Candidate['primarySkill'],
  locale: string,
): string | null {
  const path = jobMatrixPathWithFallback(primarySkill, locale)
  return path.careerPathway || null
}
