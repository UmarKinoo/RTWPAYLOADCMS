import type { Payload } from 'payload'
import { scanIncompleteCandidates } from '@/trigger/scanIncompleteCandidates'
import { loadReadyBotSettings } from '@/lib/readybot/settings'
import { candidateLabelFromDoc } from '@/lib/readybot/dashboard-helpers'
import type { Candidate } from '@/payload-types'
import { createAuditLog } from '@/readybot/tools/auditLogTool'
import {
  getCandidate,
  normalizeRelationshipId,
  updateCandidateHumanApprovedFields,
  updateCandidateScreeningMeta,
} from '@/readybot/tools/payloadTool'
import {
  CHAT_LIST_MAX_ROWS,
  CHAT_LIST_REDIRECT_THRESHOLD,
  PAYLOAD_CANDIDATES_ADMIN_PATH,
} from './chatGuards'
import { readyBotActiveWhere } from '../lib/candidateReadyBot'
import {
  normalizeChatProfileFields,
  summarizeCandidateProfile,
} from './profileFields'
import { agentEventService } from '@/readybot/agent/agentEventService'

export async function executeRunScan() {
  void agentEventService.recordEvent('tool_call', { tool: 'run_scan' }, {})
  const result = await scanIncompleteCandidates()
  void agentEventService.recordEvent('tool_result', { tool: 'run_scan', scanned: result.scanned, tasksCreated: result.tasksCreated }, {})
  return {
    scanned: result.scanned,
    tasksCreated: result.tasksCreated,
    errorCount: result.errors.length,
    errors: result.errors.slice(0, 5),
    langGraph: true,
  }
}

export async function executeListPendingReviews(payload: Payload, limit = 10) {
  const res = await payload.find({
    collection: 'human-review-tasks',
    where: { status: { equals: 'pending' } },
    sort: '-createdAt',
    limit,
    depth: 1,
    overrideAccess: true,
  })
  return res.docs.map((doc) => {
    const candidate =
      typeof doc.candidate === 'object' ? doc.candidate : null
    return {
      reviewId: doc.id,
      candidateId: candidate?.id ?? doc.candidate,
      candidateLabel: candidate ? candidateLabelFromDoc(candidate as Candidate) : null,
      reason: doc.reason,
      createdAt: doc.createdAt,
    }
  })
}

export async function executeGetPipelineStats(payload: Payload) {
  const settings = await loadReadyBotSettings(payload)
  const [pendingReviews, activeTasks, screeningResults, pipeline] = await Promise.all([
    payload.count({
      collection: 'human-review-tasks',
      where: { status: { equals: 'pending' } },
      overrideAccess: true,
    }),
    payload.count({
      collection: 'candidate-screening-tasks',
      where: {
        status: {
          in: ['pending', 'message_sent', 'awaiting_reply', 'reply_received'],
        },
      },
      overrideAccess: true,
    }),
    payload.count({ collection: 'screening-results', overrideAccess: true }),
    payload.count({
      collection: 'candidates',
      where: readyBotActiveWhere(),
      overrideAccess: true,
    }),
  ])

  return {
    useLangGraphMultiAgent: settings.useLangGraphMultiAgent,
    parallelAgentCount: settings.parallelAgentCount,
    useLangGraphChatBrain: settings.useLangGraphChatBrain,
    pendingHumanReviews: pendingReviews.totalDocs,
    activeScreeningTasks: activeTasks.totalDocs,
    screeningResultsTotal: screeningResults.totalDocs,
    candidatesInPipeline: pipeline.totalDocs,
  }
}

function buildFindCandidateWhere(trimmed: string) {
  const or: Record<string, unknown>[] = [
    { email: { contains: trimmed } },
    { firstName: { contains: trimmed } },
    { lastName: { contains: trimmed } },
    { jobTitle: { contains: trimmed } },
  ]

  const words = trimmed.split(/\s+/).filter((w) => w.length >= 2)
  if (words.length >= 2) {
    or.push({
      and: [
        { firstName: { contains: words[0] } },
        { lastName: { contains: words.slice(1).join(' ') } },
      ],
    })
  }

  return { or }
}

