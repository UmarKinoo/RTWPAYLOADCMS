/**
 * Moderator notification recipients.
 * Prefer MODERATOR_EMAILS (comma-separated); falls back to CONTACT_EMAIL.
 */
export function getModeratorEmails(): string[] {
  const fromModerator =
    process.env.MODERATOR_EMAILS?.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []

  if (fromModerator.length > 0) {
    return [...new Set(fromModerator)]
  }

  const fromContact =
    process.env.CONTACT_EMAIL?.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []

  return [...new Set(fromContact)]
}

function getAdminEmailsFromEnv(): string[] {
  return (
    process.env.ADMIN_EMAILS?.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []
  )
}

/**
 * Interview moderation emails: moderators + Payload admin users (+ optional ADMIN_EMAILS).
 */
export async function getInterviewNotificationEmails(
  payload: import('payload').Payload,
): Promise<string[]> {
  const emails = new Set(getModeratorEmails())

  for (const email of getAdminEmailsFromEnv()) {
    emails.add(email)
  }

  const admins = await payload.find({
    collection: 'users',
    where: { role: { equals: 'admin' } },
    limit: 100,
    depth: 0,
    overrideAccess: true,
  })

  for (const user of admins.docs) {
    if (user.email) {
      emails.add(user.email.trim().toLowerCase())
    }
  }

  return [...emails]
}
