import 'server-only'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Payload } from 'payload'
import type { Candidate } from '@/payload-types'
import {
  candidateLabelFromDoc,
  previewText,
  relId,
  startOfTodayIso,
  toCandidateRef,
} from './dashboard-helpers'
import { readyBotActiveWhere } from '@/readybot/lib/candidateReadyBot'
import type { ReadyBotActivityMeta } from '@/readybot/tools/activityLog'
import type {
  ReadyBotAuditRow,
  ReadyBotCandidateDetailData,
  ReadyBotDashboardData,
  ReadyBotDashboardStats,
  ReadyBotHumanReviewRow,
  ReadyBotMemoryRow,
  ReadyBotMessageRow,
  ReadyBotScreeningResultRow,
  ReadyBotTaskRow,
} from './dashboard-types'

const LIST_LIMIT = 80

async function getPayloadClient() {
  return getPayload({ config: configPromise })
}

/** Stay under postgres pool max (10) — dashboard was firing many queries at once. */
async function runInBatches(
  tasks: Array<() => Promise<any>>,
  batchSize = 4,
): Promise<any[]> {
  const results: any[] = []
  for (let i = 0; i < tasks.length; i += batchSize) {
    const batch = tasks.slice(i, i + batchSize)
    results.push(...(await Promise.all(batch.map((fn) => fn()))))
  }
  return results
}

export async function loadReadyBotDashboard(): Promise<ReadyBotDashboardData> {
  const payload = await getPayloadClient()
  const today = startOfTodayIso()

  const [
    pendingReviews,
    activeTasks,
    contactedToday,
    inboundToday,
    outboundToday,
    resultsTotal,
    pipelineCandidates,
    screeningResults,
    tasks,
    messages,
    memories,
    humanReviews,
    auditLogs,
    statusNew,
    statusIncomplete,
    statusContacted,
    statusAwaiting,
    statusInfoReceived,
    statusNeedsReview,
    statusVerified,
    statusUnresponsive,
  ] = await runInBatches([
    () =>
      payload.count({
        collection: 'human-review-tasks',
        where: { status: { equals: 'pending' } },
        overrideAccess: true,
      }),
    () =>
      payload.count({
        collection: 'candidate-screening-tasks',
        where: {
          status: {
            in: ['pending', 'message_sent', 'awaiting_reply', 'reply_received', 'needs_human_review'],
          },
        },
        overrideAccess: true,
      }),
    () =>
      payload.count({
        collection: 'candidates',
        where: { 'readyBot.lastContactedAt': { greater_than_equal: today } },
        overrideAccess: true,
      }),
    () =>
      payload.count({
        collection: 'candidate-messages',
        where: {
          and: [
            { direction: { equals: 'inbound' } },
            { receivedAt: { greater_than_equal: today } },
          ],
        },
        overrideAccess: true,
      }),
    () =>
      payload.count({
        collection: 'candidate-messages',
        where: {
          and: [
            { direction: { equals: 'outbound' } },
            { sentAt: { greater_than_equal: today } },
          ],
        },
        overrideAccess: true,
      }),
    () => payload.count({ collection: 'screening-results', overrideAccess: true }),
    () =>
      payload.find({
        collection: 'candidates',
        where: readyBotActiveWhere(),
        limit: 40,
        sort: '-updatedAt',
        depth: 0,
        overrideAccess: true,
      }),
    () =>
      payload.find({
        collection: 'screening-results',
        limit: LIST_LIMIT,
        sort: '-updatedAt',
        depth: 1,
        overrideAccess: true,
      }),
    () =>
      payload.find({
        collection: 'candidate-screening-tasks',
        limit: LIST_LIMIT,
        sort: '-updatedAt',
        depth: 1,
        overrideAccess: true,
      }),
    () =>
      payload.find({
        collection: 'candidate-messages',
        limit: LIST_LIMIT,
        sort: '-createdAt',
        depth: 1,
        overrideAccess: true,
      }),
    () =>
      payload.find({
        collection: 'candidate-memory',
        limit: LIST_LIMIT,
        sort: '-updatedAt',
        depth: 1,
        overrideAccess: true,
      }),
    () =>
      payload.find({
        collection: 'human-review-tasks',
        limit: LIST_LIMIT,
        sort: '-createdAt',
        depth: 1,
        overrideAccess: true,
      }),
    () =>
      payload.find({
        collection: 'agent-audit-logs',
        limit: LIST_LIMIT,
        sort: '-createdAt',
        depth: 1,
        overrideAccess: true,
      }),
    () => countByStatus(payload, 'new'),
    () => countByStatus(payload, 'incomplete'),
    () => countByStatus(payload, 'contacted'),
    () => countByStatus(payload, 'awaiting_reply'),
    () => countByStatus(payload, 'info_received'),
    () => countByStatus(payload, 'needs_human_review'),
    () => countByStatus(payload, 'verified'),
    () => countByStatus(payload, 'unresponsive'),
  ])

  const stats: ReadyBotDashboardStats = {
    pendingHumanReview: pendingReviews.totalDocs,
    activeTasks: activeTasks.totalDocs,
    contactedToday: contactedToday.totalDocs,
    inboundToday: inboundToday.totalDocs,
    outboundToday: outboundToday.totalDocs,
    screeningResultsTotal: resultsTotal.totalDocs,
    candidatesInPipeline: pipelineCandidates.totalDocs,
    byStatus: {
      new: statusNew,
      incomplete: statusIncomplete,
      contacted: statusContacted,
      awaiting_reply: statusAwaiting,
      info_received: statusInfoReceived,
      needs_human_review: statusNeedsReview,
      verified: statusVerified,
      unresponsive: statusUnresponsive,
    },
  }

  return {
    stats,
    screeningResults: (screeningResults.docs as Array<Record<string, unknown>>).map((d) =>
      mapScreeningResult(d),
    ),
    tasks: (tasks.docs as Array<Record<string, unknown>>).map((d) => mapTask(d)),
    messages: (messages.docs as Array<Record<string, unknown>>).map((d) => mapMessage(d)),
    memories: (memories.docs as Array<Record<string, unknown>>).map((d) => mapMemory(d)),
    humanReviews: (humanReviews.docs as Array<Record<string, unknown>>).map((d) =>
      mapHumanReview(d),
    ),
    auditLogs: (auditLogs.docs as Array<Record<string, unknown>>).map((d) => mapAudit(d)),
    pipelineCandidates: (pipelineCandidates.docs as Candidate[]).map((c) => toCandidateRef(c)),
  }
}

