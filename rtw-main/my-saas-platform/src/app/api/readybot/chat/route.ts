import { createOpenAI } from '@ai-sdk/openai'
import {
  convertToModelMessages,
  stepCountIs,
  streamText,
  type UIMessage,
} from 'ai'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { getReadyBotModel } from '@/readybot/lib/openaiClient'
import { loadReadyBotSettings } from '@/lib/readybot/settings'
import {
  getReadyBotChatSession,
  saveReadyBotChatSessionMessages,
} from '@/lib/readybot/chatSessions'
import {
  compactOpsChatSessionMemory,
  selectMessagesForModel,
} from '@/lib/readybot/compactOpsChatMemory'
import { createReadyBotChatTools } from '@/readybot/chat/tools'
import {
  CLARIFICATION_MODE_PROMPT,
  isExplicitRunScanRequest,
  isUnscopedListCandidatesRequest,
  isVagueUserMessage,
  listCandidatesClarificationPrompt,
} from '@/readybot/chat/chatGuards'
import { runOpsChatBrain } from '@/readybot/chat/opsChatBrain'
import { READYBOT_OPS_SYSTEM_PROMPT } from '@/readybot/chat/systemPrompt'
import { executeGetPipelineStats } from '@/readybot/chat/toolActions'

export const maxDuration = 120

function getChatModel() {
  const apiKey = process.env.READYBOT_LLM_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey?.trim()) return null
  const openai = createOpenAI({ apiKey })
  return openai(getReadyBotModel())
}

function lastUserText(messages: UIMessage[]): string {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i]
    if (m.role !== 'user') continue
    const text = m.parts
      .filter((p): p is { type: 'text'; text: string } => p.type === 'text')
      .map((p) => p.text)
      .join('')
    if (text.trim()) return text.trim()
  }
  return ''
}

export async function POST(req: Request) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const payload = await getPayload({ config })
  const user = await getRequestAuthUser(payload)
  if (!user || user.collection !== 'users' || (user as { role?: string }).role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
  }

  const model = getChatModel()
  if (!model) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), {
      status: 503,
    })
  }

  const body = await req.json()
  const messages = (body.messages ?? []) as UIMessage[]
  const locale = typeof body.locale === 'string' ? body.locale : 'en'
  const sessionId =
    typeof body.sessionId === 'string' || typeof body.sessionId === 'number'
      ? body.sessionId
      : null

  const settings = await loadReadyBotSettings(payload)
  const stats = await executeGetPipelineStats(payload)

  let memoryBlock = ''
  if (sessionId != null) {
    const session = await getReadyBotChatSession(payload, sessionId, user.id)
    if (session?.memorySummary) {
      memoryBlock = `\n\n[Persistent session memory — earlier turns summarized]
${session.memorySummary}`
      if (session.keyFacts.length > 0) {
        memoryBlock += `\nKey facts: ${session.keyFacts.join(' · ')}`
      }
    }
  }

  const modelMessages = selectMessagesForModel(messages)
  if (modelMessages.length < messages.length) {
    memoryBlock += `\n(Only the most recent ${modelMessages.length} messages are in the active window; rely on session memory above for older context.)`
  }

  const lastUser = lastUserText(modelMessages)
  const vague = lastUser ? isVagueUserMessage(lastUser) : false
  const unscopedList = lastUser ? isUnscopedListCandidatesRequest(lastUser) : false
  const explicitScan = lastUser ? isExplicitRunScanRequest(lastUser) : false
  const needsClarification = vague || unscopedList

  let brainBlock = ''
  if (settings.useLangGraphChatBrain && lastUser && !needsClarification) {
    const brain = await runOpsChatBrain(payload, lastUser, locale)
    if (brain.summary) {
      brainBlock = `\n\n${brain.summary}\nIntent classified: ${brain.intent}`
    }
  }

  let clarificationBlock = ''
  if (vague) clarificationBlock += `\n\n${CLARIFICATION_MODE_PROMPT}`
  if (unscopedList) clarificationBlock += `\n\n${listCandidatesClarificationPrompt(locale)}`

  const contextBlock = `[Live ops context]
LangGraph multi-agent scan: ${stats.useLangGraphMultiAgent ? 'ON' : 'OFF'} (${stats.parallelAgentCount} agents)
LangGraph chat brain: ${stats.useLangGraphChatBrain ? 'ON' : 'OFF'}
Pending human reviews: ${stats.pendingHumanReviews}
Active screening tasks: ${stats.activeScreeningTasks}
Screening results: ${stats.screeningResultsTotal}
Candidates in pipeline: ${stats.candidatesInPipeline}
Locale: ${locale}`

  const tools = needsClarification
    ? undefined
    : createReadyBotChatTools(payload, locale, user.id, {
        allowRunScan: explicitScan,
        allowListCandidates: !unscopedList,
        sessionId,
      })

  const result = streamText({
    model,
    system: `${READYBOT_OPS_SYSTEM_PROMPT}\n\n${contextBlock}${memoryBlock}${brainBlock}${clarificationBlock}`,
    messages: await convertToModelMessages(modelMessages),
    tools,
    stopWhen: stepCountIs(6),
    maxOutputTokens: 1200,
    temperature: 0.35,
  })

  return result.toUIMessageStreamResponse({
    originalMessages: messages,
    onFinish: async ({ messages: finishedMessages }) => {
      if (sessionId == null) return
      try {
        await saveReadyBotChatSessionMessages(
          payload,
          sessionId,
          user.id,
          finishedMessages,
        )
        void compactOpsChatSessionMemory(payload, sessionId, finishedMessages)
      } catch {
        // Persistence failure should not break the stream response.
      }
    },
  })
}
