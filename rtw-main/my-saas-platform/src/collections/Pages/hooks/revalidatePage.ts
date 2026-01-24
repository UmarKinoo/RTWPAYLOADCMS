import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Page } from '../../../payload-types'

export const revalidatePage: CollectionAfterChangeHook<Page> = ({
  doc,
  previousDoc,
  req: { payload, context },
}) => {
  if (!context.disableRevalidate) {
    try {
      if (typeof window === 'undefined') {
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            if (doc._status === 'published') {
              const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
              payload.logger.info(`Revalidating page at path: ${path}`)
              revalidatePath(path)
              revalidateTag('pages-sitemap', 'max')
            }

            // If the page was previously published, we need to revalidate the old path
            if (previousDoc?._status === 'published' && doc._status !== 'published') {
              const oldPath = previousDoc.slug === 'home' ? '/' : `/${previousDoc.slug}`
              payload.logger.info(`Revalidating old page at path: ${oldPath}`)
              revalidatePath(oldPath)
              revalidateTag('pages-sitemap', 'max')
            }
          })
          .catch((error) => {
            if (error instanceof Error) {
              if (
                error.message.includes('static generation store') ||
                error.message.includes('Cannot find module')
              ) {
                payload.logger.warn('Revalidation skipped (not in Next.js server context)')
              } else {
                payload.logger.error(`Error revalidating page ${doc.id}: ${error.message}`)
              }
            }
          })
      }
    } catch (error) {
      // Silently fail if revalidation is not available
      if (error instanceof Error) {
        if (
          error.message.includes('static generation store') ||
          error.message.includes('Cannot find module')
        ) {
          payload.logger.warn(`Revalidation skipped: ${error.message}`)
        } else {
          payload.logger.error(`Error revalidating page ${doc.id}: ${error.message}`)
        }
      }
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Page> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate && doc) {
    try {
      if (typeof window === 'undefined') {
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            const path = doc.slug === 'home' ? '/' : `/${doc.slug}`
            revalidatePath(path)
            revalidateTag('pages-sitemap', 'max')
          })
          .catch((error) => {
            if (error instanceof Error) {
              if (
                error.message.includes('static generation store') ||
                error.message.includes('Cannot find module')
              ) {
                payload.logger.warn('Revalidation skipped (not in Next.js server context)')
              } else {
                payload.logger.error(`Error revalidating deleted page ${doc.id}: ${error.message}`)
              }
            }
          })
      }
    } catch (error) {
      // Silently fail if revalidation is not available
      if (error instanceof Error) {
        if (
          error.message.includes('static generation store') ||
          error.message.includes('Cannot find module')
        ) {
          payload.logger.warn(`Revalidation skipped: ${error.message}`)
        } else {
          payload.logger.error(`Error revalidating deleted page ${doc.id}: ${error.message}`)
        }
      }
    }
  }

  return doc
}