async function countByStatus(payload: Payload, status: string): Promise<number> {
  const res = await payload.count({
    collection: 'candidates',
    where: { 'readyBot.screeningStatus': { equals: status } },
    overrideAccess: true,
  })
  return res.totalDocs
}

function mapScreeningResult(doc: Record<string, unknown>): ReadyBotScreeningResultRow {
  const gaps = (doc.gaps as { gap?: string }[] | undefined) ?? []
  const questions =
    (doc.recommendedQuestions as { question?: string }[] | undefined) ?? []
  return {
    id: String(doc.id),
    candidate: toCandidateRef(doc.candidate as Candidate),
    targetRoleTitle: String(doc.targetRoleTitle ?? '—'),
    fitScore: doc.fitScore as number | null | undefined,
    status: String(doc.status ?? 'draft'),
    fitSummary: previewText(doc.fitSummary as string, 200),
    gapCount: gaps.length,
    questionCount: questions.length,
    updatedAt: String(doc.updatedAt ?? ''),
  }
}

function mapTask(doc: Record<string, unknown>): ReadyBotTaskRow {
  const missing = (doc.missingFields as { field?: string }[] | undefined) ?? []
  return {
    id: String(doc.id),
    candidate: toCandidateRef(doc.candidate as Candidate),
    status: String(doc.status ?? 'pending'),
    channel: String(doc.channel ?? 'whatsapp'),
    attemptCount: doc.attemptCount as number | null | undefined,
    missingFieldCount: missing.length,
    messagePreview: previewText(doc.messageBody as string, 100),
    messageBody: (doc.messageBody as string) ?? null,
    lastSentAt: (doc.lastSentAt as string) ?? null,
    replyReceivedAt: (doc.replyReceivedAt as string) ?? null,
    updatedAt: String(doc.updatedAt ?? ''),
  }
}

function mapMessage(
  doc: Record<string, unknown>,
  bodyMax = 160,
): ReadyBotMessageRow {
  return {
    id: String(doc.id),
    candidate: toCandidateRef(doc.candidate as Candidate),
    direction: String(doc.direction ?? ''),
    channel: String(doc.channel ?? ''),
    status: String(doc.status ?? ''),
    bodyPreview: previewText(doc.body as string, bodyMax) ?? '—',
    sentAt: (doc.sentAt as string) ?? null,
    receivedAt: (doc.receivedAt as string) ?? null,
    createdAt: String(doc.createdAt ?? ''),
  }
}

function mapMemory(
  doc: Record<string, unknown>,
  cvMax = 140,
  convMax = 140,
): ReadyBotMemoryRow {
  const confirmed = (doc.confirmedFields as unknown[] | undefined) ?? []
  const missing = (doc.missingFields as unknown[] | undefined) ?? []
  const risks = (doc.riskFlags as unknown[] | undefined) ?? []
  return {
    id: String(doc.id),
    candidate: toCandidateRef(doc.candidate as Candidate),
    cvSummaryPreview: previewText(doc.cvSummary as string, cvMax),
    conversationSummaryPreview: previewText(doc.conversationSummary as string, convMax),
    missingFieldCount: missing.length,
    confirmedCount: confirmed.length,
    riskCount: risks.length,
    lastAgentDecision: previewText(doc.lastAgentDecision as string, 160),
    updatedAt: String(doc.updatedAt ?? ''),
  }
}