export async function executeFindCandidate(
  payload: Payload,
  query: string,
  locale = 'en',
) {
  const trimmed = query.trim()
  if (!trimmed) {
    return {
      query: trimmed,
      candidates: [] as Array<Record<string, unknown>>,
      dashboardLinks: [] as string[],
    }
  }

  const res = await payload.find({
    collection: 'candidates',
    where: buildFindCandidateWhere(trimmed),
    limit: 8,
    depth: 1,
    overrideAccess: true,
  })

  const candidates = res.docs.map((c) => {
    const doc = c as Candidate
    const dashboardUrl = `/${locale}/readybot/candidates/${doc.id}`
    const label = candidateLabelFromDoc(doc)
    return {
      ...summarizeCandidateProfile(doc, dashboardUrl),
      dashboardUrl,
      dashboardLinkLine: `${label} (ID ${doc.id}) — Dashboard: ${dashboardUrl}`,
    }
  })

  return {
    query: trimmed,
    candidates,
    count: candidates.length,
    dashboardLinks: candidates.map((c) => c.dashboardLinkLine as string),
    replyInstruction:
      candidates.length > 0
        ? 'Include every dashboardLinkLine from this result verbatim in your reply (one per line).'
        : 'No matches — say so clearly; do not invent URLs.',
  }
}

export async function executeListCandidates(
  payload: Payload,
  locale: string,
  input: {
    limit?: number
    page?: number
    screeningStatus?: string
    pipelineOnly?: boolean
  },
) {
  const page = Math.max(1, Math.floor(input.page ?? 1))
  const limit = Math.min(CHAT_LIST_MAX_ROWS, Math.max(1, Math.floor(input.limit ?? 5)))

  const and: Record<string, unknown>[] = []
  if (input.pipelineOnly !== false) {
    and.push(readyBotActiveWhere())
  }
  if (input.screeningStatus?.trim()) {
    and.push({ 'readyBot.screeningStatus': { equals: input.screeningStatus.trim() } })
  }

  const where = and.length > 0 ? (and.length === 1 ? and[0] : { and }) : {}

  const res = await payload.find({
    collection: 'candidates',
    where,
    limit,
    page,
    sort: '-updatedAt',
    depth: 0,
    overrideAccess: true,
  })

  const totalDocs = res.totalDocs ?? 0
  const candidates = res.docs.map((doc) => {
    const c = doc as Candidate
    const label = candidateLabelFromDoc(c)
    const dashboardUrl = `/${locale}/readybot/candidates/${c.id}`
    return {
      id: c.id,
      label,
      jobTitle: c.jobTitle ?? null,
      screeningStatus: c.readyBot?.screeningStatus ?? null,
      dashboardUrl,
      dashboardLinkLine: `${label} (ID ${c.id}) — Dashboard: ${dashboardUrl}`,
    }
  })

  const bulkBrowse =
    totalDocs > CHAT_LIST_REDIRECT_THRESHOLD
      ? {
          totalMatching: totalDocs,
          payloadAdminUrl: PAYLOAD_CANDIDATES_ADMIN_PATH,
          readyBotDashboardUrl: `/${locale}/readybot`,
          message: `${totalDocs} candidates match — too many for chat. Use Payload Admin (${PAYLOAD_CANDIDATES_ADMIN_PATH}) for filters/export, or ReadyBot dashboard for pipeline ops. Chat returns at most ${CHAT_LIST_MAX_ROWS} compact rows per request.`,
        }
      : null

  return {
    page: res.page ?? page,
    limit,
    totalDocs,
    totalPages: res.totalPages ?? 1,
    hasNextPage: !!res.hasNextPage,
    hasPrevPage: !!res.hasPrevPage,
    compact: true,
    candidates,
    dashboardLinks: candidates.map((c) => c.dashboardLinkLine),
    bulkBrowse,
    replyInstruction:
      'Summarize count + screening statuses. Include dashboardLinkLine for each row returned. If bulkBrowse is set, tell the admin to use Payload Admin or ReadyBot dashboard — do not ask to load more pages in chat.',
  }
}

