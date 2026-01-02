import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import type { Notification } from '../../../payload-types'

export const revalidateNotification: CollectionAfterChangeHook<Notification> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    try {
      if (typeof window === 'undefined') {
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            if (doc.employer) {
              const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
              payload.logger.info(`Revalidating employer notifications after change: ${doc.id}`)
              revalidatePath('/employer/dashboard')
              revalidateTag(`employer:${employerId}`, 'max')
              revalidateTag('notifications', 'max')
            }
            if (doc.candidate) {
              const candidateId = typeof doc.candidate === 'object' ? doc.candidate.id : doc.candidate
              payload.logger.info(`Revalidating candidate notifications after change: ${doc.id}`)
              revalidatePath('/candidate/dashboard')
              revalidateTag(`candidate:${candidateId}`, 'max')
              revalidateTag('notifications', 'max')
            }
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating notification ${doc.id}: ${error.message}`)
            }
          })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      payload.logger.error(`Error revalidating notification ${doc.id}: ${errorMessage}`)
    }
  }
  return doc
}

export const revalidateNotificationDelete: CollectionAfterDeleteHook<Notification> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc) {
    try {
      if (typeof window === 'undefined') {
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            if (doc.employer) {
              const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
              payload.logger.info(`Revalidating employer notifications after delete: ${doc.id}`)
              revalidatePath('/employer/dashboard')
              revalidateTag(`employer:${employerId}`, 'max')
              revalidateTag('notifications', 'max')
            }
            if (doc.candidate) {
              const candidateId = typeof doc.candidate === 'object' ? doc.candidate.id : doc.candidate
              payload.logger.info(`Revalidating candidate notifications after delete: ${doc.id}`)
              revalidatePath('/candidate/dashboard')
              revalidateTag(`candidate:${candidateId}`, 'max')
              revalidateTag('notifications', 'max')
            }
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating deleted notification ${doc.id}: ${error.message}`)
            }
          })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      payload.logger.error(`Error revalidating deleted notification ${doc.id}: ${errorMessage}`)
    }
  }
  return doc
}



