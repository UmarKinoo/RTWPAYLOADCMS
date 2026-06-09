import { getOpenAIClient, getReadyBotModel } from '../lib/openaiClient'
import { agentEventService } from './agentEventService'
import { contextManager } from './contextManager'
import type { CompactedMemory, AgentContext } from './types'

const COMPACTION_SYSTEM_PROMPT =
  'You are a memory compaction engine for ReadyBot. Given candidate context, produce a compact JSON memory object. Be precise and factual. Respond ONLY with valid JSON.'

function buildUserPrompt(data: {
  candidateProfile: string
  recentMessages: string
  existingMemory: string
  missingFields: string[]
  currentStage: string
}): string {
  return `Compact the following candidate context into a structured memory object.

CANDIDATE PROFILE:
${data.candidateProfile}

RECENT CONVERSATION:
${data.recentMessages}

EXISTING MEMORY:
${data.existingMemory}

MISSING FIELDS: ${data.missingFields.join(', ') || 'None'}
CURRENT STAGE: ${data.currentStage}

Respond with ONLY this JSON:
{
  "candidate_summary": "<concise 2-3 sentence profile summary>",
  "job_summary": "<job context if known, else empty string>",
  "conversation_summary": "<what was discussed>",
  "important_facts": ["<confirmed fact>"],
  "open_questions": ["<unresolved item>"],
  "contradictions": ["<any inconsistency>"],
  "current_stage": "<screening stage>",
  "next_recommended_action": "<what the agent should do next>"
}`
}

// Compaction pipeline steps:
//   Raw conversation
//     → remove irrelevant logs
//     → summarize old turns
//     → preserve important decisions
//     → preserve current task state
//     → preserve CV/profile references
//     → rebuild compact context

export class CompactionPipeline {
  async compact(context: AgentContext): Promise<CompactedMemory | null> {
    const client = getOpenAIClient()
    if (!client) {
      console.error('[CompactionPipeline] OpenAI client not available — skipping compaction')
      return null
    }

    const bundle = await contextManager.buildContext(context)

    const candidateProfile = bundle.candidateProfile
      ? JSON.stringify(bundle.candidateProfile, null, 2).slice(0, 2000)
      : 'No profile available'

    const recentMessages = bundle.recentMessages
      .map((m) => `[${m.role.toUpperCase()}]: ${m.content}`)
      .join('\n')

    const existingMemory = bundle.compactedMemory
      ? JSON.stringify(bundle.compactedMemory, null, 2)
      : 'No prior memory'

    try {
      const response = await client.chat.completions.create({
        model: getReadyBotModel(),
        temperature: 0.1,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: COMPACTION_SYSTEM_PROMPT },
          {
            role: 'user',
            content: buildUserPrompt({
              candidateProfile,
              recentMessages,
              existingMemory,
              missingFields: bundle.missingInformation,
              currentStage: bundle.currentTaskState,
            }),
          },
        ],
      })

      const raw = response.choices[0]?.message?.content
      if (!raw) throw new Error('Empty compaction response from LLM')

      const compacted = JSON.parse(raw) as CompactedMemory

      // Normalize array fields
      if (!Array.isArray(compacted.important_facts)) compacted.important_facts = []
      if (!Array.isArray(compacted.open_questions)) compacted.open_questions = []
      if (!Array.isArray(compacted.contradictions)) compacted.contradictions = []
      if (!compacted.candidate_summary) compacted.candidate_summary = ''
      if (!compacted.job_summary) compacted.job_summary = ''
      if (!compacted.conversation_summary) compacted.conversation_summary = ''
      if (!compacted.current_stage) compacted.current_stage = 'screening'
      if (!compacted.next_recommended_action) compacted.next_recommended_action = ''

      // Record as compaction_event
      await agentEventService.recordEvent(
        'compaction_event',
        { compacted, messagesCompacted: bundle.recentMessages.length },
        {
          candidateId: context.candidateId,
          jobId: context.jobId,
          conversationId: context.conversationId,
          sessionId: context.sessionId,
        },
      )

      // Persist to candidate-memory if candidateId available
      if (context.candidateId) {
        await this.persistToMemory(context.candidateId, compacted)
      }

      return compacted
    } catch (err) {
      console.error('[CompactionPipeline] Compaction failed:', err)
      await agentEventService.recordEvent(
        'error',
        { phase: 'compaction', error: String(err) },
        {
          candidateId: context.candidateId,
          jobId: context.jobId,
          sessionId: context.sessionId,
        },
      )
      return null
    }
  }

  private async persistToMemory(candidateId: string | number, compacted: CompactedMemory) {
    try {
      const { getPayload } = await import('payload')
      const payloadConfig = (await import('@payload-config')).default
      const payload = await getPayload({ config: payloadConfig })

      const existing = await payload.find({
        collection: 'candidate-memory',
        overrideAccess: true,
        where: { candidate: { equals: Number(candidateId) } },
        limit: 1,
      })

      const patch = {
        profileSummary: compacted.candidate_summary,
        conversationSummary: compacted.conversation_summary,
        confirmedFields: compacted.important_facts.map((f) => ({ field: f })),
        missingFields: compacted.open_questions.map((f) => ({ field: f })),
        lastAgentDecision: compacted.next_recommended_action,
      }

      if (existing.docs[0]) {
        await payload.update({
          collection: 'candidate-memory',
          id: existing.docs[0].id,
          overrideAccess: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: patch as any,
        })
      } else {
        await payload.create({
          collection: 'candidate-memory',
          overrideAccess: true,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data: { candidate: Number(candidateId), ...patch } as any,
        })
      }
    } catch (err) {
      console.error('[CompactionPipeline] Failed to persist compacted memory:', err)
    }
  }
}

export const compactionPipeline = new CompactionPipeline()