function mapHumanReview(doc: Record<string, unknown>): ReadyBotHumanReviewRow {
  return {
    id: String(doc.id),
    candidate: toCandidateRef(doc.candidate as Candidate),
    status: String(doc.status ?? 'pending'),
    reason: String(doc.reason ?? ''),
    suggestedUpdate: doc.suggestedUpdate,
    createdAt: String(doc.createdAt ?? ''),
  }
}

function mapAudit(doc: Record<string, unknown>): ReadyBotAuditRow {
  const candidate = doc.candidate as Candidate | number | string | null | undefined
  const after = doc.afterData as ReadyBotActivityMeta | undefined
  return {
    id: String(doc.id),
    action: String(doc.action ?? ''),
    candidateId: relId(candidate),
    candidateLabel:
      after?.candidateLabel ??
      (candidate ? candidateLabelFromDoc(candidate as Candidate) : null),
    toolUsed: (doc.toolUsed as string) ?? null,
    confidence: doc.confidence as number | null | undefined,
    modelUsed: (doc.modelUsed as string) ?? null,
    reasonPreview: previewText((after?.step ?? doc.reason) as string, 100),
    createdAt: String(doc.createdAt ?? ''),
    phase: after?.phase,
    step: after?.step ?? (doc.reason as string | undefined),
    status: after?.status,
    detail: after?.detail,
    workflowRunId:
      after?.workflowRunId ?? (after?.detail?.workflowRunId as string | undefined),
    workflowName:
      after?.workflowName ?? (after?.detail?.workflowName as string | undefined),
    stepIndex: after?.stepIndex ?? (after?.detail?.stepIndex as number | undefined),
  }
}

export async function loadReadyBotCandidateDetail(
  candidateId: string,
): Promise<ReadyBotCandidateDetailData | null> {
  const payload = await getPayloadClient()
  const id = Number.isNaN(Number(candidateId)) ? candidateId : Number(candidateId)

  let candidate: Candidate
  try {
    candidate = (await payload.findByID({
      collection: 'candidates',
      id,
      depth: 0,
      overrideAccess: true,
    })) as Candidate
  } catch {
    return null
  }

  const cid = candidate.id

  const [memoryRes, results, tasks, messages, reviews, audits] = await Promise.all([
    payload.find({
      collection: 'candidate-memory',
      where: { candidate: { equals: cid } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'screening-results',
      where: { candidate: { equals: cid } },
      limit: 20,
      sort: '-updatedAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'candidate-screening-tasks',
      where: { candidate: { equals: cid } },
      limit: 30,
      sort: '-updatedAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'candidate-messages',
      where: { candidate: { equals: cid } },
      limit: 50,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'human-review-tasks',
      where: { candidate: { equals: cid } },
      limit: 20,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    }),
    payload.find({
      collection: 'agent-audit-logs',
      where: { candidate: { equals: cid } },
      limit: 40,
      sort: '-createdAt',
      depth: 0,
      overrideAccess: true,
    }),
  ])

  const rb = (candidate as Candidate & { readyBot?: Record<string, unknown> }).readyBot ?? {}

  return {
    candidate: {
      id: String(candidate.id),
      label: candidateLabelFromDoc(candidate),
      email: candidate.email ?? null,
      phone: candidate.phone ?? null,
      jobTitle: candidate.jobTitle ?? null,
      readyBot: {
        readyBotEnabled: rb.readyBotEnabled as boolean | null | undefined,
        screeningStatus: rb.screeningStatus as string | null | undefined,
        missingFields: (rb.missingFields as { field: string }[] | undefined) ?? [],
        whatsappNumber: rb.whatsappNumber as string | null | undefined,
        whatsappOptIn: rb.whatsappOptIn as boolean | null | undefined,
        lastScreenedAt: rb.lastScreenedAt as string | null | undefined,
        lastContactedAt: rb.lastContactedAt as string | null | undefined,
        lastReplyAt: rb.lastReplyAt as string | null | undefined,
        screeningSummary: rb.screeningSummary as string | null | undefined,
        screeningConfidence: rb.screeningConfidence as number | null | undefined,
      },
    },
    memory: memoryRes.docs[0]
      ? mapMemory(memoryRes.docs[0] as unknown as Record<string, unknown>, 3000, 3000)
      : null,
    screeningResults: results.docs.map((d) =>
      mapScreeningResult({ ...d, candidate } as Record<string, unknown>),
    ),
    tasks: tasks.docs.map((d) => mapTask({ ...d, candidate } as Record<string, unknown>)),
    messages: messages.docs.map((d) =>
      mapMessage({ ...d, candidate } as Record<string, unknown>, 4000),
    ),
    humanReviews: reviews.docs.map((d) =>
      mapHumanReview({ ...d, candidate } as Record<string, unknown>),
    ),
    auditLogs: audits.docs.map((d) => mapAudit(d as unknown as Record<string, unknown>)),
  }
}
