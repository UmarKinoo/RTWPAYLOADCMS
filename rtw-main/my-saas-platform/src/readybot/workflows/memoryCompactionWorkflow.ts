import { getReadyBotPayload } from '../lib/getReadyBotPayload'
import { compactCandidateMemory, loadRecentMessagesForCompaction } from '../services/compactCandidateMemory'
import { getCandidate, getCandidateMemory, type ReadyBotPayloadContext } from '../tools/payloadTool'
import { compactMemoryWithLlm, isLlmConfigured } from '../tools/llmTool'
import { buildCandidateProfileContext } from '../services/buildCandidateProfileContext'
import { detectMissingFields } from '../services/detectMissingFields'
import { createWorkflowTrace, type WorkflowTrace } from '../tools/workflowTrace'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'

export async function runMemoryCompactionWorkflow(
  candidateId: string | number,
  parentTrace?: WorkflowTrace,
) {
  const payload = await getReadyBotPayload()
  const ctx: ReadyBotPayloadContext = { payload }
  const candidate = await getCandidate(ctx, candidateId)
  const label = candidateLabelFromDoc(candidate)

  const trace =
    parentTrace ??
    createWorkflowTrace(ctx, {
      workflowName: 'memoryCompaction',
      phase: 'memory',
      candidateId,
      candidateLabel: label,
    })

  if (!parentTrace) {
    await trace.log({
      step: 'Memory compaction workflow started',
      toolUsed: 'memoryCompactionWorkflow',
      status: 'started',
    })
  }

  const existing = await getCandidateMemory(ctx, candidateId)
  const messages = await trace.runTool({
    step: 'Load recent messages for compaction',
    toolUsed: 'loadRecentMessagesForCompaction',
    fn: () => loadRecentMessagesForCompaction(ctx, candidateId),
    resultDetail: (m) => ({ count: m.length }),
  })
  const missing = detectMissingFields(candidate)

  if (isLlmConfigured()) {
    const llm = await trace.runTool({
      step: 'Compact memory with LLM',
      toolUsed: 'compactMemoryWithLlm',
      fn: () =>
        compactMemoryWithLlm({
          messages: messages.map((m) => ({
            direction: m.direction,
            body: m.body,
            at: m.sentAt || m.receivedAt,
          })),
          existingMemory: (existing ?? {}) as unknown as Record<string, unknown>,
          candidateProfile: buildCandidateProfileContext(candidate),
        }),
      resultDetail: (r) => ({ success: r.success }),
    })
    if (llm.success && llm.memoryPatch) {
      return compactCandidateMemory(ctx, candidateId, {
        ...llm.memoryPatch,
        missingFields: missing.map((m) => ({ field: m.field })),
      })
    }
  }

  return compactCandidateMemory(ctx, candidateId, {
    missingFields: missing.map((m) => ({ field: m.field })),
    conversationSummary: existing?.conversationSummary,
    lastAgentDecision: 'Synced missing fields from profile (no LLM compaction)',
  })
}
