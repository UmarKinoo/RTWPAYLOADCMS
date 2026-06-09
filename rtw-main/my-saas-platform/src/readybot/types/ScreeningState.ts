import type { CandidateExtraction } from './CandidateExtraction'
import type { RoleFitResult } from './RoleFitResult'

export type ScreeningChannel = 'whatsapp' | 'email'

export type ScreeningNextAction =
  | 'send_message'
  | 'wait_for_reply'
  | 'update_profile'
  | 'human_review'
  | 'follow_up'
  | 'stop'

export type ScreeningState = {
  candidateId: string
  jobPostingId?: string
  targetRoleTitle?: string
  taskId?: string
  screeningResultId?: string | number
  channel?: ScreeningChannel
  candidateProfile?: Record<string, unknown>
  persistentMemory?: Record<string, unknown>
  cvSummary?: string
  roleFit?: RoleFitResult
  latestMessage?: string
  missingFields: string[]
  extractedData?: CandidateExtraction
  confidenceScore?: number
  nextAction?: ScreeningNextAction
  auditTrail: Array<Record<string, unknown>>
}
