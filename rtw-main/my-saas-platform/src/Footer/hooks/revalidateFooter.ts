import type { GlobalAfterChangeHook } from 'payload'

export const revalidateFooter: GlobalAfterChangeHook = ({ doc, req: { payload, context } }) => {
  if (!context.disableRevalidate) {
    try {
      // Only import and use revalidation functions in server context
      // This prevents client-side bundling issues
      if (typeof window === 'undefined') {
        // Dynamic import to avoid bundling for client
        import('next/cache')
          .then(({ revalidatePath, revalidateTag }) => {
            payload.logger.info(`Revalidating footer`)
            revalidatePath('/', 'layout')
            revalidateTag('global_footer')
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
      // Silently fail if revalidation is not available
      if (error instanceof Error) {
        payload.logger.warn('Revalidation skipped:', error.message)
      }
    }
  }

  return doc
}
