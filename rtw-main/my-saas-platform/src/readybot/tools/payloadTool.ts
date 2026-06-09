import type { Payload, Where } from 'payload'
import type { Candidate } from '@/payload-types'
import { filterHumanApprovedFields, filterSafeExtractedFields } from './permissionTool'
import {
  readyBotTerminalLog,
  readyBotTerminalError,
  stripUndefined,
} from './terminalLog'

export type ReadyBotPayloadContext = {
  payload: Payload
}

/** Postgres collections use numeric IDs; strings fail relationship validation ("10 0" in errors). */
export function normalizeRelationshipId(
  id: string | number | null | undefined,
): number | undefined {
  if (id == null || id === '') return undefined
  if (typeof id === 'number' && !Number.isNaN(id)) return id
  const n = Number(id)
  return Number.isFinite(n) ? n : undefined
}

function normalizeRelationshipFields(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out = { ...data }
  for (const key of ['candidate', 'jobPosting', 'screeningResult', 'screeningTask'] as const) {
    if (key in out) {
      const normalized = normalizeRelationshipId(out[key] as string | number | null | undefined)
      if (normalized === undefined) delete out[key]
      else out[key] = normalized
    }
  }
  return out
}

function setNested(obj: Record<string, unknown>, path: string, value: unknown): void {
  const parts = path.split('.')
  let cur: Record<string, unknown> = obj
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i]
    if (typeof cur[p] !== 'object' || cur[p] === null) cur[p] = {}
    cur = cur[p] as Record<string, unknown>
  }
  cur[parts[parts.length - 1]] = value
}

export async function getCandidate(ctx: ReadyBotPayloadContext, candidateId: string | number) {
  return ctx.payload.findByID({
    collection: 'candidates',
    id: candidateId,
    depth: 1,
    overrideAccess: true,
  }) as Promise<Candidate>
}

