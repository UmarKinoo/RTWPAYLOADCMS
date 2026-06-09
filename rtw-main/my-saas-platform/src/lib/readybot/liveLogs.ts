import 'server-only'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import type { Payload } from 'payload'
import { relId } from './dashboard-helpers'
import type { ReadyBotActivityMeta } from '@/readybot/tools/activityLog'
import type { ReadyBotLiveLogRow } from './dashboard-types'

const LIVE_LIMIT = 60

export async function loadReadyBotLiveLogs(
  since?: string,
): Promise<{
  logs: ReadyBotLiveLogRow[]
  serverTime: string
}> {
  const payload = await getPayload({ config: configPromise })
  const where: Record<string, unknown> = {
    agentName: { equals: 'ReadyBot' },
  }

  if (since) {
    where.createdAt = { greater_than: since }
  }

  const result = await payload.find({
    collection: 'agent-audit-logs',
    where: where as never,
    sort: '-createdAt',
    limit: LIVE_LIMIT,
    depth: 1,
    overrideAccess: true,
  })

  const logs = result.docs.map((doc) => mapLiveLog(doc as unknown as Record<string, unknown>))

  return { logs, serverTime: new Date().toISOString() }
}

function mapLiveLog(doc: Record<string, unknown>): ReadyBotLiveLogRow {
  const after = doc.afterData as ReadyBotActivityMeta | undefined
  const legacyAfter =
    after?.phase == null && doc.afterData && typeof doc.afterData === 'object'
      ? (doc.afterData as Record<string, unknown>)
      : null

  const candidate = doc.candidate as { id?: number; firstName?: string; lastName?: string; email?: string } | number | null
  let candidateLabel = after?.candidateLabel ?? null
  if (!candidateLabel && candidate && typeof candidate === 'object') {
    const name = [candidate.firstName, candidate.lastName].filter(Boolean).join(' ')
    candidateLabel = name || candidate.email || (candidate.id != null ? `Candidate #${candidate.id}` : null)
  }

  const phase =
    after?.phase ??
    (legacyAfter?.phase as string | undefined) ??
    inferPhaseFromAction(String(doc.action ?? ''))

  const step =
    after?.step ??
    (doc.reason as string | undefined) ??
    String(doc.action ?? 'Activity')

  const status =
    after?.status ??
    (legacyAfter?.status as string | undefined) ??
    inferStatusFromAction(String(doc.action ?? ''))

  const detailRaw = (after?.detail ?? legacyAfter ?? undefined) as
    | Record<string, unknown>
    | undefined

  return {
    id: String(doc.id),
    action: String(doc.action ?? ''),
    candidateLabel,
    candidateId: relId(candidate),
    toolUsed: (doc.toolUsed as string) ?? null,
    confidence: doc.confidence as number | null | undefined,
    modelUsed: (doc.modelUsed as string) ?? null,
    reasonPreview: step,
    createdAt: String(doc.createdAt ?? ''),
    phase,
    step,
    status,
    workflowRunId:
      after?.workflowRunId ?? (detailRaw?.workflowRunId as string | undefined) ?? null,
    workflowName:
      after?.workflowName ?? (detailRaw?.workflowName as string | undefined) ?? null,
    stepIndex: after?.stepIndex ?? (detailRaw?.stepIndex as number | undefined) ?? null,
    detail: detailRaw,
  }
}

function inferPhaseFromAction(action: string): string {
  if (action.includes('scan')) return 'scan'
  if (action.includes('inbound') || action.includes('reply') || action === 'opt_out') return 'inbound'
  if (action.includes('follow')) return 'followup'
  if (action.includes('memory')) return 'memory'
  if (action.includes('review') || action.includes('human')) return 'review'
  if (action.includes('screening') || action.includes('full_screening')) return 'screening'
  return 'system'
}

function inferStatusFromAction(action: string): string {
  if (action.includes('error') || action.includes('fail')) return 'error'
  if (action.includes('skip') || action === 'opt_out') return 'skipped'
  if (action.includes('start')) return 'started'
  return 'success'
}
