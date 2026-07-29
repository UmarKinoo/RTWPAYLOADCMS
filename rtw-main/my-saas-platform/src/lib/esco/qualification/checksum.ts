import crypto from 'crypto'
import type { EscoOccupationDetail } from '../occupation'

/**
 * Stable checksum of the occupation data used to generate a qualification
 * template. When ESCO updates the title, description, or skill links, the
 * checksum changes and the template is regenerated.
 */
export function occupationChecksum(occupation: EscoOccupationDetail): string {
  const skillUris = [
    ...occupation.essentialSkills.map((s) => s.uri),
    ...occupation.optionalSkills.map((s) => s.uri),
  ]
    .filter(Boolean)
    .sort()

  const payload = JSON.stringify({
    title: occupation.preferredLabel.trim().toLowerCase(),
    description: occupation.description.trim().toLowerCase(),
    skills: skillUris,
  })

  return crypto.createHash('sha256').update(payload).digest('hex')
}
