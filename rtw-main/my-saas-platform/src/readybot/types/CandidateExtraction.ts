/** Strict JSON shape returned by LLM extraction (Phase 3+). */
export type CandidateExtraction = {
  fields: Record<string, string | number | boolean | null>
  confidence: number
  missingFieldsStillNeeded: string[]
  needsHumanReview: boolean
  reason: string
}

export const EXTRACTION_CONFIDENCE_THRESHOLD = 0.85
