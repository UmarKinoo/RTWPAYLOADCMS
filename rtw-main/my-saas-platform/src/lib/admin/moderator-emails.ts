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
