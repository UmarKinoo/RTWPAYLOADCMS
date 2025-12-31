import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import type { Plan } from '../../../payload-types'

/**
 * Revalidate pricing page after plan create/update
 */
export const revalidatePlan: CollectionAfterChangeHook<Plan> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    try {
      if (typeof window === 'undefined') {
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating plans after change: ${doc.slug}`)
            revalidatePath('/pricing')
            revalidateTag('plans')
          })
          .catch((error) => {
            if (error instanceof Error) {
              if (
                error.message.includes('static generation store') ||
                error.message.includes('Cannot find module')
              ) {
                payload.logger.warn('Revalidation skipped (not in Next.js server context)')
              } else {
                payload.logger.error('Revalidation error:', error)
              }
            }
          })
      }
    } catch (error) {
      if (error instanceof Error) {
        payload.logger.warn('Revalidation skipped:', error.message)
      }
    }
  }
  return doc
}

/**
 * Revalidate pricing page after plan delete
 */
export const revalidatePlanDelete: CollectionAfterDeleteHook<Plan> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc) {
    try {
      if (typeof window === 'undefined') {
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating plans after delete: ${doc.slug}`)
            revalidatePath('/pricing')
            revalidateTag('plans')
          })
          .catch((error) => {
            if (error instanceof Error) {
              if (
                error.message.includes('static generation store') ||
                error.message.includes('Cannot find module')
              ) {
                payload.logger.warn('Revalidation skipped (not in Next.js server context)')
              } else {
                payload.logger.error('Revalidation error:', error)
              }
            }
          })
      }
    } catch (error) {
      if (error instanceof Error) {
        payload.logger.warn('Revalidation skipped:', error.message)
      }
    }
  }

  return doc
}

