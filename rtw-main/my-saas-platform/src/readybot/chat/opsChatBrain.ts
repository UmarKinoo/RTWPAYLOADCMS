/**
 * LangGraph brain for ops chat — classifies intent and pre-runs tools before streamText responds.
 * UI streaming is still handled by Vercel AI SDK; this graph supplies live tool context.
 */
import { Annotation, END, START, StateGraph } from '@langchain/langgraph'
import type { Payload } from 'payload'
import {
  executeAggregateCandidates,
  executeFindCandidate,
  executeGetCandidateProfile,
  executeGetPipelineStats,
  executeListPendingReviews,
  executeRunScan,
  type CandidateGroupDimension,
} from './toolActions'
import { isExplicitRunScanRequest, isVagueUserMessage } from './chatGuards'

export type OpsChatIntent = 'scan' | 'query' | 'profile' | 'chat'

const BrainState = Annotation.Root({
  userMessage: Annotation<string>,
  intent: Annotation<OpsChatIntent | undefined>,
  toolResults: Annotation<Record<string, unknown>>,
  summary: Annotation<string>,
})

function classifyIntent(message: string): OpsChatIntent {
  const m = message.toLowerCase()
  if (/\b(run scan|start scan|trigger scan|scan candidates|scan now|pnpm readybot:scan)\b/.test(m)) {
    return 'scan'
  }
  if (
    /\b(pending review|human review|find candidate|search candidate|pipeline stats|active task|how many|breakdown|distribution|count|per\s+\w+|grouped? by)\b/.test(
      m,
    )
  ) {
    return 'query'
  }
  if (
    /\b(update profile|update job title|change job title|change primary skill|set job title|edit candidate|modify profile|update candidate)\b/.test(
      m,
    )
  ) {
    return 'profile'
  }
  return 'chat'
}

/** Breakdown dimension mentioned in an aggregate-style question, if any. */
function detectGroupByDimension(message: string): CandidateGroupDimension | null {
  const m = message.toLowerCase()
  if (!/\b(how many|count|breakdown|distribution|per|by|grouped)\b/.test(m)) return null
  if (/\bdisciplines?\b/.test(m)) return 'discipline'
  if (/\bsub.?categor/.test(m)) return 'subcategory'
  if (/\bcategor/.test(m)) return 'category'
  if (/\bskills?\b/.test(m)) return 'primarySkill'
  if (/\b(screening\s+)?status(es)?\b/.test(m)) return 'screeningStatus'
  if (/\bnationalit/.test(m)) return 'nationality'
  if (/\b(location|city|cities)\b/.test(m)) return 'location'
  if (/\bgender\b/.test(m)) return 'gender'
  if (/\bvisa\b/.test(m)) return 'visaStatus'
  if (/\bbilling\b/.test(m)) return 'billingClass'
  return null
}

function extractCandidateQuery(message: string): string | null {
  const quoted = message.match(/["']([^"']+)["']/)
  if (quoted?.[1]) return quoted[1]
  const forNamed = message.match(/\bfor\s+([A-Za-z][\w\s.-]{1,40})/i)
  if (forNamed?.[1]) return forNamed[1].trim()
  const named = message.match(/(?:find|search|look up|candidate)\s+([A-Za-z][\w\s.-]{1,40})/i)
  return named?.[1]?.trim() ?? null
}

async function classifyNode(
  state: typeof BrainState.State,
): Promise<Partial<typeof BrainState.State>> {
  return { intent: classifyIntent(state.userMessage), toolResults: {} }
}

async function executeToolsNode(
  state: typeof BrainState.State,
  payload: Payload,
  locale: string,
): Promise<Partial<typeof BrainState.State>> {
  const toolResults: Record<string, unknown> = {}

  if (
    state.intent === 'scan' &&
    isExplicitRunScanRequest(state.userMessage) &&
    !isVagueUserMessage(state.userMessage)
  ) {
    toolResults.runScan = await executeRunScan()
  }

  if (state.intent === 'query') {
    const groupBy = detectGroupByDimension(state.userMessage)
    const [stats, reviews] = await Promise.all([
      executeGetPipelineStats(payload),
      executeListPendingReviews(payload, 8),
    ])
    toolResults.pipelineStats = stats
    toolResults.pendingReviews = reviews

    if (groupBy) {
      toolResults.aggregateCandidates = await executeAggregateCandidates({ groupBy })
    } else {
      const q = extractCandidateQuery(state.userMessage)
      if (q) {
        toolResults.findCandidate = await executeFindCandidate(payload, q)
      }
    }
  }

  if (state.intent === 'profile') {
    const q = extractCandidateQuery(state.userMessage)
    if (q) {
      const found = await executeFindCandidate(payload, q)
      toolResults.findCandidate = found
      const first = found.candidates[0]
      if (first && typeof first.id === 'number') {
        toolResults.getCandidateProfile = await executeGetCandidateProfile(
          payload,
          first.id,
          locale,
        )
      }
    }
  }

  return { toolResults }
}

async function summarizeNode(
  state: typeof BrainState.State,
): Promise<Partial<typeof BrainState.State>> {
  if (state.intent === 'chat' || Object.keys(state.toolResults).length === 0) {
    return { summary: '' }
  }
  const summary = `[LangGraph brain — pre-fetched tool results]\n${JSON.stringify(state.toolResults, null, 2)}`
  return { summary }
}

export function buildOpsChatBrainGraph(payload: Payload, locale: string) {
  return new StateGraph(BrainState)
    .addNode('classify', classifyNode)
    .addNode('execute_tools', (state) => executeToolsNode(state, payload, locale))
    .addNode('summarize', summarizeNode)
    .addEdge(START, 'classify')
    .addEdge('classify', 'execute_tools')
    .addEdge('execute_tools', 'summarize')
    .addEdge('summarize', END)
    .compile()
}

export async function runOpsChatBrain(
  payload: Payload,
  userMessage: string,
  locale = 'en',
): Promise<{ intent: OpsChatIntent; summary: string; toolResults: Record<string, unknown> }> {
  const graph = buildOpsChatBrainGraph(payload, locale)
  const out = await graph.invoke({
    userMessage,
    intent: undefined,
    toolResults: {},
    summary: '',
  })
  return {
    intent: out.intent ?? 'chat',
    summary: out.summary ?? '',
    toolResults: out.toolResults ?? {},
  }
}
