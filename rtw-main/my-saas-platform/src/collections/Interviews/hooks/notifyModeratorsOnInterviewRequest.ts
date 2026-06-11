import type { CollectionAfterChangeHook } from 'payload'
import { notifyModeratorsForInterviewRequest } from '@/lib/admin/interview-moderation-notify'
import type { Interview } from '@/payload-types'

/**
 * Email moderators when an employer creates a pending interview request.
 */
export const notifyModeratorsOnInterviewRequest: CollectionAfterChangeHook<Interview> = async ({
  doc,
  operation,
  req,
}) => {
  if (operation !== 'create' || doc.status !== 'pending') return doc

  try {
    await notifyModeratorsForInterviewRequest(req.payload, doc)
  } catch (error) {
    req.payload.logger.error(`Failed to notify moderators for interview ${doc.id}: ${error}`)
  }

  return doc
}
