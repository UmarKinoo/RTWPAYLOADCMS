import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import type { CandidateInteraction } from '../../../payload-types'

export const revalidateCandidateInteraction: CollectionAfterChangeHook<CandidateInteraction> =
  ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate && doc.employer) {
      try {
        if (typeof window === 'undefined') {
          const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
          import('next/cache')
            .then(({ revalidatePath, revalidateTag }) => {
              payload.logger.info(`Revalidating candidate interactions after change: ${doc.id}`)
              revalidatePath('/employer/dashboard')
              revalidateTag(`employer:${employerId}`)
              revalidateTag('candidate-interactions')
            })
            .catch((error) => {
              if (error instanceof Error && !error.message.includes('Cannot find module')) {
                payload.logger.error(`Error revalidating candidate interaction ${doc.id}:`, error)
              }
            })
        }
      } catch (error) {
        payload.logger.error(`Error revalidating candidate interaction ${doc.id}:`, error)
      }
    }
    return doc
  }

export const revalidateCandidateInteractionDelete: CollectionAfterDeleteHook<CandidateInteraction> =
  ({ doc, req: { payload, context } }) => {
    if (!context.disableRevalidate && doc && doc.employer) {
      try {
        if (typeof window === 'undefined') {
          const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
          import('next/cache')
            .then(({ revalidatePath, revalidateTag }) => {
              payload.logger.info(`Revalidating candidate interactions after delete: ${doc.id}`)
              revalidatePath('/employer/dashboard')
              revalidateTag(`employer:${employerId}`)
              revalidateTag('candidate-interactions')
            })
            .catch((error) => {
              if (error instanceof Error && !error.message.includes('Cannot find module')) {
                payload.logger.error(`Error revalidating deleted candidate interaction ${doc.id}:`, error)
              }
            })
        }
      } catch (error) {
        payload.logger.error(`Error revalidating deleted candidate interaction ${doc.id}:`, error)
      }
    }
    return doc
  }



