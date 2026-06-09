import type { CandidateExtraction } from '../types/CandidateExtraction'
import type { RoleFitResult } from '../types/RoleFitResult'
import { getOpenAIClient, getReadyBotModel } from '../lib/openaiClient'
import { EXTRACTION_SYSTEM_PROMPT } from '../prompts/extractionPrompt'
import { SCREENING_MESSAGE_SYSTEM_PROMPT } from '../prompts/screeningMessagePrompt'
import { MEMORY_COMPACTION_SYSTEM_PROMPT } from '../prompts/memoryCompactionPrompt'

export function isLlmConfigured(): boolean {
  return !!getOpenAIClient()
}

async function chatJson<T>(system: string, user: string): Promise<T | null> {
  const openai = getOpenAIClient()
  if (!openai) return null
  const res = await openai.chat.completions.create({
    model: getReadyBotModel(),
    temperature: 0.2,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  })
  const raw = res.choices[0]?.message?.content
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export async function extractCandidateDataWithLlm(args: {
  message: string
  context: Record<string, unknown>
}): Promise<{ success: boolean; extraction?: CandidateExtraction; error?: string }> {
  if (!isLlmConfigured()) return { success: false, error: 'LLM API key not configured' }
  const parsed = await chatJson<CandidateExtraction>(
    EXTRACTION_SYSTEM_PROMPT,
    JSON.stringify({ reply: args.message, context: args.context }, null, 2),
  )
  if (!parsed?.fields) return { success: false, error: 'Invalid extraction JSON' }
  return { success: true, extraction: parsed }
}

export async function compareRoleFitWithLlm(args: {
  candidateProfile: Record<string, unknown>
  cvSummary: string
  jobTitle: string
  jobDescription?: string
}): Promise<{ success: boolean; result?: RoleFitResult; error?: string }> {
  if (!isLlmConfigured()) return { success: false, error: 'LLM API key not configured' }
  const system = `You compare a candidate to a job role for screening (not hiring decisions).
Return JSON: fitScore (0-100), fitSummary, gaps (string[]), recommendedQuestions (string[]), needsHumanReview (boolean), reason.
Flag needsHumanReview for visa/legal mismatches or very low fit (<40).`
  const parsed = await chatJson<RoleFitResult>(
    system,
    JSON.stringify(args, null, 2),
  )
  if (parsed == null || typeof parsed.fitScore !== 'number') {
    return { success: false, error: 'Invalid role fit JSON' }
  }
  return { success: true, result: parsed }
}

export async function generateScreeningMessageWithLlm(args: {
  candidateName: string
  missingFields: string[]
  recommendedQuestions: string[]
  fitSummary?: string
  memorySummary?: string
  cvSummary?: string
  recentMessages?: { direction: 'inbound' | 'outbound'; body: string }[]
}): Promise<{ success: boolean; messageBody?: string; error?: string }> {
  if (!isLlmConfigured()) return { success: false, error: 'LLM not configured' }
  const openai = getOpenAIClient()!

  const memoryBlock = [
    args.memorySummary ? `Conversation summary: ${args.memorySummary}` : '',
    args.cvSummary ? `CV summary: ${args.cvSummary}` : '',
  ].filter(Boolean).join('\n')

  const contextBlock = JSON.stringify({
    candidateName: args.candidateName,
    missingFields: args.missingFields,
    recommendedQuestions: args.recommendedQuestions,
    fitSummary: args.fitSummary,
  })

  const conversationMessages: { role: 'user' | 'assistant'; content: string }[] = []
  for (const msg of args.recentMessages ?? []) {
    conversationMessages.push({
      role: msg.direction === 'inbound' ? 'user' : 'assistant',
      content: msg.body,
    })
  }

  const res = await openai.chat.completions.create({
    model: getReadyBotModel(),
    temperature: 0.7,
    messages: [
      { role: 'system', content: SCREENING_MESSAGE_SYSTEM_PROMPT },
      {
        role: 'system',
        content: `Screening context: ${contextBlock}${memoryBlock ? `\n\n${memoryBlock}` : ''}`,
      },
      ...conversationMessages,
      { role: 'user', content: 'Write your next message to the candidate.' },
    ],
  })
  const body = res.choices[0]?.message?.content?.trim()
  if (!body) return { success: false, error: 'Empty message' }
  return { success: true, messageBody: body }
}

export async function summarizeCvWithLlm(cvText: string): Promise<{
  success: boolean
  summary?: string
  error?: string
}> {
  if (!isLlmConfigured()) return { success: false, error: 'LLM not configured' }
  const openai = getOpenAIClient()!
  const res = await openai.chat.completions.create({
    model: getReadyBotModel(),
    temperature: 0.2,
    messages: [
      {
        role: 'system',
        content:
          'Summarize this CV for a recruiter screening assistant. Include skills, experience, location, languages. Max 800 words.',
      },
      { role: 'user', content: cvText.slice(0, 60_000) },
    ],
  })
  const summary = res.choices[0]?.message?.content?.trim()
  if (!summary) return { success: false, error: 'Empty summary' }
  return { success: true, summary }
}

export async function compactMemoryWithLlm(args: {
  messages: unknown[]
  existingMemory: Record<string, unknown>
  candidateProfile: Record<string, unknown>
}): Promise<{ success: boolean; memoryPatch?: Record<string, unknown>; error?: string }> {
  if (!isLlmConfigured()) return { success: false, error: 'LLM not configured' }
  const parsed = await chatJson<Record<string, unknown>>(
    MEMORY_COMPACTION_SYSTEM_PROMPT,
    JSON.stringify(args, null, 2),
  )
  if (!parsed) return { success: false, error: 'Invalid memory JSON' }
  return { success: true, memoryPatch: parsed }
}
