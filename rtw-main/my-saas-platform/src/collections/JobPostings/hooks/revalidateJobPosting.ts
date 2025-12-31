import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'
import type { JobPosting } from '../../../payload-types'

export const revalidateJobPosting: CollectionAfterChangeHook<JobPosting> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc.employer) {
    try {
      if (typeof window === 'undefined') {
        const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating job postings after change: ${doc.id}`)
            revalidatePath('/employer/dashboard')
            revalidateTag(`employer:${employerId}`)
            revalidateTag('job-postings')
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating job posting ${doc.id}:`, error)
            }
          })
      }
    } catch (error) {
      payload.logger.error(`Error revalidating job posting ${doc.id}:`, error)
    }
  }
  return doc
}

export const revalidateJobPostingDelete: CollectionAfterDeleteHook<JobPosting> = ({
  doc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate && doc && doc.employer) {
    try {
      if (typeof window === 'undefined') {
        const employerId = typeof doc.employer === 'object' ? doc.employer.id : doc.employer
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating job postings after delete: ${doc.id}`)
            revalidatePath('/employer/dashboard')
            revalidateTag(`employer:${employerId}`)
            revalidateTag('job-postings')
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating deleted job posting ${doc.id}:`, error)
            }
          })
      }
    } catch (error) {
      payload.logger.error(`Error revalidating deleted job posting ${doc.id}:`, error)
    }
  }
  return doc
}



