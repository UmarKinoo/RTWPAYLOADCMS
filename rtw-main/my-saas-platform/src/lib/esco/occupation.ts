import { unstable_cache } from 'next/cache'
import { escoFetch, EscoUnavailableError } from './client'

export interface EscoSkill {
  uri: string
  label: string
  skillType: 'essential' | 'optional'
}

export interface EscoOccupationDetail {
  uri: string
  preferredLabel: string
  altLabels: string[]
  description: string
  iscoCode?: string
  essentialSkills: EscoSkill[]
  optionalSkills: EscoSkill[]
}

/**
 * ESCO returns localised text either as a plain string or as a
 * `{ literal, mimetype }` object. Always collapse it to a string — rendering the
 * raw object would crash React.
 */
function toText(value: unknown): string {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'literal' in value) {
    const literal = (value as { literal?: unknown }).literal
    return typeof literal === 'string' ? literal : ''
  }
  return ''
}

/** Pick a localised value from an ESCO `{ [language]: ... }` map, falling back to English. */
function pickLocalized(map: unknown, language: string): unknown {
  if (!map || typeof map !== 'object') return undefined
  const record = map as Record<string, unknown>
  return record[language] ?? record['en'] ?? Object.values(record).find((v) => v != null)
}

function pickDescription(raw: Record<string, unknown>, language: string): string {
  return toText(pickLocalized(raw.description, language))
}

function pickAltLabels(raw: Record<string, unknown>, language: string): string[] {
  const value = pickLocalized(raw.alternativeLabel, language)
  if (!Array.isArray(value)) {
    const single = toText(value)
    return single ? [single] : []
  }
  return value.map(toText).filter(Boolean)
}

interface EscoSkillLink {
  uri?: string
  href?: string
  title?: unknown
}

function mapSkills(
  links: unknown,
  skillType: 'essential' | 'optional',
): EscoSkill[] {
  if (!Array.isArray(links)) return []
  return links
    .map((link: EscoSkillLink) => ({
      uri: link.uri ?? '',
      label: toText(link.title),
      skillType,
    }))
    .filter((skill) => skill.uri && skill.label)
}

async function _getOccupation(
  uri: string,
  language: string,
): Promise<EscoOccupationDetail | null> {
  try {
    const data = (await escoFetch('/resource/occupation', {
      uri,
      language,
    })) as Record<string, unknown>

    const links = (data._links ?? {}) as Record<string, unknown>
    const self = links.self as { uri?: string } | undefined
    const iscoGroup = data.iscoGroup as { code?: string } | undefined

    // `title` is already localised by the `language` query parameter;
    // fall back to the preferredLabel map when it is missing.
    const preferredLabel =
      toText(data.title) || toText(pickLocalized(data.preferredLabel, language))

    return {
      uri: toText(data.uri) || self?.uri || uri,
      preferredLabel,
      altLabels: pickAltLabels(data, language),
      description: pickDescription(data, language),
      iscoCode: iscoGroup?.code,
      essentialSkills: mapSkills(links.hasEssentialSkill, 'essential'),
      optionalSkills: mapSkills(links.hasOptionalSkill, 'optional'),
    }
  } catch (err) {
    if (err instanceof EscoUnavailableError) throw err
    console.error('[ESCO occupation] unexpected error:', err)
    return null
  }
}

/**
 * Fetch full occupation details including related skills from ESCO.
 * Cached per (uri + language) for 30 days.
 */
export function getOccupation(
  uri: string,
  language: string,
): Promise<EscoOccupationDetail | null> {
  return unstable_cache(
    () => _getOccupation(uri, language),
    ['esco-occupation', uri, language],
    { tags: ['esco-occupation'], revalidate: 60 * 60 * 24 * 30 },
  )()
}
