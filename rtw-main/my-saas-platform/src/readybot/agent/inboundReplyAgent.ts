import { generateText, stepCountIs, tool } from 'ai'
import { createOpenAI } from '@ai-sdk/openai'
import { z } from 'zod'
import { contextManager } from './contextManager'
import { agentEventService } from './agentEventService'
import { getReadyBotModel } from '../lib/openaiClient'
import { readyBotTerminalLog } from '../tools/terminalLog'

export type SessionMessage = { role: 'user' | 'assistant'; content: string }

const SARAH_SYSTEM_PROMPT = `You are Sarah, a warm and professional recruitment assistant for Ready to Work.
You screen candidates via WhatsApp to build their profile so we can match them with jobs.

Rules:
- Keep messages short and conversational — this is WhatsApp, not email
- ALWAYS acknowledge what the candidate just said before moving on
- Extract profile info naturally from the conversation — jobTitle, experienceYears, location, aboutMe, skills
- Use save_extracted_info to record anything useful the candidate tells you
- Never ask for something they already told you — check the conversation history
- Missing info to collect: job title, years of experience, location, brief about them, CV/resume
- If they ask about interviews or specific jobs: explain you are building their profile first
- Be warm, encouraging, and concise`

// ── Session helpers ────────────────────────────────────────────────────────

async function loadSession(candidateId: string | number): Promise<SessionMessage[]> {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'candidate-memory',
      overrideAccess: true,
      where: { candidate: { equals: Number(candidateId) } },
      limit: 1,
    })
    const doc = result.docs[0]
    if (!doc?.whatsappSession) return []
    const session = doc.whatsappSession as SessionMessage[]
    // Keep last 20 messages to avoid context overflow
    return Array.isArray(session) ? session.slice(-20) : []
  } catch {
    return []
  }
}

async function saveSession(candidateId: string | number, messages: SessionMessage[]): Promise<void> {
  try {
    const { getPayload } = await import('payload')
    const config = (await import('@payload-config')).default
    const payload = await getPayload({ config })
    const result = await payload.find({
      collection: 'candidate-memory',
      overrideAccess: true,
      where: { candidate: { equals: Number(candidateId) } },
      limit: 1,
    })
    const patch = { whatsappSession: messages.slice(-40) } // store last 40, use last 20 in context
    if (result.docs[0]) {
      await payload.update({
        collection: 'candidate-memory',
        id: result.docs[0].id,
        overrideAccess: true,
        data: patch as never,
      })
    } else {
      await payload.create({
        collection: 'candidate-memory',
        overrideAccess: true,
        data: { candidate: Number(candidateId), ...patch } as never,
      })
    }
  } catch (err) {
    console.error('[InboundReplyAgent] Failed to save session:', err)
  }
}

// ── Agent ──────────────────────────────────────────────────────────────────

export interface InboundReplyAgentResult {
  reply: string
  toolsUsed: string[]
  requiresHumanReview: boolean
  humanReviewReason?: string
}

export async function runInboundReplyAgent(args: {
  candidateId: string | number
  replyText: string
}): Promise<InboundReplyAgentResult> {
  const apiKey = process.env.READYBOT_LLM_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey?.trim()) throw new Error('[InboundReplyAgent] OpenAI API key not configured')

  const requiresHumanReview = { value: false, reason: '' }
  const toolsUsed: string[] = []

  // Load session and candidate context in parallel
  const [sessionMessages, bundle] = await Promise.all([
    loadSession(args.candidateId),
    contextManager.buildContext({ candidateId: args.candidateId, permissionMode: 'workspace-write' }),
  ])

  const systemPrompt = `${SARAH_SYSTEM_PROMPT}\n\n${contextManager.formatContextAsPrompt(bundle)}`

  const openai = createOpenAI({ apiKey })

  const result = await generateText({
    model: openai(getReadyBotModel()),
    system: systemPrompt,
    messages: [
      ...sessionMessages,
      { role: 'user', content: args.replyText },
    ],
    tools: {
      save_extracted_info: tool({
        description:
          'Save profile information extracted from the candidate message for human review. Use this whenever the candidate tells you something about their background, experience, location, or skills.',
        inputSchema: z.object({
          jobTitle: z.string().optional().describe("Candidate's current or desired job title"),
          experienceYears: z.number().optional().describe('Total years of work experience'),
          location: z.string().optional().describe('City or country they are based in'),
          aboutMe: z.string().optional().describe('Brief summary in their own words'),
          skills: z.string().optional().describe('Key skills or technologies mentioned'),
          targetRole: z.string().optional().describe('Role they are looking for'),
          notes: z.string().optional().describe('Any other useful notes from the conversation'),
        }),
        execute: async (extracted) => {
          toolsUsed.push('save_extracted_info')
          const fields = Object.fromEntries(
            Object.entries(extracted).filter(([, v]) => v !== undefined),
          )
          if (Object.keys(fields).length === 0) return { saved: false, reason: 'No fields provided' }

          // Create human review task with extracted data
          const { getPayload } = await import('payload')
          const config = (await import('@payload-config')).default
          const payload = await getPayload({ config })

          await payload.create({
            collection: 'human-review-tasks',
            overrideAccess: true,
            data: {
              candidate: Number(args.candidateId),
              status: 'pending',
              reason: 'Extracted from WhatsApp conversation by Sarah agent',
              suggestedUpdate: fields,
            } as never,
          })

          void agentEventService.recordEvent(
            'profile_update',
            { fields: Object.keys(fields), extracted: fields, pendingReview: true, agent: 'inboundReplyAgent' },
            { candidateId: String(args.candidateId) },
          )
          readyBotTerminalLog(`[Sarah agent → ${args.candidateId}] Flagged for review: ${Object.keys(fields).join(', ')}`)
          return { saved: true, pendingReview: true, fields: Object.keys(fields) }
        },
      }),
    },
    stopWhen: stepCountIs(3),
    temperature: 0.45,
  })

  // Persist updated session (append user message + assistant reply)
  const updatedSession: SessionMessage[] = [
    ...sessionMessages,
    { role: 'user', content: args.replyText },
    { role: 'assistant', content: result.text },
  ]
  await saveSession(args.candidateId, updatedSession)

  void agentEventService.recordEvent(
    'assistant_message',
    { text: result.text.slice(0, 500), toolsUsed, agent: 'inboundReplyAgent' },
    { candidateId: String(args.candidateId) },
  )

  return {
    reply: result.text,
    toolsUsed,
    requiresHumanReview: requiresHumanReview.value,
    humanReviewReason: requiresHumanReview.reason || undefined,
  }
}
