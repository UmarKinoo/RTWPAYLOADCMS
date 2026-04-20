import type { AccessArgs } from 'payload'
import type { ClientUser } from 'payload'
import type { User } from '@/payload-types'

import { allowOnlyAdmin } from './allowOnlyAdmin'
import { hiddenFromBlogEditor } from './hiddenFromBlogEditor'

let cachedViewerEmails: Set<string> | null = null

function getCandidatesViewerEmails(): Set<string> {
  if (cachedViewerEmails) return cachedViewerEmails
  const raw = process.env.PAYLOAD_CANDIDATES_VIEWER_EMAILS || ''
  cachedViewerEmails = new Set(
    raw
      .split(',')
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  )
  return cachedViewerEmails
}

export function isCandidatesViewerEmail(email: string | undefined | null): boolean {
  if (!email) return false
  return getCandidatesViewerEmails().has(email.trim().toLowerCase())
}

/**
 * Admin full access, or a `users` account whose email is listed in
 * PAYLOAD_CANDIDATES_VIEWER_EMAILS (read-only use case for CMS viewers).
 */
export function allowAdminOrCandidatesViewerRead(args: AccessArgs<User>): boolean {
  if (allowOnlyAdmin(args)) return true
  const user = args.req.user as { collection?: string; email?: string } | null | undefined
  if (!user || user.collection !== 'users') return false
  return isCandidatesViewerEmail(user.email)
}

/**
 * Like hiddenFromBlogEditor, but keep Candidates visible for allowlisted blog-editors.
 */
export function hiddenFromBlogEditorUnlessCandidatesViewer(args: {
  user: ClientUser | null | undefined
}): boolean {
  const u = args.user as { role?: string; email?: string } | null | undefined
  if (u?.role === 'blog-editor' && isCandidatesViewerEmail(u.email)) return false
  return hiddenFromBlogEditor({ user: args.user as ClientUser })
}
