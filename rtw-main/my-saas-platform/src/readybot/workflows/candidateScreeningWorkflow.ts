/** Entry: full CV → role fit → screening result → outreach (all phases). */
import type { ScreeningState } from '../types/ScreeningState'
import { getReadyBotPayload } from '../lib/getReadyBotPayload'
import { createWorkflowTrace } from '../tools/workflowTrace'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import { getCandidate } from '../tools/payloadTool'
import { runFullScreeningWorkflow, type FullScreeningOptions } from './fullScreeningWorkflow'
import { runScreeningGraph } from './screeningGraph'

export async function runCandidateScreeningWorkflow(
  candidateId: string | number,
  options?: FullScreeningOptions,
): Promise<ScreeningState> {
  if (process.env.READYBOT_USE_LANGGRAPH === '1') {
    return runScreeningGraph({ candidateId, ...options })
  }

  const payload = await getReadyBotPayload()
  const ctx = { payload }
  if (!options?.trace) {
    try {
      const candidate = await getCandidate(ctx, candidateId)
      const trace = createWorkflowTrace(ctx, {
        workflowName: 'candidateScreening',
        phase: 'screening',
        candidateId,
        candidateLabel: candidateLabelFromDoc(candidate),
      })
      return runFullScreeningWorkflow(candidateId, { ...options, trace })
    } catch {
      return runFullScreeningWorkflow(candidateId, options)
    }
  }
  return runFullScreeningWorkflow(candidateId, options)
}
