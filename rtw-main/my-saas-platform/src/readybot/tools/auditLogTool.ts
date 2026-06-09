import type { ReadyBotPayloadContext } from './payloadTool'

export type AuditLogInput = {
  action: string
  candidateId?: string | number
  screeningTaskId?: string | number
  beforeData?: unknown
  afterData?: unknown
  reason?: string
  confidence?: number
  modelUsed?: string
  toolUsed?: string
}

export async function createAuditLog(ctx: ReadyBotPayloadContext, input: AuditLogInput) {
  return ctx.payload.create({
    collection: 'agent-audit-logs',
    data: {
      agentName: 'ReadyBot',
      action: input.action,
      candidate: input.candidateId,
      screeningTask: input.screeningTaskId,
      beforeData: input.beforeData ?? null,
      afterData: input.afterData ?? null,
      reason: input.reason,
      confidence: input.confidence,
      modelUsed: input.modelUsed,
      toolUsed: input.toolUsed,
    } as never,
    overrideAccess: true,
  })
}
