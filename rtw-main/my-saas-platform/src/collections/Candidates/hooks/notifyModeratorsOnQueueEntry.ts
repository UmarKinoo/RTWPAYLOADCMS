import type { CollectionAfterChangeHook } from 'payload'
import {
  candidateReadyForModerationQueue,
  notifyModeratorsForCandidate,
} from '@/lib/admin/candidate-moderation-notify'
import type { Candidate } from '@/payload-types'

/**
 * Email moderators when a candidate becomes eligible for the review queue.
 */
export const notifyModeratorsOnQueueEntry: CollectionAfterChangeHook<Candidate> = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (!candidateReadyForModerationQueue(doc)) return doc

  const wasReady = previousDoc ? candidateReadyForModerationQueue(previousDoc) : false
  const becamePhoneVerified = Boolean(doc.phoneVerified && !previousDoc?.phoneVerified)
  const resubmitted =
    operation === 'update' &&
    doc.profileStatus === 'pending_review' &&
    (previousDoc?.profileStatus === 'needs_changes' || previousDoc?.profileStatus === 'rejected')
  const newlyCreatedReady = operation === 'create' && candidateReadyForModerationQueue(doc)

  const shouldNotify =
    (newlyCreatedReady || becamePhoneVerified || resubmitted || (!wasReady && candidateReadyForModerationQueue(doc))) &&
    !doc.moderation?.moderatorNotifiedAt

  if (!shouldNotify) return doc

  try {
    await notifyModeratorsForCandidate(req.payload, doc)
  } catch (error) {
    req.payload.logger.error(`Failed to notify moderators for candidate ${doc.id}: ${error}`)
  }

  return doc
}
