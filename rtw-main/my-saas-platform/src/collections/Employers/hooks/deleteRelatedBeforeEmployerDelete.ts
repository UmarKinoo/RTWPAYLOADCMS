import type { CollectionBeforeDeleteHook } from 'payload'

/**
 * Before deleting an employer, delete or unlink all documents that reference this employer.
 * This avoids "current transaction is aborted" when Payload tries to delete the employer
 * while FK constraints or internal preferences (payload_preferences) still reference it
 * (e.g. when the same person is both candidate and employer).
 */
export const deleteRelatedBeforeEmployerDelete: CollectionBeforeDeleteHook = async ({
  id,
  req,
}) => {
  const employerId = typeof id === 'object' ? (id as { value: string }).value : String(id)
  const { payload } = req

  const collectionsWithEmployerRelation = [
    'purchases',
    'notifications',
    'interviews',
    'job-postings',
    'candidate-interactions',
  ] as const

  for (const slug of collectionsWithEmployerRelation) {
    try {
      const result = await payload.find({
        collection: slug,
        where: { employer: { equals: employerId } },
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
          `[Employers beforeDelete] Deleted ${result.totalDocs} related ${slug} for employer ${employerId}`,
        )
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      payload.logger.warn(
        `[Employers beforeDelete] Error cleaning ${slug} for employer ${employerId}: ${msg}`,
      )
      // Continue with other collections; the main employer delete may still succeed
      // if this collection has no rows or FK allows null
    }
  }
}
