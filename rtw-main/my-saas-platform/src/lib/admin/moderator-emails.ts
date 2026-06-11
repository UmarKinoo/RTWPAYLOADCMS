/**
 * Moderator notification recipients — MODERATOR_EMAILS env only (comma-separated).
 * Example: umar@example.com,aziz@example.com
 */
export function getModeratorEmails(): string[] {
  const emails =
    process.env.MODERATOR_EMAILS?.split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean) ?? []

  return [...new Set(emails)]
}
