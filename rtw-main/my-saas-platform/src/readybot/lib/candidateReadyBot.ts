import type { Candidate } from '@/payload-types'
import type { Where } from 'payload'

export type ReadyBotCandidateFields = {
  /** @deprecated Not used — pipeline includes all candidates unless opted_out */
  readyBotEnabled?: boolean | null
  screeningStatus?: string | null
  missingFields?: { field: string; id?: string | null }[] | null
  whatsappNumber?: string | null
  whatsappOptIn?: boolean | null
  whatsappOptInAt?: string | null
  preferredContactChannel?: 'whatsapp' | 'email' | 'none' | null
  lastScreenedAt?: string | null
  lastContactedAt?: string | null
  lastReplyAt?: string | null
  screeningSummary?: string | null
  screeningConfidence?: number | null
}

export function getReadyBotFields(candidate: Candidate): ReadyBotCandidateFields {
  const rb = (candidate as Candidate & { readyBot?: ReadyBotCandidateFields }).readyBot
  return rb ?? {}
}

/** Only opted-out candidates are excluded from scans and outreach. */
export function isExcludedFromReadyBot(candidate: Candidate): boolean {
  return getReadyBotFields(candidate).screeningStatus === 'opted_out'
}

/** Payload filter: all candidates except explicit WhatsApp STOP / opt-out. */
export function readyBotActiveWhere(): Where {
  return {
    or: [
      { 'readyBot.screeningStatus': { exists: false } },
      { 'readyBot.screeningStatus': { not_equals: 'opted_out' } },
    ],
  }
}

/** E.164 WhatsApp number: explicit readyBot.whatsappNumber, then legacy `whatsapp`, then phone. */
export function resolveWhatsAppNumber(candidate: Candidate): string | null {
  const rb = getReadyBotFields(candidate)
  const explicit = rb.whatsappNumber?.trim()
  if (explicit) return explicit
  const legacy = candidate.whatsapp?.trim()
  if (legacy) return legacy
  return candidate.phone?.trim() || null
}
