/**
 * ReadyBot end-to-end smoke test (CLI — no browser).
 * Usage: pnpm readybot:smoke
 */
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

type Result = { area: string; test: string; status: 'pass' | 'fail' | 'skip'; detail?: string }

const results: Result[] = []

function record(area: string, test: string, status: Result['status'], detail?: string) {
  results.push({ area, test, status, detail })
  const icon = status === 'pass' ? '✓' : status === 'fail' ? '✗' : '○'
  console.log(`${icon} [${area}] ${test}${detail ? ` — ${detail}` : ''}`)
}

async function main() {
  console.log('\n=== ReadyBot smoke test ===\n')

  const { getReadyBotPayload } = await import('../readybot/lib/getReadyBotPayload')
  const payload = await getReadyBotPayload()
  const locale = 'en'

  const adminRes = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 1,
    overrideAccess: true,
  })
  const admin = adminRes.docs[0]
  if (!admin?.id) {
    record('setup', 'Find admin user', 'fail', 'No admin user in DB')
    printSummary()
    process.exit(1)
  }
  record('setup', 'Find admin user', 'pass', `id=${admin.id}`)

  const {
    executeGetPipelineStats,
    executeListCandidates,
    executeFindCandidate,
    executeGetCandidateProfile,
    executeListPendingReviews,
    executeUpdateCandidateProfile,
  } = await import('../readybot/chat/toolActions')
  const { runOpsChatBrain } = await import('../readybot/chat/opsChatBrain')
  const {
    createReadyBotChatSession,
    renameReadyBotChatSession,
    deleteReadyBotChatSession,
    getReadyBotChatSession,
  } = await import('../lib/readybot/chatSessions')
  const { applyHumanReviewApproval } = await import('../readybot/services/applyHumanReview')
  const { runInboundReplyWorkflow } = await import('../readybot/workflows/inboundReplyWorkflow')
  const { runFollowUpWorkflow } = await import('../readybot/workflows/followUpWorkflow')
  const { isWhatsAppConfigured } = await import('../readybot/tools/whatsappTool')

  // --- Chat tools (7) ---
  try {
    const stats = await executeGetPipelineStats(payload)
    const ok =
      typeof stats.pendingHumanReviews === 'number' &&
      typeof stats.candidatesInPipeline === 'number'
    record(
      'Chat tools',
      'getPipelineStats',
      ok ? 'pass' : 'fail',
      ok ? `pipeline=${stats.candidatesInPipeline}, reviews=${stats.pendingHumanReviews}` : undefined,
    )
  } catch (e) {
    record('Chat tools', 'getPipelineStats', 'fail', String(e))
  }

  try {
    const list = await executeListCandidates(payload, locale, { limit: 5, page: 1 })
    record(
      'Chat tools',
      'listCandidates',
      list.candidates.length > 0 ? 'pass' : 'fail',
      `returned ${list.candidates.length}/${list.totalDocs}`,
    )
  } catch (e) {
    record('Chat tools', 'listCandidates', 'fail', String(e))
  }

  try {
    const found = await executeFindCandidate(payload, 'Reply', locale)
    const hit = found.candidates.some((c) =>
      String(c.label ?? '').toLowerCase().includes('reply'),
    )
    record(
      'Chat tools',
      'findCandidate',
      hit ? 'pass' : 'fail',
      `query=Reply, hits=${found.candidates.length}`,
    )
  } catch (e) {
    record('Chat tools', 'findCandidate', 'fail', String(e))
  }

  const testCandidateId = 38
  try {
    const profile = await executeGetCandidateProfile(payload, testCandidateId, locale)
    const ok = !('error' in profile) && profile.label != null
    record(
      'Chat tools',
      'getCandidateProfile',
      ok ? 'pass' : 'fail',
      ok ? `label=${profile.label}` : String((profile as { error?: string }).error),
    )
  } catch (e) {
    record('Chat tools', 'getCandidateProfile', 'fail', String(e))
  }

  try {
    const reviews = await executeListPendingReviews(payload, 5)
    record('Chat tools', 'listPendingReviews', 'pass', `pending=${reviews.length}`)
  } catch (e) {
    record('Chat tools', 'listPendingReviews', 'fail', String(e))
  }

  // runScan — lightweight: only verify callable (skip full scan to save time/tokens)
  record(
    'Chat tools',
    'runScan',
    'skip',
    'Callable via chat; full scan tested separately (pnpm readybot:scan)',
  )

  try {
    const before = await payload.findByID({
      collection: 'candidates',
      id: testCandidateId,
      depth: 0,
      overrideAccess: true,
    })
    const originalTitle = (before as { jobTitle?: string }).jobTitle ?? ''
    const testTitle = `Smoke Test ${Date.now()}`
    const update = await executeUpdateCandidateProfile(
      payload,
      {
        candidateId: testCandidateId,
        fields: { jobTitle: testTitle },
        reason: 'readybot-smoke-test',
      },
      admin.id,
    )
    const after = await payload.findByID({
      collection: 'candidates',
      id: testCandidateId,
      depth: 0,
      overrideAccess: true,
    })
    const applied = (after as { jobTitle?: string }).jobTitle === testTitle
    // restore
    await executeUpdateCandidateProfile(
      payload,
      { candidateId: testCandidateId, fields: { jobTitle: originalTitle }, reason: 'smoke-restore' },
      admin.id,
    )
    record(
      'Chat tools',
      'updateCandidateProfile',
      update.success && applied ? 'pass' : 'fail',
      update.success ? `applied jobTitle, restored` : update.error,
    )
  } catch (e) {
    record('Chat tools', 'updateCandidateProfile', 'fail', String(e))
  }

  // --- LangGraph chat brain ---
  const brainCases: Array<{ msg: string; expect: string }> = [
    { msg: 'run scan now', expect: 'scan' },
    { msg: 'how many pending human reviews', expect: 'query' },
    { msg: 'find candidate Reply Pending', expect: 'query' },
    { msg: 'update job title for Reply Pending', expect: 'profile' },
    { msg: 'what is ReadyBot?', expect: 'chat' },
  ]
  for (const { msg, expect } of brainCases) {
    try {
      const out = await runOpsChatBrain(payload, msg, locale)
      const intentOk = out.intent === expect
      const toolsOk =
        expect === 'chat'
          ? Object.keys(out.toolResults).length === 0
          : Object.keys(out.toolResults).length > 0 || expect === 'chat'
      record(
        'LangGraph brain',
        `intent: "${msg.slice(0, 40)}"`,
        intentOk ? 'pass' : 'fail',
        `got=${out.intent}, tools=${Object.keys(out.toolResults).join(',') || 'none'}`,
      )
      if (!toolsOk && expect !== 'chat') {
        record('LangGraph brain', `tools for "${expect}"`, 'fail', 'No tool results')
      }
    } catch (e) {
      record('LangGraph brain', msg.slice(0, 40), 'fail', String(e))
    }
  }

  // --- Chat sessions (sidebar CRUD) ---
  let sessionId: string | number | null = null
  try {
    const session = await createReadyBotChatSession(payload, admin.id, locale)
    sessionId = session.id
    record('Ops chat sessions', 'create session', sessionId ? 'pass' : 'fail', `id=${sessionId}`)

    await renameReadyBotChatSession(payload, sessionId!, admin.id, 'Renamed smoke session')
    const renamed = await getReadyBotChatSession(payload, sessionId!, admin.id)
    record(
      'Ops chat sessions',
      'rename session',
      renamed?.title === 'Renamed smoke session' ? 'pass' : 'fail',
      renamed?.title ?? 'missing',
    )

    await deleteReadyBotChatSession(payload, sessionId!, admin.id)
    const gone = await getReadyBotChatSession(payload, sessionId!, admin.id)
    record('Ops chat sessions', 'delete session', gone == null ? 'pass' : 'fail')
  } catch (e) {
    record('Ops chat sessions', 'CRUD', 'fail', String(e))
    if (sessionId != null) {
      try {
        await deleteReadyBotChatSession(payload, sessionId, admin.id)
      } catch {
        /* cleanup */
      }
    }
  }

  // --- Human review approve ---
  try {
    const pending = await payload.find({
      collection: 'human-review-tasks',
      where: { status: { equals: 'pending' } },
      limit: 1,
      depth: 1,
      overrideAccess: true,
    })
    if (pending.docs.length === 0) {
      // Create a synthetic pending review for smoke test
      const cand = await payload.findByID({
        collection: 'candidates',
        id: 30,
        depth: 0,
        overrideAccess: true,
      })
      const created = await payload.create({
        collection: 'human-review-tasks',
        data: {
          candidate: 30,
          status: 'pending',
          reason: 'smoke-test synthetic review',
          suggestedUpdate: {
            fields: { languages: (cand as { languages?: string }).languages ?? 'Arabic, English' },
          },
        },
        overrideAccess: true,
      })
      const approve = await applyHumanReviewApproval({ payload }, created.id, admin.id)
      record(
        'Human review',
        'approve synthetic review',
        approve.success ? 'pass' : 'fail',
        approve.success ? `reviewId=${created.id}` : approve.error,
      )
    } else {
      const doc = pending.docs[0]
      const approve = await applyHumanReviewApproval({ payload }, doc.id, admin.id)
      record(
        'Human review',
        'approve existing pending review',
        approve.success ? 'pass' : 'fail',
        approve.success ? `reviewId=${doc.id}` : approve.error,
      )
    }
  } catch (e) {
    record('Human review', 'approve flow', 'fail', String(e))
  }

  // --- Inbound reply parsing (no real WhatsApp) ---
  try {
    const inbound = await runInboundReplyWorkflow({
      candidateId: testCandidateId,
      replyText: 'My job title is Senior Carpenter with 10 years experience in Riyadh.',
      externalMessageId: `smoke-${Date.now()}`,
      fromPhone: '+966500000001',
    })
    const ok = inbound.nextAction != null
    record(
      'WhatsApp / inbound',
      'parse inbound reply workflow',
      ok ? 'pass' : 'fail',
      `nextAction=${inbound.nextAction ?? 'none'}`,
    )
  } catch (e) {
    record('WhatsApp / inbound', 'parse inbound reply workflow', 'fail', String(e))
  }

  if (isWhatsAppConfigured()) {
    record('WhatsApp / outbound', 'API credentials', 'pass', 'WHATSAPP_* env set')
    record(
      'WhatsApp / outbound',
      'live send',
      'skip',
      'Not sending real messages in smoke test',
    )
  } else {
    record(
      'WhatsApp / outbound',
      'API credentials',
      'skip',
      'WHATSAPP_ACCESS_TOKEN / PHONE_NUMBER_ID not set',
    )
  }

  // --- Follow-up automation ---
  try {
    const follow = await runFollowUpWorkflow()
    record(
      'Follow-up',
      'runFollowUpWorkflow',
      'pass',
      `processed=${follow.processed}, sent=${follow.sent} (0 expected unless tasks are 2+ days stale)`,
    )
  } catch (e) {
    record('Follow-up', 'runFollowUpWorkflow', 'fail', String(e))
  }

  record(
    'Registration screening',
    'on register hook',
    'skip',
    'Not implemented — roadmap item',
  )

  printSummary()
  const failed = results.filter((r) => r.status === 'fail').length
  process.exit(failed > 0 ? 1 : 0)
}

function printSummary() {
  const pass = results.filter((r) => r.status === 'pass').length
  const fail = results.filter((r) => r.status === 'fail').length
  const skip = results.filter((r) => r.status === 'skip').length
  console.log(`\n=== Summary: ${pass} pass, ${fail} fail, ${skip} skip ===\n`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
