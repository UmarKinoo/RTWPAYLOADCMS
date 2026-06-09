import type { ReadyBotPayloadContext } from '../tools/payloadTool'
import {
  getCandidate,
  updateCandidateHumanApprovedFields,
  updateCandidateScreeningMeta,
  upsertCandidateMemory,
} from '../tools/payloadTool'
import { createAuditLog } from '../tools/auditLogTool'
import type { RoleFitResult } from '../types/RoleFitResult'
import type { Candidate } from '@/payload-types'

/** JSON keys on human-review tasks that are context, not candidate field updates. */
const HUMAN_REVIEW_CONTEXT_KEYS = new Set([
  'roleFit',
  'cvSummary',
  'messageBody',
  'missingFields',
  'replyText',
  'extraction',
  'fields',
])

function splitSuggestedUpdate(suggested: Record<string, unknown>): {
  candidateFields: Record<string, unknown>
  context: Record<string, unknown>
} {
  if (typeof suggested.fields === 'object' && suggested.fields !== null) {
    const context: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(suggested)) {
      if (key !== 'fields') context[key] = value
    }
    return {
      candidateFields: suggested.fields as Record<string, unknown>,
      context,
    }
  }

  const candidateFields: Record<string, unknown> = {}
  const context: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(suggested)) {
    if (HUMAN_REVIEW_CONTEXT_KEYS.has(key)) context[key] = value
    else candidateFields[key] = value
  }
  return { candidateFields, context }
}

async function applyHumanReviewContext(
  ctx: ReadyBotPayloadContext,
  candidateId: string | number,
  context: Record<string, unknown>,
) {
  const cvSummary = typeof context.cvSummary === 'string' ? context.cvSummary : undefined
  if (cvSummary) {
    await upsertCandidateMemory(ctx, candidateId, {
      cvSummary,
      profileSummary: cvSummary.slice(0, 2000),
    })
  }

  const roleFit = context.roleFit as RoleFitResult | undefined
  if (roleFit && typeof roleFit === 'object') {
    await updateCandidateScreeningMeta(ctx, candidateId, {
      screeningSummary: roleFit.fitSummary,
      screeningConfidence: roleFit.fitScore / 100,
      screeningStatus: 'incomplete',
      lastScreenedAt: new Date().toISOString(),
      missingFields: roleFit.gaps?.map((g) => ({ field: g })),
    })
  }

  if (context.messageBody != null || context.missingFields != null) {
    const missing = context.missingFields
    await updateCandidateScreeningMeta(ctx, candidateId, {
      screeningStatus: 'incomplete',
      ...(Array.isArray(missing)
        ? {
            missingFields: missing.map((f) =>
              typeof f === 'string' ? { field: f } : (f as { field: string }),
            ),
          }
        : {}),
    })
  }

  if (context.replyText != null) {
    await updateCandidateScreeningMeta(ctx, candidateId, {
      screeningStatus: 'incomplete',
    })
  }
}

export async function applyHumanReviewApproval(
  ctx: ReadyBotPayloadContext,
  reviewTaskId: string | number,
  reviewedByUserId: string | number,
  editedFields?: Record<string, unknown>,
) {
  const review = await ctx.payload.findByID({
    collection: 'human-review-tasks',
    id: reviewTaskId,
    depth: 0,
    overrideAccess: true,
  })

  if (review.status !== 'pending') {
    return { success: false, error: 'Review task is not pending' }
  }

  const candidateId =
    typeof review.candidate === 'object' ? review.candidate?.id : review.candidate
  if (!candidateId) return { success: false, error: 'Missing candidate on review task' }

  const suggested = (review.suggestedUpdate as Record<string, unknown>) || {}
  const { candidateFields: suggestedFields, context } = splitSuggestedUpdate(suggested)
  const fieldsToApply = editedFields ?? suggestedFields

  let before: Candidate
  let after: Candidate
  let applied: Record<string, unknown> = {}

  if (Object.keys(fieldsToApply).length > 0) {
    const updateResult = await updateCandidateHumanApprovedFields(
      ctx,
      candidateId,
      fieldsToApply,
    )
    if (!updateResult.success) {
      return { success: false, error: updateResult.reason }
    }
    before = updateResult.before
    after = updateResult.after
    applied = updateResult.applied
    await updateCandidateScreeningMeta(ctx, candidateId, {
      screeningStatus: 'incomplete',
      lastScreenedAt: new Date().toISOString(),
    })
  } else {
    const candidate = await getCandidate(ctx, candidateId)
    before = candidate
    after = candidate
  }

  if (Object.keys(context).length > 0) {
    await applyHumanReviewContext(ctx, candidateId, context)
    after = await getCandidate(ctx, candidateId)
  }

  if (Object.keys(fieldsToApply).length === 0 && Object.keys(context).length === 0) {
    return { success: false, error: 'No fields or context to apply on this review' }
  }

  await ctx.payload.update({
    collection: 'human-review-tasks',
    id: reviewTaskId,
    data: {
      status: editedFields ? 'edited_and_approved' : 'approved',
      reviewedBy: reviewedByUserId,
      reviewedAt: new Date().toISOString(),
    } as never,
    overrideAccess: true,
  })

  await createAuditLog(ctx, {
    action: 'human_review_approved',
    candidateId,
    screeningTaskId:
      typeof review.screeningTask === 'object' ? review.screeningTask?.id : review.screeningTask,
    beforeData: before,
    afterData: after,
    toolUsed: 'applyHumanReviewApproval',
    reason: review.reason,
  })

  return { success: true, candidateId, applied, contextHandled: Object.keys(context) }
}

export async function rejectHumanReview(
  ctx: ReadyBotPayloadContext,
  reviewTaskId: string | number,
  reviewedByUserId: string | number,
  adminNotes?: string,
) {
  const review = await ctx.payload.update({
    collection: 'human-review-tasks',
    id: reviewTaskId,
    data: {
      status: 'rejected',
      reviewedBy: reviewedByUserId,
      reviewedAt: new Date().toISOString(),
      adminNotes,
    } as never,
    overrideAccess: true,
  })

  await createAuditLog(ctx, {
    action: 'human_review_rejected',
    candidateId:
      typeof review.candidate === 'object' ? review.candidate?.id : review.candidate,
    screeningTaskId:
      typeof review.screeningTask === 'object' ? review.screeningTask?.id : review.screeningTask,
    afterData: review,
    reason: adminNotes,
    toolUsed: 'rejectHumanReview',
  })

  return { success: true }
}
