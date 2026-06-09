import type { ReadyBotPayloadContext } from '../tools/payloadTool'
import { getCandidateMessages, upsertCandidateMemory } from '../tools/payloadTool'

function normalizeMemoryArray(
  value: unknown,
  itemKey: 'field' | 'flag',
): Array<Record<string, string>> | undefined {
  if (!Array.isArray(value)) return undefined
  return value.map((item) => {
    if (typeof item === 'string') return { [itemKey]: item }
    if (typeof item === 'object' && item !== null && itemKey in item) {
      return item as Record<string, string>
    }
    return { [itemKey]: String(item) }
  })
}

/** Normalize LLM memory patch to Payload array field shapes. */
export function normalizeMemoryPatch(patch: Record<string, unknown>): Record<string, unknown> {
  const out = { ...patch }
  for (const key of ['confirmedFields', 'unconfirmedFields', 'missingFields'] as const) {
    const normalized = normalizeMemoryArray(out[key], 'field')
    if (normalized) out[key] = normalized
  }
  const flags = normalizeMemoryArray(out.riskFlags, 'flag')
  if (flags) out.riskFlags = flags
  return out
}

/** Phase 5: LLM compaction; writes candidate-memory (audit via workflow trace). */
export async function compactCandidateMemory(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  patch: Record<string, unknown>,
) {
  return upsertCandidateMemory(ctx, candidateId, normalizeMemoryPatch(patch))
}

export async function loadRecentMessagesForCompaction(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
) {
  const { docs } = await getCandidateMessages(ctx, candidateId, 10)
  return docs
}
