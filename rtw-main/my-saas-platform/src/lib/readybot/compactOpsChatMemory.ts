import type { Payload } from 'payload'
import type { UIMessage } from 'ai'
import { getOpenAIClient, getReadyBotModel } from '@/readybot/lib/openaiClient'
import { messagesToTranscript } from './chatMessageUtils'

const COMPACT_AFTER_MESSAGES = 8

type CompactResult = {
  summary: string
  keyFacts: string[]
}

async function summarizeOpsChat(args: {
  existingSummary: string | null
  existingFacts: string[]
  transcript: string
}): Promise<CompactResult | null> {
  const openai = getOpenAIClient()
  if (!openai) return null

  const res = await openai.chat.completions.create({
    model: getReadyBotModel(),
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `You compact ReadyBot ops chat history for long-running admin conversations.
Return JSON: { "summary": string, "keyFacts": string[] }
- summary: 2-5 sentences of decisions, candidates discussed, actions taken, open questions
- keyFacts: up to 12 short bullet strings (candidate IDs/names, scan results, pending approvals)
Merge with prior memory; drop stale details. Ops-only — no fluff.`,
      },
      {
        role: 'user',
        content: JSON.stringify(
          {
            priorSummary: args.existingSummary,
            priorKeyFacts: args.existingFacts,
            newTranscript: args.transcript,
          },
          null,
          2,
        ),
      },
    ],
  })

  const raw = res.choices[0]?.message?.content
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as CompactResult
    if (typeof parsed.summary !== 'string') return null
    return {
      summary: parsed.summary.trim(),
      keyFacts: Array.isArray(parsed.keyFacts)
        ? parsed.keyFacts.filter((f): f is string => typeof f === 'string').slice(0, 12)
        : [],
    }
  } catch {
    return null
  }
}

export async function compactOpsChatSessionMemory(
  payload: Payload,
  sessionId: string | number,
  messages: UIMessage[],
): Promise<void> {
  if (messages.length < COMPACT_AFTER_MESSAGES) return

  try {
    const doc = await payload.findByID({
      collection: 'readybot-ops-chat-sessions',
      id: sessionId,
      depth: 0,
      overrideAccess: true,
    })

    const existingSummary =
      typeof doc.memorySummary === 'string' ? doc.memorySummary : null
    const existingFacts = Array.isArray(doc.keyFacts)
      ? doc.keyFacts.filter((f): f is string => typeof f === 'string')
      : []

    const transcript = messagesToTranscript(messages)
    const compact = await summarizeOpsChat({
      existingSummary,
      existingFacts,
      transcript,
    })
    if (!compact) return

    await payload.update({
      collection: 'readybot-ops-chat-sessions',
      id: sessionId,
      data: {
        memorySummary: compact.summary,
        keyFacts: compact.keyFacts,
        memoryCompactedAt: new Date().toISOString(),
      } as never,
      overrideAccess: true,
    })
  } catch {
    // Best-effort background compaction.
  }
}

export const OPS_CHAT_RECENT_MESSAGE_WINDOW = 16

export function selectMessagesForModel(
  messages: UIMessage[],
  windowSize = OPS_CHAT_RECENT_MESSAGE_WINDOW,
): UIMessage[] {
  if (messages.length <= windowSize) return messages
  return messages.slice(-windowSize)
}
