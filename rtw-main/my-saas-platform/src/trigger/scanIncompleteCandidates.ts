/**
 * Trigger.dev job (Phase 2): schedule every 10–15 minutes.
 * Phase 1: run via `pnpm readybot:scan`
 */
import { getReadyBotPayload } from '@/readybot/lib/getReadyBotPayload'
import {
  getReadyBotFields,
  isExcludedFromReadyBot,
  readyBotActiveWhere,
} from '@/readybot/lib/candidateReadyBot'
import { runCandidateScreeningWorkflow } from '@/readybot/workflows/candidateScreeningWorkflow'
import { runLangGraphScan } from '@/readybot/workflows/scanGraph'
import { hasNoMissingFields } from '@/readybot/services/detectMissingFields'
import { createWorkflowTrace } from '@/readybot/tools/workflowTrace'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import { loadReadyBotSettings, recordAutomatedScanRun, shouldRunScheduledScan } from '@/lib/readybot/settings'
import { readyBotTerminalLog, readyBotTerminalError } from '@/readybot/tools/terminalLog'
import type { Candidate } from '@/payload-types'
import type { ReadyBotRuntimeSettings } from '@/lib/readybot/settings'

const SCREENING_STATUSES_TO_SCAN = ['new', 'incomplete', 'contacted', 'info_received'] as const

async function fetchScanQueue(payload: Awaited<ReturnType<typeof getReadyBotPayload>>) {
  const limit = process.env.READYBOT_SCAN_LIMIT ? parseInt(process.env.READYBOT_SCAN_LIMIT) : 50
  return payload.find({
    collection: 'candidates',
    where: {
      and: [
        readyBotActiveWhere(),
        {
          or: [
            ...SCREENING_STATUSES_TO_SCAN.map((status) => ({
              'readyBot.screeningStatus': { equals: status },
            })),
            { 'readyBot.screeningStatus': { exists: false } },
          ],
        },
      ],
    },
    limit,
    depth: 0,
    overrideAccess: true,
  })
}

async function runLinearScan(
  docs: Candidate[],
  batchTrace: ReturnType<typeof createWorkflowTrace>,
  jobPostingId?: string | number,
): Promise<{ scanned: number; tasksCreated: number; errors: string[] }> {
  const errors: string[] = []
  let scanned = 0
  let tasksCreated = 0

  for (const doc of docs) {
    scanned++
    const c = doc as Candidate
    const label = candidateLabelFromDoc(c)
    const trace = batchTrace.forCandidate(doc.id, label)
    const rb = getReadyBotFields(doc)
    if (isExcludedFromReadyBot(doc as Candidate)) {
      readyBotTerminalLog('Skipped (opted out)', { candidateId: doc.id, label })
      await trace.log({
        step: 'Skipped — candidate opted out',
        toolUsed: 'scanIncompleteCandidates',
        status: 'skipped',
      })
      continue
    }
    if (hasNoMissingFields(doc)) {
      readyBotTerminalLog('Skipped (profile complete)', { candidateId: doc.id, label })
      await trace.log({
        step: 'Skipped — profile complete',
        toolUsed: 'detectMissingFields',
        status: 'skipped',
      })
      continue
    }

    readyBotTerminalLog('Processing candidate', {
      candidateId: doc.id,
      label,
      screeningStatus: rb.screeningStatus ?? 'unknown',
    })

    try {
      const state = await trace.runTool({
        step: 'Run full screening workflow for candidate',
        toolUsed: 'runCandidateScreeningWorkflow',
        fn: () =>
          runCandidateScreeningWorkflow(doc.id, {
            jobPostingId,
            skipOutbound: !!process.env.READYBOT_SKIP_OUTBOUND,
            trace,
          }),
        detail: { screeningStatus: rb.screeningStatus ?? 'unknown' },
        resultDetail: (s) => ({
          nextAction: s.nextAction,
          channel: s.channel,
          screeningResultId: s.screeningResultId,
        }),
      })
      if (state.taskId && state.nextAction !== 'stop') tasksCreated++
      readyBotTerminalLog('Candidate workflow finished', {
        candidateId: doc.id,
        label,
        nextAction: state.nextAction,
        taskId: state.taskId ?? null,
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      errors.push(`candidate ${doc.id} (${label}): ${msg}`)
      readyBotTerminalError(`Candidate workflow failed: ${label}`, e, { candidateId: doc.id })
    }
  }

  return { scanned, tasksCreated, errors }
}

export async function scanIncompleteCandidates(
  options?: {
    source?: 'manual' | 'scheduled'
    overrides?: Partial<
      Pick<ReadyBotRuntimeSettings, 'useLangGraphMultiAgent' | 'parallelAgentCount'>
    >
  },
): Promise<{
  scanned: number
  tasksCreated: number
  errors: string[]
  skipped?: boolean
  skipReason?: string
}> {
  const payload = await getReadyBotPayload()
  const ctx = { payload }
  const settings = await loadReadyBotSettings(payload)

  if (options?.source === 'scheduled') {
    const gate = shouldRunScheduledScan(settings)
    if (!gate.run) {
      readyBotTerminalLog('Scheduled scan skipped', { reason: gate.reason })
      return { scanned: 0, tasksCreated: 0, errors: [], skipped: true, skipReason: gate.reason }
    }
  }

  const merged: ReadyBotRuntimeSettings = { ...settings, ...(options?.overrides ?? {}) }
  if (process.env.READYBOT_AGENT_COUNT) {
    merged.parallelAgentCount = parseInt(process.env.READYBOT_AGENT_COUNT)
  }
  // Keep parallelAgentCount within supported bounds (1–8).
  merged.parallelAgentCount = Math.min(
    8,
    Math.max(1, Number(merged.parallelAgentCount) || 1),
  )
  const jobPostingId = process.env.READYBOT_DEFAULT_JOB_POSTING_ID

  const result = await fetchScanQueue(payload)

  const batchTrace = createWorkflowTrace(ctx, {
    workflowName: merged.useLangGraphMultiAgent ? 'scan_batch_langgraph' : 'scan_batch',
    phase: 'scan',
  })

  await batchTrace.log({
    step: 'Scheduled scan started',
    toolUsed: 'scanIncompleteCandidates',
    status: 'started',
    detail: {
      queueSize: result.docs.length,
      useLangGraphMultiAgent: merged.useLangGraphMultiAgent,
      parallelAgentCount: merged.parallelAgentCount,
    },
  })

  readyBotTerminalLog('Scan batch started', {
    workflowRunId: batchTrace.runId,
    queueSize: result.docs.length,
    useLangGraphMultiAgent: merged.useLangGraphMultiAgent,
    parallelAgentCount: merged.parallelAgentCount,
    defaultJobPostingId: jobPostingId ?? null,
  })

  const scanResult = merged.useLangGraphMultiAgent
    ? await runLangGraphScan({
        candidates: result.docs as Candidate[],
        parallelAgentCount: merged.parallelAgentCount,
        jobPostingId,
        batchTrace,
      })
    : await runLinearScan(result.docs as Candidate[], batchTrace, jobPostingId)

  readyBotTerminalLog('Scan batch finished', {
    workflowRunId: batchTrace.runId,
    ...scanResult,
  })

  await batchTrace.log({
    step: 'Scheduled scan complete',
    toolUsed: 'scanIncompleteCandidates',
    status: scanResult.errors.length ? 'error' : 'success',
    detail: scanResult,
  })

  if (options?.source === 'scheduled') {
    await recordAutomatedScanRun(payload)
  }

  return scanResult
}
