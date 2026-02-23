import type { CollectionBeforeDeleteHook } from 'payload'

/**
 * Before deleting a candidate, delete all documents that reference this candidate
 * with required (NOT NULL) relationship fields. This avoids "current transaction is aborted"
 * when Postgres runs ON DELETE SET NULL on interviews.candidate_id and
 * candidate_interactions.candidate_id, which are NOT NULL — the SET NULL would fail
 * and abort the transaction; then Payload's preferences query fails with that error.
 */
export const deleteRelatedBeforeCandidateDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const candidateId = typeof id === 'object' ? (id as { value: string }).value : String(id)
  const { payload } = req

  const collectionsWithRequiredCandidateRelation = [
    'interviews',
    'candidate-interactions',
  ] as const

  for (const slug of collectionsWithRequiredCandidateRelation) {
    try {
      const result = await payload.find({
        collection: slug,
        where: { candidate: { equals: candidateId } },
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })
      for (const doc of result.docs) {
        await payload.delete({
          collection: slug,
          id: doc.id,
          overrideAccess: true,
        })
      }
      if (result.totalDocs > 0) {
        payload.logger.info(
          `[Candidates beforeDelete] Deleted ${result.totalDocs} related ${slug} for candidate ${candidateId}`,
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      payload.logger.warn(
        `[Candidates beforeDelete] Error cleaning ${slug} for candidate ${candidateId}: ${msg}`,
      )
      // Continue with other collections
    }
  }
}
