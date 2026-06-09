import { randomUUID } from 'crypto'
import type { ReadyBotPayloadContext } from './payloadTool'
import {
  logReadyBotActivity,
  type LogReadyBotActivityInput,
  type ReadyBotActivityPhase,
} from './activityLog'
import { formatPayloadError, readyBotTerminalError } from './terminalLog'

type SharedTraceState = {
  runId: string
  stepRef: { n: number }
}

export type CreateWorkflowTraceInput = {
  workflowName: string
  phase: ReadyBotActivityPhase
  candidateId?: string | number
  candidateLabel?: string
  screeningTaskId?: string | number
  /** Reuse run id + step counter (e.g. scan batch → per candidate) */
  shared?: SharedTraceState
}

/**
 * Correlated step-by-step logger for a single ReadyBot workflow run.
 * All steps share workflowRunId; stepIndex increments across the full run.
 */
export class WorkflowTrace {
  readonly runId: string
  readonly workflowName: string
  readonly defaultPhase: ReadyBotActivityPhase
  candidateId?: string | number
  candidateLabel?: string
  screeningTaskId?: string | number
  private readonly stepRef: { n: number }

  constructor(
    private readonly ctx: ReadyBotPayloadContext,
    input: CreateWorkflowTraceInput,
  ) {
    this.workflowName = input.workflowName
    this.defaultPhase = input.phase
    this.candidateId = input.candidateId
    this.candidateLabel = input.candidateLabel
    this.screeningTaskId = input.screeningTaskId
    if (input.shared) {
      this.runId = input.shared.runId
      this.stepRef = input.shared.stepRef
    } else {
      this.runId = randomUUID()
      this.stepRef = { n: 0 }
    }
  }

  private nextStepIndex(): number {
    return ++this.stepRef.n
  }

  /** Log a workflow step without executing code */
  async log(
    input: Omit<LogReadyBotActivityInput, 'candidateId' | 'candidateLabel' | 'detail' | 'phase'> & {
      phase?: ReadyBotActivityPhase
      detail?: Record<string, unknown>
    },
  ) {
    const stepIndex = this.nextStepIndex()
    return logReadyBotActivity(this.ctx, {
      ...input,
      phase: input.phase ?? this.defaultPhase,
      candidateId: this.candidateId,
      candidateLabel: this.candidateLabel,
      screeningTaskId: this.screeningTaskId,
      detail: {
        workflowRunId: this.runId,
        workflowName: this.workflowName,
        stepIndex,
        ...input.detail,
      },
    })
  }

  /** Log start → run fn → log success or error (re-throws) */
  async runTool<T>(opts: {
    phase?: ReadyBotActivityPhase
    step: string
    toolUsed: string
    fn: () => Promise<T>
    detail?: Record<string, unknown>
    resultDetail?: (result: T) => Record<string, unknown> | undefined
  }): Promise<T> {
    const phase = opts.phase ?? this.defaultPhase
    const startIndex = this.nextStepIndex()
    await logReadyBotActivity(this.ctx, {
      phase,
      step: opts.step,
      toolUsed: opts.toolUsed,
      status: 'started',
      candidateId: this.candidateId,
      candidateLabel: this.candidateLabel,
      screeningTaskId: this.screeningTaskId,
      detail: {
        workflowRunId: this.runId,
        workflowName: this.workflowName,
        stepIndex: startIndex,
        ...opts.detail,
      },
    })
    try {
      const result = await opts.fn()
      const doneIndex = this.nextStepIndex()
      await logReadyBotActivity(this.ctx, {
        phase,
        step: `${opts.step} ✓`,
        toolUsed: opts.toolUsed,
        status: 'success',
        candidateId: this.candidateId,
        candidateLabel: this.candidateLabel,
        screeningTaskId: this.screeningTaskId,
        detail: {
          workflowRunId: this.runId,
          workflowName: this.workflowName,
          stepIndex: doneIndex,
          ...opts.resultDetail?.(result),
        },
      })
      return result
    } catch (e) {
      const errIndex = this.nextStepIndex()
      const msg = e instanceof Error ? e.message : String(e)
      readyBotTerminalError(`Step failed: ${opts.step}`, e, {
        toolUsed: opts.toolUsed,
        candidateId: this.candidateId,
        candidateLabel: this.candidateLabel,
        workflowRunId: this.runId,
        payloadDetail: formatPayloadError(e),
      })
      await logReadyBotActivity(this.ctx, {
        phase,
        step: `${opts.step} ✗`,
        toolUsed: opts.toolUsed,
        status: 'error',
        candidateId: this.candidateId,
        candidateLabel: this.candidateLabel,
        screeningTaskId: this.screeningTaskId,
        errorMessage: msg,
        detail: {
          workflowRunId: this.runId,
          workflowName: this.workflowName,
          stepIndex: errIndex,
        },
      })
      throw e
    }
  }

  /** Same run id + step counter, different candidate (scan batch) */
  forCandidate(candidateId: string | number, candidateLabel: string): WorkflowTrace {
    return new WorkflowTrace(this.ctx, {
      workflowName: this.workflowName,
      phase: this.defaultPhase,
      candidateId,
      candidateLabel,
      screeningTaskId: this.screeningTaskId,
      shared: { runId: this.runId, stepRef: this.stepRef },
    })
  }

  sharedState(): SharedTraceState {
    return { runId: this.runId, stepRef: this.stepRef }
  }
}

export function createWorkflowTrace(
  ctx: ReadyBotPayloadContext,
  input: CreateWorkflowTraceInput,
): WorkflowTrace {
  return new WorkflowTrace(ctx, input)
}
