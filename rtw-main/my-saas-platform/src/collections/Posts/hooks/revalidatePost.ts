import type { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload'

import type { Post } from '../../../payload-types'

export const revalidatePost: CollectionAfterChangeHook<Post> = ({
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
              const path = `/posts/${doc.slug}`
              payload.logger.info(`Revalidating post at path: ${path}`)
              revalidatePath(path)
              revalidateTag('posts-sitemap', 'max')
            }

            // If the post was previously published, we need to revalidate the old path
            if (previousDoc._status === 'published' && doc._status !== 'published') {
              const oldPath = `/posts/${previousDoc.slug}`
              payload.logger.info(`Revalidating old post at path: ${oldPath}`)
              revalidatePath(oldPath)
              revalidateTag('posts-sitemap', 'max')
            }
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating post ${doc.id}: ${error.message}`)
            }
          })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      payload.logger.error(`Error revalidating post ${doc.id}: ${errorMessage}`)
    }
  }
  return doc
}

export const revalidateDelete: CollectionAfterDeleteHook<Post> = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate && doc) {
    try {
      if (typeof window === 'undefined') {
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            const path = `/posts/${doc.slug}`
            revalidatePath(path)
            revalidateTag('posts-sitemap', 'max')
          })
          .catch((error) => {
            if (error instanceof Error && !error.message.includes('Cannot find module')) {
              payload.logger.error(`Error revalidating deleted post ${doc.id}: ${error.message}`)
            }
          })
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      payload.logger.error(`Error revalidating deleted post ${doc.id}: ${errorMessage}`)
    }
  }

  return doc
}
