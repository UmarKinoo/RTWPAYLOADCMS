import type { Payload } from 'payload'

/**
 * Emails for staff who can moderate candidate profiles and interview requests.
 */
export async function getModeratorEmails(payload: Payload): Promise<string[]> {
  const fallback =
    process.env.MODERATOR_EMAILS?.split(',')
      .map((e) => e.trim())
      .filter(Boolean) ||
    (process.env.CONTACT_EMAIL ? [process.env.CONTACT_EMAIL] : [])

  try {
    const result = await payload.find({
      collection: 'users',
      where: {
        role: { in: ['moderator', 'admin'] },
      },
      limit: 100,
      depth: 0,
      overrideAccess: true,
    })

    const emails = result.docs
      .map((u) => u.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e))

    if (emails.length > 0) {
      return [...new Set(emails)]
    }
  } catch (error) {
    console.error('[getModeratorEmails] Failed to load users:', error)
  }

  return fallback
}
