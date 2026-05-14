const DEFAULT_DISPLAY_NAME = 'Ready to Work'

/**
 * Mailbox only (e.g. info@readytowork.sa), for adapters that take address and display name separately.
 */
export function getEmailFromAddressOnly(): string {
  const raw = (process.env.EMAIL_FROM || 'noreply@readytowork.sa').trim() || 'noreply@readytowork.sa'
  const angle = raw.match(/<([^>]+)>/)
  return angle ? angle[1].trim() : raw
}

export function getEmailFromDisplayName(): string {
  const name = (process.env.EMAIL_FROM_NAME || DEFAULT_DISPLAY_NAME).trim()
  return name || DEFAULT_DISPLAY_NAME
}

/**
 * Full Resend `from` header: "Ready to Work <info@domain>".
 * If EMAIL_FROM is already "Name <email>", it is returned unchanged.
 */
export function getResendFromHeader(): string {
  const raw = (process.env.EMAIL_FROM || 'noreply@readytowork.sa').trim() || 'noreply@readytowork.sa'
  if (raw.includes('<') && raw.includes('>')) return raw
  const addr = getEmailFromAddressOnly()
  return `${getEmailFromDisplayName()} <${addr}>`
}
