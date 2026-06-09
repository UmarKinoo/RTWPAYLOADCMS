import type { Candidate } from '@/payload-types'
import type { ReadyBotCandidateRef } from './dashboard-types'

export function startOfTodayIso(): string {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d.toISOString()
}

export function relId(
  value: string | number | { id?: string | number } | null | undefined,
): string | null {
  if (value == null) return null
  if (typeof value === 'object') return value.id != null ? String(value.id) : null
  return String(value)
}

export function previewText(text: string | null | undefined, max = 120): string | null {
  if (!text?.trim()) return null
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

export function candidateLabelFromDoc(
  candidate: Candidate | number | string | null | undefined,
): string {
  if (candidate == null) return 'Unknown'
  if (typeof candidate === 'string' || typeof candidate === 'number') return `Candidate #${candidate}`
  const c = candidate as Candidate
  const name = [c.firstName, c.lastName].filter(Boolean).join(' ').trim()
  if (name) return name
  if (c.email) return c.email
  if (c.jobTitle) return c.jobTitle
  return `Candidate #${c.id}`
}

export function toCandidateRef(
  candidate: Candidate | number | string | null | undefined,
): ReadyBotCandidateRef {
  if (candidate == null) {
    return { id: '', label: 'Unknown' }
  }
  if (typeof candidate === 'string' || typeof candidate === 'number') {
    return { id: String(candidate), label: `Candidate #${candidate}` }
  }
  const c = candidate as Candidate & {
    readyBot?: {
      screeningStatus?: string | null
      readyBotEnabled?: boolean | null
    }
  }
  return {
    id: String(c.id),
    label: candidateLabelFromDoc(c),
    screeningStatus: c.readyBot?.screeningStatus ?? null,
    readyBotEnabled: c.readyBot?.readyBotEnabled ?? null,
  }
}
