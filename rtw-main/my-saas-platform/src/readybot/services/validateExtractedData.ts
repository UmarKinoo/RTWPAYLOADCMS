import type { CandidateExtraction } from '../types/CandidateExtraction'
import { EXTRACTION_CONFIDENCE_THRESHOLD } from '../types/CandidateExtraction'
import { filterSafeExtractedFields } from '../tools/permissionTool'

export type ValidationResult = {
  canAutoApply: boolean
  needsHumanReview: boolean
  reasons: string[]
}

export function validateExtractedData(extraction: CandidateExtraction): ValidationResult {
  const reasons: string[] = []

  if (extraction.needsHumanReview) {
    reasons.push(extraction.reason || 'LLM flagged human review')
  }
  if (extraction.confidence < EXTRACTION_CONFIDENCE_THRESHOLD) {
    reasons.push(`Confidence ${extraction.confidence} below ${EXTRACTION_CONFIDENCE_THRESHOLD}`)
  }

  const permission = filterSafeExtractedFields(extraction.fields)
  if (!permission.allowed) {
    reasons.push(permission.reason)
  }

  const needsHumanReview = reasons.length > 0 || extraction.needsHumanReview
  const canAutoApply = !needsHumanReview && permission.allowed

  return { canAutoApply, needsHumanReview, reasons }
}
