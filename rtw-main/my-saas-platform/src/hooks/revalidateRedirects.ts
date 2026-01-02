import type { CollectionAfterChangeHook } from 'payload'

export const revalidateRedirects: CollectionAfterChangeHook = ({ doc, req: { payload } }) => {
  try {
    if (typeof window === 'undefined') {
      import('next/cache')
        .then(({ revalidateTag }) => {
          payload.logger.info(`Revalidating redirects`)
          revalidateTag('redirects', 'max')
        })
        .catch((error) => {
          if (error instanceof Error && !error.message.includes('Cannot find module')) {
            payload.logger.error({ err: error }, 'Error revalidating redirects')
          }
        })
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error : String(error)
    payload.logger.error({ err: errorMessage }, 'Error revalidating redirects')
  }

  return doc
}
