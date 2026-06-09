import type { Candidate } from '@/payload-types'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import type { ReadyBotPayloadContext } from './payloadTool'
import { createAuditLog } from './auditLogTool'

export type ReadyBotActivityPhase =
  | 'scan'
  | 'screening'
  | 'inbound'
  | 'followup'
  | 'memory'
  | 'review'
  | 'system'

export type ReadyBotActivityStatus = 'started' | 'running' | 'success' | 'skipped' | 'error'

export type ReadyBotActivityMeta = {
  phase: ReadyBotActivityPhase
  step: string
  status: ReadyBotActivityStatus
  candidateLabel?: string
  workflowRunId?: string
  workflowName?: string
  stepIndex?: number
  detail?: Record<string, unknown>
}

export type LogReadyBotActivityInput = {
  phase: ReadyBotActivityPhase
  /** Human-readable step label shown in the live feed */
  step: string
  /** Tool / workflow module name */
  toolUsed: string
  status: ReadyBotActivityStatus
  candidateId?: string | number
  candidate?: Candidate | null
  candidateLabel?: string
  screeningTaskId?: string | number
  modelUsed?: string
  confidence?: number
  detail?: Record<string, unknown>
  errorMessage?: string
}

export function resolveActivityCandidateLabel(
  candidate?: Candidate | null,
  candidateId?: string | number,
  explicit?: string,
): string | undefined {
  if (explicit) return explicit
  if (candidate) return candidateLabelFromDoc(candidate)
  if (candidateId != null) return `Candidate #${candidateId}`
  return undefined
}

/** Structured audit row for the ReadyBot live ops feed */
export async function logReadyBotActivity(
  ctx: ReadyBotPayloadContext,
  input: LogReadyBotActivityInput,
) {
  const candidateLabel = resolveActivityCandidateLabel(
    input.candidate,
    input.candidateId,
    input.candidateLabel,
  )

  const workflowRunId = input.detail?.workflowRunId as string | undefined
  const workflowName = input.detail?.workflowName as string | undefined
  const stepIndex = input.detail?.stepIndex as number | undefined
  const { workflowRunId: _w, workflowName: _n, stepIndex: _s, ...restDetail } = input.detail ?? {}

  const meta: ReadyBotActivityMeta = {
    phase: input.phase,
    step: input.step,
    status: input.status,
    candidateLabel,
    workflowRunId,
    workflowName,
    stepIndex,
    detail: {
      ...restDetail,
      ...(input.errorMessage ? { error: input.errorMessage } : {}),
    },
  }

  return createAuditLog(ctx, {
    action: 'readybot_activity',
    candidateId: input.candidateId,
    screeningTaskId: input.screeningTaskId,
    toolUsed: input.toolUsed,
    modelUsed: input.modelUsed,
    confidence: input.confidence,
    reason: input.step,
    afterData: meta,
  })
}
