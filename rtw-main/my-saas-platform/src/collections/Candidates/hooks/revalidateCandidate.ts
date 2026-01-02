import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Candidate } from '../../../payload-types'

/**
 * Revalidate candidate pages after create/update
 */
export const revalidateCandidate: CollectionAfterChangeHook<Candidate> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    // Only revalidate if terms accepted (visible candidate)
    if (doc.termsAccepted) {
      try {
        if (typeof window === 'undefined') {
          const path = `/candidates/${doc.id}`
          import('next/cache')
            .then(({ revalidatePath, revalidateTag }) => {
              payload.logger.info(`Revalidating candidate at path: ${path}`)
              revalidatePath(path)
              revalidateTag(`candidate:${doc.id}`, 'max')
              revalidateTag('candidates', 'max')
            })
            .catch((error) => {
              if (error instanceof Error && !error.message.includes('Cannot find module')) {
                payload.logger.error(`Error revalidating candidate ${doc.id}: ${error.message}`)
              }
            })
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error)
        payload.logger.error(`Error revalidating candidate ${doc.id}: ${errorMessage}`)
      }
    }
  }
  return doc
}

/**
 * Revalidate candidate pages after delete
 */
export const revalidateCandidateDelete: CollectionAfterDeleteHook<Candidate> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc) {
    try {
      if (typeof window === 'undefined') {
        const path = `/candidates/${doc.id}`
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating deleted candidate at path: ${path}`)
            revalidatePath(path)
            revalidateTag(`candidate:${doc.id}`, 'max')
            revalidateTag('candidates', 'max')
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating deleted candidate ${doc.id}: ${error.message}`)
            }
          })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      payload.logger.error(`Error revalidating deleted candidate ${doc.id}: ${errorMessage}`)
    }
  }

  return doc
}



