'use server'

import type { CandidateDetail } from '@/types/candidate'
import { getCandidateById } from '@/lib/payload/candidates'

/**
 * Loads a single candidate for the public profile page.
 * Runs against Payload via `getPayload` (local SDK) — not HTTP to `/api/*`.
 */
export async function getCandidateDetail(
  id: number,
  locale: string,
): Promise<CandidateDetail | null> {
  return getCandidateById(id, locale)
}
