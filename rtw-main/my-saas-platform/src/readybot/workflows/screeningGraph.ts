/**
 * LangGraph orchestration for ReadyBot screening (wraps fullScreeningWorkflow nodes).
 */
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import type { ScreeningState } from '../types/ScreeningState'
import { getReadyBotPayload } from '../lib/getReadyBotPayload'
import { createWorkflowTrace } from '../tools/workflowTrace'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import { getCandidate } from '../tools/payloadTool'
import { runFullScreeningWorkflow, type FullScreeningOptions } from './fullScreeningWorkflow'

const GraphState = Annotation.Root({
  candidateId: Annotation<string>,
  jobPostingId: Annotation<string | undefined>,
  targetRoleTitle: Annotation<string | undefined>,
  skipOutbound: Annotation<boolean | undefined>,
  result: Annotation<ScreeningState | undefined>,
})

async function runPipelineNode(
  state: typeof GraphState.State,
): Promise<Partial<typeof GraphState.State>> {
  const payload = await getReadyBotPayload()
  const ctx = { payload }
  const candidate = await getCandidate(ctx, state.candidateId)
  const trace = createWorkflowTrace(ctx, {
    workflowName: 'langgraphScreening',
    phase: 'screening',
    candidateId: state.candidateId,
    candidateLabel: candidateLabelFromDoc(candidate),
  })

  await trace.log({
    step: 'LangGraph node: runFullPipeline',
    toolUsed: 'screeningGraph',
    status: 'started',
  })

  const options: FullScreeningOptions = {
    jobPostingId: state.jobPostingId,
    targetRoleTitle: state.targetRoleTitle,
    skipOutbound: state.skipOutbound,
    trace,
  }
  const result = await runFullScreeningWorkflow(state.candidateId, options)

  await trace.log({
    step: 'LangGraph node finished',
    toolUsed: 'screeningGraph',
    status: 'success',
    detail: { nextAction: result.nextAction },
  })

  return { result }
}

const builder = new StateGraph(GraphState)
  .addNode('runFullPipeline', runPipelineNode)
  .addEdge(START, 'runFullPipeline')
  .addEdge('runFullPipeline', END)

const compiled = builder.compile()

export async function runScreeningGraph(input: {
  candidateId: string | number
  jobPostingId?: string | number
  targetRoleTitle?: string
  skipOutbound?: boolean
}): Promise<ScreeningState> {
  const out = await compiled.invoke({
    candidateId: String(input.candidateId),
    jobPostingId: input.jobPostingId != null ? String(input.jobPostingId) : undefined,
    targetRoleTitle: input.targetRoleTitle,
    skipOutbound: input.skipOutbound,
    result: undefined,
  })
  return out.result!
}
