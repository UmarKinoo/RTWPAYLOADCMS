import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import type { Interview } from '../../../payload-types'

export const revalidateInterview: CollectionAfterChangeHook<Interview> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc.employer) {
    try {
      if (typeof window === 'undefined') {
        const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating interviews after change: ${doc.id}`)
            revalidatePath('/employer/dashboard')
            revalidateTag(`employer:${employerId}`)
            revalidateTag('interviews')
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating interview ${doc.id}:`, error)
            }
          })
      }
    } catch (error) {
      payload.logger.error(`Error revalidating interview ${doc.id}:`, error)
    }
  }
  return doc
}

export const revalidateInterviewDelete: CollectionAfterDeleteHook<Interview> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc && doc.employer) {
    try {
      if (typeof window === 'undefined') {
        const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating interviews after delete: ${doc.id}`)
            revalidatePath('/employer/dashboard')
            revalidateTag(`employer:${employerId}`)
            revalidateTag('interviews')
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating deleted interview ${doc.id}:`, error)
            }
          })
      }
    } catch (error) {
      payload.logger.error(`Error revalidating deleted interview ${doc.id}:`, error)
    }
  }
  return doc
}