export async function executeGetCandidateProfile(
  payload: Payload,
  candidateId: string | number,
  locale: string,
) {
  const id = normalizeRelationshipId(candidateId)
  if (id === undefined) return { error: 'Invalid candidate ID' }

  try {
    void agentEventService.recordEvent('tool_call', { tool: 'read_candidate_profile', candidateId }, {})
    const doc = (await payload.findByID({
      collection: 'candidates',
      id,
      depth: 1,
      overrideAccess: true,
    })) as Candidate
    const dashboardUrl = `/${locale}/readybot/candidates/${id}`

    const [memoryRes, screeningRes, messagesRes, tasksRes] = await Promise.all([
      payload.find({
        collection: 'candidate-memory',
        where: { candidate: { equals: id } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'screening-results',
        where: { candidate: { equals: id } },
        sort: '-updatedAt',
        limit: 1,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'candidate-messages',
        where: { candidate: { equals: id } },
        sort: '-createdAt',
        limit: 8,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'candidate-screening-tasks',
        where: { candidate: { equals: id } },
        sort: '-updatedAt',
        limit: 3,
        depth: 0,
        overrideAccess: true,
      }),
    ])

    const memory = memoryRes.docs[0] as
      | {
          profileSummary?: string | null
          cvSummary?: string | null
          conversationSummary?: string | null
          confirmedFields?: { field?: string | null }[] | null
          unconfirmedFields?: { field?: string | null }[] | null
          missingFields?: { field?: string | null }[] | null
          lastQuestionAsked?: string | null
          lastAgentDecision?: string | null
          riskFlags?: { flag?: string | null }[] | null
        }
      | undefined

    const latestScreening = screeningRes.docs[0] as
      | {
          fitScore?: number | null
          fitSummary?: string | null
          gaps?: { gap?: string | null }[] | null
          recommendedQuestions?: { question?: string | null }[] | null
          needsHumanReview?: boolean | null
        }
      | undefined

    void agentEventService.recordEvent('tool_result', { tool: 'read_candidate_profile', candidateId, success: true }, {})
    return {
      label: candidateLabelFromDoc(doc),
      profile: summarizeCandidateProfile(doc, dashboardUrl),
      agentMemory: memory
        ? {
            profileSummary: memory.profileSummary ?? null,
            cvSummary: memory.cvSummary ?? null,
            conversationSummary: memory.conversationSummary ?? null,
            confirmedFields:
              memory.confirmedFields?.map((f) => f.field).filter(Boolean) ?? [],
            unconfirmedFields:
              memory.unconfirmedFields?.map((f) => f.field).filter(Boolean) ?? [],
            missingFields:
              memory.missingFields?.map((f) => f.field).filter(Boolean) ?? [],
            lastQuestionAsked: memory.lastQuestionAsked ?? null,
            lastAgentDecision: memory.lastAgentDecision ?? null,
            riskFlags: memory.riskFlags?.map((f) => f.flag).filter(Boolean) ?? [],
          }
        : null,
      latestScreening: latestScreening
        ? {
            fitScore: latestScreening.fitScore ?? null,
            fitSummary: latestScreening.fitSummary ?? null,
            gaps: latestScreening.gaps?.map((g) => g.gap).filter(Boolean) ?? [],
            recommendedQuestions:
              latestScreening.recommendedQuestions?.map((q) => q.question).filter(Boolean) ??
              [],
            needsHumanReview: latestScreening.needsHumanReview ?? null,
          }
        : null,
      recentMessages: messagesRes.docs.map((m) => {
        const msg = m as {
          direction?: string
          channel?: string
          body?: string
          sentAt?: string
          receivedAt?: string
        }
        const body = msg.body?.trim() ?? ''
        return {
          direction: msg.direction ?? null,
          channel: msg.channel ?? null,
          body: body.length > 280 ? `${body.slice(0, 280)}…` : body,
          at: msg.sentAt ?? msg.receivedAt ?? null,
        }
      }),
      screeningTasks: tasksRes.docs.map((t) => {
        const task = t as { id?: unknown; status?: string; attempts?: number; channel?: string }
        return {
          id: task.id,
          status: task.status ?? null,
          attempts: task.attempts ?? null,
          channel: task.channel ?? null,
        }
      }),
    }
  } catch {
    return { error: `Candidate ${id} not found` }
  }
}

export async function executeUpdateCandidateProfile(
  payload: Payload,
  input: {
    candidateId: number
    fields: Record<string, unknown>
    reason?: string
  },
  adminUserId: string | number,
) {
  const candidateId = normalizeRelationshipId(input.candidateId)
  if (candidateId === undefined) {
    return { success: false, error: 'Invalid candidate ID' }
  }

  const resolved = await normalizeChatProfileFields(payload, input.fields)
  if ('error' in resolved) {
    return { success: false, error: resolved.error }
  }

  void agentEventService.recordEvent('tool_call', { tool: 'update_candidate_profile', candidateId, fields: Object.keys(input.fields) }, {})
  const before = await getCandidate({ payload }, candidateId)
  const updateResult = await updateCandidateHumanApprovedFields(
    { payload },
    candidateId,
    resolved.fields,
  )
  if (!updateResult.success) {
    return { success: false, error: updateResult.reason }
  }

  await updateCandidateScreeningMeta({ payload }, candidateId, {
    screeningStatus: 'incomplete',
    lastScreenedAt: new Date().toISOString(),
  })

  await createAuditLog(
    { payload },
    {
      action: 'chat_profile_update_approved',
      candidateId,
      beforeData: updateResult.before,
      afterData: updateResult.after,
      reason: input.reason,
      toolUsed: 'updateCandidateProfile',
    },
  )

  void agentEventService.recordEvent('profile_update', { tool: 'update_candidate_profile', candidateId, fields: Object.keys(input.fields), reason: input.reason }, {})
  return {
    success: true,
    candidateId,
    label: candidateLabelFromDoc(before as Candidate),
    applied: resolved.preview,
    reason: input.reason ?? null,
    reviewedBy: adminUserId,
  }
}