export async function getCandidateMemory(ctx: ReadyBotPayloadContext, candidateId: string | number) {
  const res = await ctx.payload.find({
    collection: 'candidate-memory',
    where: { candidate: { equals: candidateId } },
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}

export async function getCandidateMessages(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  limit = 20,
) {
  return ctx.payload.find({
    collection: 'candidate-messages',
    where: { candidate: { equals: candidateId } },
    sort: '-createdAt',
    limit,
    overrideAccess: true,
  })
}

export async function createScreeningTask(
  ctx: ReadyBotPayloadContext,
  data: Record<string, unknown>,
) {
  const payloadData = normalizeRelationshipFields(stripUndefined(data))
  readyBotTerminalLog('createScreeningTask → candidate-screening-tasks', {
    data: payloadData,
  })
  try {
    const doc = await ctx.payload.create({
      collection: 'candidate-screening-tasks',
      data: payloadData as never,
      overrideAccess: true,
    })
    readyBotTerminalLog('createScreeningTask ✓', { taskId: doc.id })
    return doc
  } catch (e) {
    readyBotTerminalError('createScreeningTask ✗', e, { data: payloadData })
    throw e
  }
}

export async function updateScreeningTask(
  ctx: ReadyBotPayloadContext,
  taskId: string | number,
  data: Record<string, unknown>,
) {
  return ctx.payload.update({
    collection: 'candidate-screening-tasks',
    id: taskId,
    data: data as never,
    overrideAccess: true,
  })
}

export async function saveCandidateMessage(
  ctx: ReadyBotPayloadContext,
  data: Record<string, unknown>,
) {
  return ctx.payload.create({
    collection: 'candidate-messages',
    data: data as never,
    overrideAccess: true,
  })
}

export async function upsertCandidateMemory(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  data: Record<string, unknown>,
) {
  const existing = await getCandidateMemory(ctx, candidateId)
  if (existing) {
    return ctx.payload.update({
      collection: 'candidate-memory',
      id: existing.id,
      data: data as never,
      overrideAccess: true,
    })
  }
  return ctx.payload.create({
    collection: 'candidate-memory',
    data: { candidate: candidateId, ...data } as never,
    overrideAccess: true,
  })
}

export async function updateCandidateSafeFields(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  extractedFields: Record<string, unknown>,
) {
  const permission = filterSafeExtractedFields(extractedFields)
  if (!permission.allowed) {
    return { success: false as const, ...permission }
  }

  const before = await getCandidate(ctx, candidateId)
  const updateData: Record<string, unknown> = {}
  for (const [path, value] of Object.entries(permission.normalized)) {
    setNested(updateData, path, value)
  }

  const updated = await ctx.payload.update({
    collection: 'candidates',
    id: candidateId,
    data: updateData as never,
    overrideAccess: true,
    context: { skipVectorUpdate: true, disableRevalidate: true },
  })

  return { success: true as const, before, after: updated, applied: permission.normalized }
}

/** Apply fields after admin approves a human-review task (broader than auto-update allowlist). */
export async function updateCandidateHumanApprovedFields(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  fields: Record<string, unknown>,
) {
  const permission = filterHumanApprovedFields(fields)
  if (!permission.allowed) {
    return { success: false as const, ...permission }
  }

  const before = await getCandidate(ctx, candidateId)
  const updateData: Record<string, unknown> = {}
  for (const [path, value] of Object.entries(permission.normalized)) {
    setNested(updateData, path, value)
  }

  const updated = await ctx.payload.update({
    collection: 'candidates',
    id: candidateId,
    data: updateData as never,
    overrideAccess: true,
    context: { skipVectorUpdate: true, disableRevalidate: true },
  })

  return { success: true as const, before, after: updated, applied: permission.normalized }
}

export async function updateCandidateScreeningMeta(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  readyBotPatch: Record<string, unknown>,
) {
  const candidate = await getCandidate(ctx, candidateId)
  const existing = (candidate as Candidate & { readyBot?: Record<string, unknown> }).readyBot ?? {}
  return ctx.payload.update({
    collection: 'candidates',
    id: candidateId,
    data: { readyBot: { ...existing, ...readyBotPatch } } as never,
    overrideAccess: true,
    context: { skipVectorUpdate: true, disableRevalidate: true },
  })
}

function phoneVariants(phone: string): string[] {
  const digits = phone.replace(/\D/g, '')
  const variants = new Set<string>([digits, phone.replace(/\s/g, '')])
  if (digits && !digits.startsWith('966') && digits.length === 9) variants.add(`966${digits}`)
  if (digits.startsWith('966')) variants.add(`+${digits}`)
  return [...variants]
}

export async function findCandidateByWhatsAppNumber(ctx: ReadyBotPayloadContext, phone: string) {
  const variants = phoneVariants(phone)
  const orClauses: Where[] = []
  for (const v of variants) {
    orClauses.push({ phone: { equals: v } })
    orClauses.push({ whatsapp: { equals: v } })
    orClauses.push({ phone: { equals: `+${v}` } })
  }
  const res = await ctx.payload.find({
    collection: 'candidates',
    where: { or: orClauses },
    limit: 10,
    overrideAccess: true,
  })
  const exact = res.docs.find((d) => {
    const c = d as { phone?: string; whatsapp?: string; readyBot?: { whatsappNumber?: string } }
    const norm = (s?: string) => s?.replace(/\D/g, '') ?? ''
    const target = phone.replace(/\D/g, '')
    return (
      norm(c.phone) === target ||
      norm(c.whatsapp) === target ||
      norm(c.readyBot?.whatsappNumber) === target
    )
  })
  if (exact) return exact as Candidate
  return null
}

export async function createScreeningResult(
  ctx: ReadyBotPayloadContext,
  data: Record<string, unknown>,
) {
  const payloadData = normalizeRelationshipFields(stripUndefined(data))
  readyBotTerminalLog('createScreeningResult → screening-results', {
    data: {
      ...payloadData,
      profileUnderstanding: payloadData.profileUnderstanding
        ? '[json omitted]'
        : undefined,
    },
  })
  try {
    const doc = await ctx.payload.create({
      collection: 'screening-results',
      data: payloadData as never,
      overrideAccess: true,
    })
    readyBotTerminalLog('createScreeningResult ✓', { resultId: doc.id })
    return doc
  } catch (e) {
    readyBotTerminalError('createScreeningResult ✗', e, { data: payloadData })
    throw e
  }
}

export async function getLatestScreeningResult(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
) {
  const result = await ctx.payload.find({
    collection: 'screening-results',
    where: { candidate: { equals: candidateId } },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })
  return result.docs[0] ?? null
}

export async function markCandidateUnresponsive(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
) {
  await updateCandidateScreeningMeta(ctx, candidateId, {
    screeningStatus: 'unresponsive',
  })
  const tasks = await ctx.payload.find({
    collection: 'candidate-screening-tasks',
    where: {
      and: [
        { candidate: { equals: candidateId } },
        { status: { in: ['awaiting_reply', 'message_sent', 'pending'] } },
      ],
    },
    limit: 20,
    overrideAccess: true,
  })
  for (const t of tasks.docs) {
    await updateScreeningTask(ctx, t.id, { status: 'unresponsive', completedAt: new Date().toISOString() })
  }
}

export async function setCandidateOptedOut(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
) {
  await updateCandidateScreeningMeta(ctx, candidateId, {
    whatsappOptIn: false,
    screeningStatus: 'opted_out',
  })
}

export async function findActiveScreeningTask(ctx: ReadyBotPayloadContext, candidateId: string | number) {
  const res = await ctx.payload.find({
    collection: 'candidate-screening-tasks',
    where: {
      and: [
        { candidate: { equals: candidateId } },
        {
          status: {
            in: ['pending', 'message_sent', 'awaiting_reply', 'reply_received', 'processed'],
          },
        },
      ],
    },
    sort: '-createdAt',
    limit: 1,
    overrideAccess: true,
  })
  return res.docs[0] ?? null
}
