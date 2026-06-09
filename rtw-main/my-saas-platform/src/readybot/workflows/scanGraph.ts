/**
 * LangGraph multi-agent scan: supervisor partitions queue → parallel scanner agents → aggregate.
 */
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import type { Candidate } from '@/payload-types'
import { getReadyBotFields, isExcludedFromReadyBot } from '../lib/candidateReadyBot'
import { hasNoMissingFields } from '../services/detectMissingFields'
import { runCandidateScreeningWorkflow } from './candidateScreeningWorkflow'
import type { WorkflowTrace } from '../tools/workflowTrace'
import { readyBotTerminalLog, readyBotTerminalError } from '../tools/terminalLog'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'

export type ScanGraphInput = {
  candidates: Candidate[]
  parallelAgentCount: number
  jobPostingId?: string | number
  batchTrace: WorkflowTrace
}

export type ScanGraphResult = {
  scanned: number
  tasksCreated: number
  errors: string[]
}

type AgentBucket = {
  agentId: number
  candidates: Candidate[]
}

const ScanState = Annotation.Root({
  candidates: Annotation<Candidate[]>,
  parallelAgentCount: Annotation<number>,
  jobPostingId: Annotation<string | number | undefined>,
  buckets: Annotation<AgentBucket[]>,
  scanned: Annotation<number>,
  tasksCreated: Annotation<number>,
  errors: Annotation<string[]>,
  batchTrace: Annotation<WorkflowTrace>,
})

function distributeCandidates(candidates: Candidate[], agentCount: number): AgentBucket[] {
  const n = Math.max(1, Math.min(agentCount, candidates.length || 1))
  const buckets: AgentBucket[] = Array.from({ length: n }, (_, agentId) => ({
    agentId,
    candidates: [],
  }))
  candidates.forEach((c, i) => {
    buckets[i % n].candidates.push(c)
  })
  return buckets.filter((b) => b.candidates.length > 0)
}

async function supervisorNode(
  state: typeof ScanState.State,
): Promise<Partial<typeof ScanState.State>> {
  const buckets = distributeCandidates(state.candidates, state.parallelAgentCount)
  await state.batchTrace.log({
    step: 'LangGraph supervisor: partition queue',
    toolUsed: 'scanGraph.supervisor',
    status: 'success',
    detail: {
      queueSize: state.candidates.length,
      agentCount: buckets.length,
      buckets: buckets.map((b) => ({
        agentId: b.agentId,
        size: b.candidates.length,
      })),
    },
  })
  readyBotTerminalLog('LangGraph supervisor partitioned queue', {
    agents: buckets.length,
    queueSize: state.candidates.length,
  })
  return { buckets, scanned: 0, tasksCreated: 0, errors: [] }
}

async function parallelAgentsNode(
  state: typeof ScanState.State,
): Promise<Partial<typeof ScanState.State>> {
  let scanned = 0
  let tasksCreated = 0
  const errors: string[] = []

  const runAgent = async (bucket: AgentBucket) => {
    const agentResults = { scanned: 0, tasksCreated: 0, errors: [] as string[] }

    await state.batchTrace.log({
      step: `Scanner agent ${bucket.agentId} started`,
      toolUsed: 'scanGraph.agent',
      status: 'started',
      detail: { agentId: bucket.agentId, assigned: bucket.candidates.length },
    })

    for (const doc of bucket.candidates) {
      agentResults.scanned++
      const label = candidateLabelFromDoc(doc)
      const trace = state.batchTrace.forCandidate(doc.id, label)
      const rb = getReadyBotFields(doc)

      if (isExcludedFromReadyBot(doc)) {
        await trace.log({
          step: 'Skipped — candidate opted out',
          toolUsed: 'scanGraph.agent',
          status: 'skipped',
          detail: { agentId: bucket.agentId },
        })
        continue
      }
      if (hasNoMissingFields(doc)) {
        await trace.log({
          step: 'Skipped — profile complete',
          toolUsed: 'scanGraph.agent',
          status: 'skipped',
          detail: { agentId: bucket.agentId },
        })
        continue
      }

      try {
        const result = await trace.runTool({
          step: `Agent ${bucket.agentId}: run screening workflow`,
          toolUsed: 'runCandidateScreeningWorkflow',
          fn: () =>
            runCandidateScreeningWorkflow(doc.id, {
              jobPostingId: state.jobPostingId,
              skipOutbound: !!process.env.READYBOT_SKIP_OUTBOUND,
              trace,
            }),
          detail: { agentId: bucket.agentId, screeningStatus: rb.screeningStatus ?? 'unknown' },
          resultDetail: (s) => ({
            agentId: bucket.agentId,
            nextAction: s.nextAction,
            taskId: s.taskId,
          }),
        })
        if (result.taskId && result.nextAction !== 'stop') agentResults.tasksCreated++
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        agentResults.errors.push(`agent ${bucket.agentId} candidate ${doc.id} (${label}): ${msg}`)
        readyBotTerminalError(`Agent ${bucket.agentId} failed: ${label}`, e, {
          candidateId: doc.id,
        })
      }
    }

    await state.batchTrace.log({
      step: `Scanner agent ${bucket.agentId} finished`,
      toolUsed: 'scanGraph.agent',
      status: agentResults.errors.length ? 'error' : 'success',
      detail: {
        agentId: bucket.agentId,
        scanned: agentResults.scanned,
        tasksCreated: agentResults.tasksCreated,
        errors: agentResults.errors.length,
      },
    })

    return agentResults
  }

  const results = await Promise.all(state.buckets.map(runAgent))
  for (const r of results) {
    scanned += r.scanned
    tasksCreated += r.tasksCreated
    errors.push(...r.errors)
  }

  return { scanned, tasksCreated, errors }
}

async function aggregateNode(
  state: typeof ScanState.State,
): Promise<Partial<typeof ScanState.State>> {
  await state.batchTrace.log({
    step: 'LangGraph aggregate: scan batch complete',
    toolUsed: 'scanGraph.aggregate',
    status: state.errors.length ? 'error' : 'success',
    detail: {
      scanned: state.scanned,
      tasksCreated: state.tasksCreated,
      errorCount: state.errors.length,
      agentCount: state.buckets.length,
    },
  })
  return {}
}

const builder = new StateGraph(ScanState)
  .addNode('supervisor', supervisorNode)
  .addNode('parallel_agents', parallelAgentsNode)
  .addNode('aggregate', aggregateNode)
  .addEdge(START, 'supervisor')
  .addEdge('supervisor', 'parallel_agents')
  .addEdge('parallel_agents', 'aggregate')
  .addEdge('aggregate', END)

const compiled = builder.compile()

export async function runLangGraphScan(input: ScanGraphInput): Promise<ScanGraphResult> {
  const out = await compiled.invoke({
    candidates: input.candidates,
    parallelAgentCount: input.parallelAgentCount,
    jobPostingId: input.jobPostingId,
    buckets: [],
    scanned: 0,
    tasksCreated: 0,
    errors: [],
    batchTrace: input.batchTrace,
  })
  return {
    scanned: out.scanned,
    tasksCreated: out.tasksCreated,
    errors: out.errors,
  }
}
