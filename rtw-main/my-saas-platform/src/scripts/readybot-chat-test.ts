/**
 * ReadyBot ops chat integration test — sends real messages through the same
 * stack as POST /api/readybot/chat (brain + tools + LLM).
 *
 * Usage:
 *   pnpm readybot:chat-test
 *   READYBOT_TEST_ADMIN_PASSWORD=... pnpm readybot:chat-test --http
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { createOpenAI } from '@ai-sdk/openai'
import { convertToModelMessages, generateText, stepCountIs, type UIMessage } from 'ai'
import { getReadyBotModel } from '../readybot/lib/openaiClient'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

type CaseResult = {
  name: string
  userMessage: string
  status: 'pass' | 'fail' | 'warn' | 'skip'
  toolsCalled: string[]
  toolErrors: string[]
  responsePreview: string
  notes: string[]
}

const results: CaseResult[] = []

function userMsg(text: string): UIMessage {
  return {
    id: `u-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    role: 'user',
    parts: [{ type: 'text', text }],
  }
}

type ChatTurnCtx = {
  payload: Awaited<ReturnType<typeof import('../readybot/lib/getReadyBotPayload').getReadyBotPayload>>
  adminUserId: string | number
  locale: string
  skipBrainScan?: boolean
}

async function runChatTurn(args: ChatTurnCtx & { messages: UIMessage[] }) {
  const { payload, adminUserId, locale, messages } = args
  const { loadReadyBotSettings } = await import('../lib/readybot/settings')
  const { executeGetPipelineStats } = await import('../readybot/chat/toolActions')
  const { runOpsChatBrain } = await import('../readybot/chat/opsChatBrain')
  const { createReadyBotChatTools } = await import('../readybot/chat/tools')
  const {
    CLARIFICATION_MODE_PROMPT,
    isExplicitRunScanRequest,
    isUnscopedListCandidatesRequest,
    isVagueUserMessage,
    listCandidatesClarificationPrompt,
  } = await import('../readybot/chat/chatGuards')
  const { READYBOT_OPS_SYSTEM_PROMPT } = await import('../readybot/chat/systemPrompt')
  const { selectMessagesForModel } = await import('../lib/readybot/compactOpsChatMemory')

  const apiKey = process.env.READYBOT_LLM_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey?.trim()) throw new Error('OPENAI_API_KEY not configured')

  const settings = await loadReadyBotSettings(payload)
  const stats = await executeGetPipelineStats(payload)
  const modelMessages = selectMessagesForModel(messages)
  const lastUser = [...modelMessages]
    .reverse()
    .find((m) => m.role === 'user')
    ?.parts.filter((p): p is { type: 'text'; text: string } => p.type === 'text')
    .map((p) => p.text)
    .join('')
    .trim()

  const vague = lastUser ? isVagueUserMessage(lastUser) : false
  const unscopedList = lastUser ? isUnscopedListCandidatesRequest(lastUser) : false
  const needsClarification = vague || unscopedList
  const explicitScan = lastUser ? isExplicitRunScanRequest(lastUser) : false

  let brainBlock = ''
  if (settings.useLangGraphChatBrain && lastUser && !needsClarification) {
    const brain = await runOpsChatBrain(payload, lastUser, locale)
    if (brain.summary && !(args.skipBrainScan && brain.intent === 'scan')) {
      brainBlock = `\n\n${brain.summary}\nIntent classified: ${brain.intent}`
    } else if (brain.intent === 'scan' && args.skipBrainScan) {
      brainBlock = `\n\n[LangGraph brain — scan intent detected; skipped in test to avoid full batch scan]`
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
    : createReadyBotChatTools(payload, locale, adminUserId, {
        allowRunScan: explicitScan,
        allowListCandidates: !unscopedList,
      })
  const openai = createOpenAI({ apiKey })
  const model = openai(getReadyBotModel())

  const toolLog: string[] = []
  const toolErrors: string[] = []

  const out = await generateText({
    model,
    system: `${READYBOT_OPS_SYSTEM_PROMPT}\n\n${contextBlock}${brainBlock}${clarificationBlock}`,
    messages: await convertToModelMessages(modelMessages),
    tools,
    stopWhen: stepCountIs(6),
    maxOutputTokens: 1200,
    temperature: 0.35,
    onStepFinish: (step) => {
      for (const tc of step.toolCalls ?? []) {
        if (tc?.toolName) toolLog.push(tc.toolName)
      }
      for (const tr of step.toolResults ?? []) {
        if (!tr?.toolName) continue
        const output =
          'output' in tr && tr.output !== undefined
            ? tr.output
            : 'result' in tr
              ? (tr as { result: unknown }).result
              : undefined
        if (output && typeof output === 'object' && 'error' in output) {
          toolErrors.push(`${tr.toolName}: ${(output as { error: string }).error}`)
        }
      }
    },
  })

  return {
    text: out.text,
    toolsCalled: [...new Set(toolLog)],
    toolErrors,
    steps: out.steps?.length ?? 0,
  }
}

async function runCase(
  name: string,
  userMessage: string,
  evaluate: (r: Awaited<ReturnType<typeof runChatTurn>>) => { status: CaseResult['status']; notes: string[] },
  ctx: ChatTurnCtx,
) {
  console.log(`\n--- ${name} ---`)
  console.log(`User: ${userMessage}`)
  try {
    const r = await runChatTurn({ ...ctx, messages: [userMsg(userMessage)] })
    const { status, notes } = evaluate(r)
    const preview = r.text.trim().slice(0, 280).replace(/\s+/g, ' ')
    results.push({
      name,
      userMessage,
      status,
      toolsCalled: r.toolsCalled,
      toolErrors: r.toolErrors,
      responsePreview: preview,
      notes,
    })
    console.log(`Tools: ${r.toolsCalled.join(', ') || '(none)'}`)
    console.log(`Status: ${status} — ${notes.join('; ')}`)
    console.log(`Reply: ${preview}${r.text.length > 280 ? '…' : ''}`)
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e)
    results.push({
      name,
      userMessage,
      status: 'fail',
      toolsCalled: [],
      toolErrors: [msg],
      responsePreview: '',
      notes: [msg],
    })
    console.log(`Status: fail — ${msg}`)
  }
}

async function main() {
  const httpMode = process.argv.includes('--http')
  console.log('\n=== ReadyBot chat integration test ===\n')

  const { getReadyBotPayload } = await import('../readybot/lib/getReadyBotPayload')
  const payload = await getReadyBotPayload()
  const adminRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 1,
    overrideAccess: true,
  })
  const admin = adminRes.docs[0]
  if (!admin?.id) {
    console.error('No admin user found')
    process.exit(1)
  }

  const ctx = { payload, adminUserId: admin.id, locale: 'en' as const }

  if (httpMode) {
    await runHttpSmoke(admin.email as string)
  }

  await runCase(
    'Pipeline stats',
    'How many candidates are in the ReadyBot pipeline and how many pending human reviews?',
    (r) => ({
      status:
        r.toolsCalled.includes('getPipelineStats') || r.text.match(/\d+/)
          ? 'pass'
          : 'warn',
      notes: [
        r.toolsCalled.includes('getPipelineStats')
          ? 'Called getPipelineStats'
          : 'Brain may have prefetched stats — check reply has numbers',
      ],
    }),
    ctx,
  )

  await runCase(
    'Find candidate by label',
    'Find candidate Reply Pending and give me their dashboard link.',
    (r) => ({
      status:
        r.toolsCalled.includes('findCandidate') &&
        (r.text.includes('/en/readybot/candidates/') || r.text.includes('Dashboard:'))
          ? 'pass'
          : 'fail',
      notes: [
        r.toolsCalled.includes('findCandidate') ? 'Used findCandidate' : 'Missing findCandidate',
        r.text.includes('/en/readybot/candidates/')
          ? 'Dashboard URL in reply'
          : 'Must include dashboardLinkLine URL',
      ],
    }),
    ctx,
  )

  await runCase(
    'Full profile lookup',
    'Tell me everything about candidate ID 38 — screening status, missing fields, and recent messages.',
    (r) => ({
      status: r.toolsCalled.includes('getCandidateProfile') ? 'pass' : 'fail',
      notes: [
        r.toolsCalled.includes('getCandidateProfile')
          ? 'Used getCandidateProfile'
          : 'Should call getCandidateProfile for ID 38',
      ],
    }),
    ctx,
  )

  await runCase(
    'Unscoped list — should clarify',
    'List all candidates',
    (r) => ({
      status:
        r.toolsCalled.length === 0 &&
        (r.text.toLowerCase().includes('payload') ||
          r.text.includes('/admin/collections/candidates') ||
          r.text.includes('?'))
          ? 'pass'
          : 'fail',
      notes: ['Should ask scope or redirect — no listCandidates tool'],
    }),
    ctx,
  )

  await runCase(
    'List candidates paginated',
    'List the first 3 incomplete ReadyBot pipeline candidates with their screening status.',
    (r) => ({
      status: r.toolsCalled.includes('listCandidates') ? 'pass' : 'fail',
      notes: [r.toolsCalled.join(', ') || 'no tools'],
    }),
    ctx,
  )

  await runCase(
    'Pending reviews',
    'Show me pending human reviews — who needs approval and why?',
    (r) => ({
      status:
        r.toolsCalled.includes('listPendingReviews') || r.text.toLowerCase().includes('review')
          ? 'pass'
          : 'warn',
      notes: [r.toolsCalled.join(', ') || 'brain prefetch only'],
    }),
    ctx,
  )

  await runCase(
    'Edge: nonsense candidate',
    'Find candidate ZZZZ_NONEXISTENT_99999',
    (r) => ({
      status:
        r.toolsCalled.includes('findCandidate') &&
        !r.toolErrors.length &&
        (r.text.toLowerCase().includes('no ') ||
          r.text.toLowerCase().includes('not found') ||
          r.text.toLowerCase().includes('0') ||
          r.text.toLowerCase().includes("couldn't"))
          ? 'pass'
          : 'warn',
      notes: ['Should handle empty search gracefully', ...r.toolErrors],
    }),
    ctx,
  )

  await runCase(
    'Edge: off-topic',
    'What is the capital of France?',
    (r) => ({
      status:
        r.toolsCalled.length === 0 && r.text.length > 10 ? 'pass' : 'warn',
      notes: [
        r.toolsCalled.length
          ? `Unexpected tools: ${r.toolsCalled.join(', ')}`
          : 'No tools — good for off-topic',
      ],
    }),
    ctx,
  )

  await runCase(
    'Profile edit proposal (approval required)',
    'For candidate Reply Pending (ID 38), propose changing jobTitle to "Senior Carpenter" for testing — do not claim it is saved yet.',
    (r) => ({
      status:
        r.toolsCalled.includes('updateCandidateProfile') ||
        r.text.toLowerCase().includes('approv')
          ? 'pass'
          : 'fail',
      notes: [
        r.toolsCalled.includes('updateCandidateProfile')
          ? 'updateCandidateProfile tool invoked (approval flow in UI)'
          : 'Should propose updateCandidateProfile or mention approval card',
      ],
    }),
    ctx,
  )

  await runCase(
    'Edge: vague request',
    'fix the broken one',
    (r) => ({
      status:
        r.toolsCalled.length === 0 &&
        r.text.length > 20 &&
        (r.text.includes('?') || r.text.toLowerCase().includes('which'))
          ? 'pass'
          : 'fail',
      notes: [
        r.toolsCalled.length
          ? `Should not call tools: ${r.toolsCalled.join(', ')}`
          : 'No tools — should ask clarifying question',
      ],
    }),
    ctx,
  )

  // Multi-turn conversation
  const findTurn = await runChatTurn({
    ...ctx,
    messages: [userMsg('Find candidate Reply Pending')],
  })
  const profileTurn = await runChatTurn({
    ...ctx,
    messages: [
      userMsg('Find candidate Reply Pending'),
      {
        id: 'a1',
        role: 'assistant',
        parts: [{ type: 'text', text: findTurn.text }],
      },
      userMsg('Now load their full profile with getCandidateProfile'),
    ],
  })
  const multiOk =
    profileTurn.toolsCalled.includes('getCandidateProfile') ||
    profileTurn.text.toLowerCase().includes('reply pending')
  results.push({
    name: 'Multi-turn: find then profile',
    userMessage: 'Find → then load full profile',
    status: multiOk ? 'pass' : 'warn',
    toolsCalled: [...findTurn.toolsCalled, ...profileTurn.toolsCalled],
    toolErrors: [...findTurn.toolErrors, ...profileTurn.toolErrors],
    responsePreview: profileTurn.text.slice(0, 280),
    notes: [`turn1: ${findTurn.toolsCalled.join(',')}`, `turn2: ${profileTurn.toolsCalled.join(',')}`],
  })
  console.log(`\n--- Multi-turn: find then profile ---`)
  console.log(`turn1 tools: ${findTurn.toolsCalled.join(', ')}`)
  console.log(`turn2 tools: ${profileTurn.toolsCalled.join(', ')}`)
  console.log(`Status: ${multiOk ? 'pass' : 'warn'}`)

  printSummary()
  const failed = results.filter((r) => r.status === 'fail').length
  process.exit(failed > 0 ? 1 : 0)
}

async function runHttpSmoke(adminEmail: string) {
  const password = process.env.READYBOT_TEST_ADMIN_PASSWORD
  if (!password) {
    results.push({
      name: 'HTTP auth',
      userMessage: '—',
      status: 'skip',
      toolsCalled: [],
      toolErrors: [],
      responsePreview: '',
      notes: ['Set READYBOT_TEST_ADMIN_PASSWORD for --http mode'],
    })
    return
  }

  const loginRes = await fetch('http://localhost:3000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: adminEmail, password }),
  })
  const setCookie = loginRes.headers.getSetCookie?.() ?? []
  const cookieHeader = setCookie.map((c) => c.split(';')[0]).join('; ')
  if (!loginRes.ok) {
    results.push({
      name: 'HTTP auth',
      userMessage: '—',
      status: 'fail',
      toolsCalled: [],
      toolErrors: [],
      responsePreview: '',
      notes: [`Login failed HTTP ${loginRes.status}`],
    })
    return
  }

  const sessRes = await fetch('http://localhost:3000/api/readybot/chat/sessions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({ locale: 'en' }),
  })
  const sessJson = await sessRes.json()
  const sessionId = sessJson.session?.id

  const streamRes = await fetch('http://localhost:3000/api/readybot/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
    body: JSON.stringify({
      locale: 'en',
      sessionId,
      messages: [
        {
          id: 'http-1',
          role: 'user',
          parts: [{ type: 'text', text: 'How many pending human reviews?' }],
        },
      ],
    }),
  })

  const body = await streamRes.text()
  const hasData = body.length > 100
  results.push({
    name: 'HTTP streaming chat',
    userMessage: 'How many pending human reviews?',
    status: streamRes.ok && hasData ? 'pass' : 'fail',
    toolsCalled: [],
    toolErrors: [],
    responsePreview: body.slice(0, 200),
    notes: [`HTTP ${streamRes.status}`, `bytes=${body.length}`, `session=${sessionId}`],
  })
}

function printSummary() {
  console.log('\n=== Chat test summary ===\n')
  for (const r of results) {
    const icon =
      r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : r.status === 'warn' ? '!' : '○'
    console.log(`${icon} ${r.name}`)
    console.log(`   tools: ${r.toolsCalled.join(', ') || '(none)'}`)
    if (r.notes.length) console.log(`   notes: ${r.notes.join(' | ')}`)
    if (r.toolErrors.length) console.log(`   errors: ${r.toolErrors.join(' | ')}`)
  }
  const pass = results.filter((r) => r.status === 'pass').length
  const fail = results.filter((r) => r.status === 'fail').length
  const warn = results.filter((r) => r.status === 'warn').length
  const skip = results.filter((r) => r.status === 'skip').length
  console.log(`\nTotal: ${pass} pass, ${warn} warn, ${fail} fail, ${skip} skip\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
