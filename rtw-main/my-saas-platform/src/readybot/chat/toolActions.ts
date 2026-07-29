import type { Payload, Where } from 'payload'
import { query as dbQuery } from '@/lib/db'
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

function buildFindCandidateWhere(trimmed: string): Where {
  const or: Where[] = [
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

  const and: Where[] = []
  if (input.pipelineOnly !== false) {
    and.push(readyBotActiveWhere())
  }
  if (input.screeningStatus?.trim()) {
    and.push({ 'readyBot.screeningStatus': { equals: input.screeningStatus.trim() } })
  }

  const where: Where =
    and.length > 0 ? (and.length === 1 ? and[0]! : { and }) : {}

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

/* ------------------------------------------------------------------ */
/* Read-only analytics tools                                           */
/* ------------------------------------------------------------------ */

export const CANDIDATE_GROUP_DIMENSIONS = [
  'discipline',
  'category',
  'subcategory',
  'primarySkill',
  'screeningStatus',
  'nationality',
  'location',
  'gender',
  'visaStatus',
  'billingClass',
  'profileStatus',
] as const

export type CandidateGroupDimension = (typeof CANDIDATE_GROUP_DIMENSIONS)[number]

const TAXONOMY_JOINS = `
  INNER JOIN skills s ON c.primary_skill_id = s.id
  INNER JOIN subcategories sc ON s.sub_category_id = sc.id
  INNER JOIN categories cat ON sc.category_id = cat.id
  INNER JOIN disciplines d ON cat.discipline_id = d.id`

/** Group-by SQL expression per dimension (taxonomy dims need joins). */
const GROUP_DIMENSION_SQL: Record<
  CandidateGroupDimension,
  { expr: string; joins: string }
> = {
  discipline: { expr: `COALESCE(NULLIF(TRIM(d.name_en), ''), d.name)`, joins: TAXONOMY_JOINS },
  category: { expr: `COALESCE(NULLIF(TRIM(cat.name_en), ''), cat.name)`, joins: TAXONOMY_JOINS },
  subcategory: { expr: `COALESCE(NULLIF(TRIM(sc.name_en), ''), sc.name)`, joins: TAXONOMY_JOINS },
  primarySkill: {
    expr: `COALESCE(NULLIF(TRIM(s.name_en), ''), s.name)`,
    joins: `\n  INNER JOIN skills s ON c.primary_skill_id = s.id`,
  },
  screeningStatus: { expr: `COALESCE(NULLIF(TRIM(c.ready_bot_screening_status::text), ''), '(not set)')`, joins: '' },
  nationality: { expr: `COALESCE(NULLIF(TRIM(c.nationality), ''), '(not set)')`, joins: '' },
  location: { expr: `COALESCE(NULLIF(TRIM(c.location), ''), '(not set)')`, joins: '' },
  gender: { expr: `COALESCE(NULLIF(TRIM(c.gender::text), ''), '(not set)')`, joins: '' },
  visaStatus: { expr: `COALESCE(NULLIF(TRIM(c.visa_status::text), ''), '(not set)')`, joins: '' },
  billingClass: { expr: `COALESCE(NULLIF(TRIM(c.billing_class::text), ''), '(not set)')`, joins: '' },
  profileStatus: { expr: `COALESCE(NULLIF(TRIM(c.profile_status::text), ''), '(not set)')`, joins: '' },
}

export async function executeAggregateCandidates(input: {
  groupBy: CandidateGroupDimension
  screeningStatus?: string
  termsAcceptedOnly?: boolean
  limit?: number
}) {
  const dimension = GROUP_DIMENSION_SQL[input.groupBy]
  if (!dimension) {
    return { error: `Unsupported groupBy "${input.groupBy}". Use one of: ${CANDIDATE_GROUP_DIMENSIONS.join(', ')}` }
  }

  const rowLimit = Math.min(100, Math.max(1, Math.floor(input.limit ?? 30)))
  const params: unknown[] = []
  const conditions: string[] = []
  if (input.termsAcceptedOnly !== false) conditions.push('c.terms_accepted = true')
  if (input.screeningStatus?.trim()) {
    params.push(input.screeningStatus.trim())
    conditions.push(`c.ready_bot_screening_status::text = $${params.length}`)
  }
  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''

  void agentEventService.recordEvent('tool_call', { tool: 'aggregate_candidates', groupBy: input.groupBy }, {})

  const [grouped, totalRes] = await Promise.all([
    dbQuery<{ grp: string; count: string }>(
      `SELECT ${dimension.expr} AS grp, COUNT(*)::int AS count
       FROM candidates c${dimension.joins}
       ${whereSql}
       GROUP BY 1
       ORDER BY 2 DESC, 1 ASC`,
      params,
    ),
    dbQuery<{ total: string }>(`SELECT COUNT(*)::int AS total FROM candidates c ${whereSql}`, params),
  ])

  const total = Number(totalRes.rows[0]?.total ?? 0)
  const allRows = grouped.rows.map((r) => ({
    group: r.grp,
    count: Number(r.count),
    percentOfTotal: total > 0 ? Math.round((Number(r.count) / total) * 1000) / 10 : 0,
  }))
  const rows = allRows.slice(0, rowLimit)
  const truncatedGroups = allRows.length - rows.length
  const groupedSum = allRows.reduce((sum, r) => sum + r.count, 0)
  // Taxonomy joins are INNER, so candidates without a mapped primary skill fall out.
  const unassigned = total - groupedSum

  void agentEventService.recordEvent('tool_result', { tool: 'aggregate_candidates', groupBy: input.groupBy, groups: allRows.length, total }, {})
  return {
    groupBy: input.groupBy,
    totalCandidates: total,
    groupCount: allRows.length,
    rows,
    truncatedGroups: truncatedGroups > 0 ? truncatedGroups : 0,
    unassigned: unassigned > 0 ? { count: unassigned, note: 'Candidates not counted in any group (e.g. no primary skill mapped).' } : null,
    filters: {
      termsAcceptedOnly: input.termsAcceptedOnly !== false,
      screeningStatus: input.screeningStatus ?? null,
    },
  }
}

export type SearchCandidatesFilters = {
  discipline?: string
  category?: string
  skill?: string
  jobTitle?: string
  nationality?: string
  location?: string
  screeningStatus?: string
  gender?: string
  visaStatus?: string
  billingClass?: string
  minExperienceYears?: number
  maxExperienceYears?: number
  termsAcceptedOnly?: boolean
  limit?: number
  page?: number
}

export async function executeSearchCandidates(input: SearchCandidatesFilters, locale = 'en') {
  const limit = Math.min(CHAT_LIST_MAX_ROWS, Math.max(1, Math.floor(input.limit ?? 5)))
  const page = Math.max(1, Math.floor(input.page ?? 1))
  const offset = (page - 1) * limit

  const params: unknown[] = []
  const conditions: string[] = []
  const like = (value: string) => `%${value.trim()}%`

  if (input.termsAcceptedOnly !== false) conditions.push('c.terms_accepted = true')
  if (input.discipline?.trim()) {
    params.push(like(input.discipline))
    const i = params.length
    conditions.push(`(d.name ILIKE $${i} OR COALESCE(d.name_en, '') ILIKE $${i} OR COALESCE(d.slug, '') ILIKE $${i})`)
  }
  if (input.category?.trim()) {
    params.push(like(input.category))
    const i = params.length
    conditions.push(`(cat.name ILIKE $${i} OR COALESCE(cat.name_en, '') ILIKE $${i})`)
  }
  if (input.skill?.trim()) {
    params.push(like(input.skill))
    const i = params.length
    conditions.push(`(s.name ILIKE $${i} OR COALESCE(s.name_en, '') ILIKE $${i})`)
  }
  if (input.jobTitle?.trim()) {
    params.push(like(input.jobTitle))
    conditions.push(`c.job_title ILIKE $${params.length}`)
  }
  if (input.nationality?.trim()) {
    params.push(like(input.nationality))
    conditions.push(`c.nationality ILIKE $${params.length}`)
  }
  if (input.location?.trim()) {
    params.push(like(input.location))
    conditions.push(`c.location ILIKE $${params.length}`)
  }
  if (input.screeningStatus?.trim()) {
    params.push(input.screeningStatus.trim())
    conditions.push(`c.ready_bot_screening_status::text = $${params.length}`)
  }
  if (input.gender?.trim()) {
    params.push(input.gender.trim())
    conditions.push(`c.gender::text = $${params.length}`)
  }
  if (input.visaStatus?.trim()) {
    params.push(input.visaStatus.trim())
    conditions.push(`c.visa_status::text = $${params.length}`)
  }
  if (input.billingClass?.trim()) {
    params.push(input.billingClass.trim())
    conditions.push(`c.billing_class::text = $${params.length}`)
  }
  if (typeof input.minExperienceYears === 'number') {
    params.push(input.minExperienceYears)
    conditions.push(`c.experience_years >= $${params.length}`)
  }
  if (typeof input.maxExperienceYears === 'number') {
    params.push(input.maxExperienceYears)
    conditions.push(`c.experience_years <= $${params.length}`)
  }

  const whereSql = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
  const fromSql = `
    FROM candidates c
    LEFT JOIN skills s ON c.primary_skill_id = s.id
    LEFT JOIN subcategories sc ON s.sub_category_id = sc.id
    LEFT JOIN categories cat ON sc.category_id = cat.id
    LEFT JOIN disciplines d ON cat.discipline_id = d.id`

  void agentEventService.recordEvent('tool_call', { tool: 'search_candidates', filters: Object.keys(input) }, {})

  const [countRes, rowsRes] = await Promise.all([
    dbQuery<{ total: string }>(`SELECT COUNT(*)::int AS total ${fromSql} ${whereSql}`, params),
    dbQuery<{
      id: string
      first_name: string | null
      last_name: string | null
      job_title: string | null
      skill_name: string | null
      discipline_name: string | null
      nationality: string | null
      location: string | null
      experience_years: string | null
      screening_status: string | null
    }>(
      `SELECT c.id, c.first_name, c.last_name, c.job_title,
              COALESCE(NULLIF(TRIM(s.name_en), ''), s.name) AS skill_name,
              COALESCE(NULLIF(TRIM(d.name_en), ''), d.name) AS discipline_name,
              c.nationality, c.location, c.experience_years,
              c.ready_bot_screening_status::text AS screening_status
       ${fromSql}
       ${whereSql}
       ORDER BY c.updated_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      params,
    ),
  ])

  const totalDocs = Number(countRes.rows[0]?.total ?? 0)
  const candidates = rowsRes.rows.map((r) => {
    const name = [r.first_name, r.last_name].filter(Boolean).join(' ').trim() || `Candidate ${r.id}`
    const dashboardUrl = `/${locale}/readybot/candidates/${r.id}`
    return {
      id: Number(r.id),
      name,
      jobTitle: r.job_title,
      primarySkill: r.skill_name,
      discipline: r.discipline_name,
      nationality: r.nationality,
      location: r.location,
      experienceYears: r.experience_years != null ? Number(r.experience_years) : null,
      screeningStatus: r.screening_status,
      dashboardUrl,
      dashboardLinkLine: `${name} (ID ${r.id}) — Dashboard: ${dashboardUrl}`,
    }
  })

  void agentEventService.recordEvent('tool_result', { tool: 'search_candidates', totalDocs, returned: candidates.length }, {})
  return {
    page,
    limit,
    totalDocs,
    totalPages: Math.max(1, Math.ceil(totalDocs / limit)),
    candidates,
    dashboardLinks: candidates.map((c) => c.dashboardLinkLine),
    bulkBrowse:
      totalDocs > CHAT_LIST_REDIRECT_THRESHOLD
        ? {
            totalMatching: totalDocs,
            payloadAdminUrl: PAYLOAD_CANDIDATES_ADMIN_PATH,
            message: `${totalDocs} candidates match. Chat shows at most ${CHAT_LIST_MAX_ROWS} rows per page — for full browsing/export use Payload Admin (${PAYLOAD_CANDIDATES_ADMIN_PATH}) or narrow the filters.`,
          }
        : null,
    replyInstruction:
      'Summarize the match count, then list each returned row with its dashboardLinkLine. Read-only — never claim you changed anything.',
  }
}

export async function executeGetSiteStats(payload: Payload) {
  void agentEventService.recordEvent('tool_call', { tool: 'get_site_stats' }, {})
  const [
    candidatesTotal,
    candidatesRegistered,
    employers,
    jobPostings,
    interviews,
    skills,
    disciplines,
    contactSubmissions,
    newsletterSubscriptions,
  ] = await Promise.all([
    payload.count({ collection: 'candidates', overrideAccess: true }),
    payload.count({
      collection: 'candidates',
      where: { termsAccepted: { equals: true } },
      overrideAccess: true,
    }),
    payload.count({ collection: 'employers', overrideAccess: true }),
    payload.count({ collection: 'job-postings', overrideAccess: true }),
    payload.count({ collection: 'interviews', overrideAccess: true }),
    payload.count({ collection: 'skills', overrideAccess: true }),
    payload.count({ collection: 'disciplines', overrideAccess: true }),
    payload.count({ collection: 'contact-submissions', overrideAccess: true }),
    payload.count({ collection: 'newsletter-subscriptions', overrideAccess: true }),
  ])

  return {
    candidatesTotal: candidatesTotal.totalDocs,
    candidatesRegistered: candidatesRegistered.totalDocs,
    employers: employers.totalDocs,
    jobPostings: jobPostings.totalDocs,
    interviews: interviews.totalDocs,
    skills: skills.totalDocs,
    disciplines: disciplines.totalDocs,
    contactSubmissions: contactSubmissions.totalDocs,
    newsletterSubscriptions: newsletterSubscriptions.totalDocs,
  }
}
