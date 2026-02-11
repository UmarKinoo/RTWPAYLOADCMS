import type { Access, AccessArgs } from 'payload'
import type { User } from '@/payload-types'
import { authenticatedOrPublished } from './authenticatedOrPublished'

/**
 * Returns true only when the request user is a Payload admin with role 'admin'.
 * Use for collection-level read/create/update/delete on collections that are
 * hidden from blog-editor (admin.hidden: hiddenFromBlogEditor). Ensures
 * blog-editors cannot access these collections via API even if they bypass the UI.
 */
export function allowOnlyAdmin(args: AccessArgs<User>): boolean {
  const user = args.req.user as User | null | undefined
  return user?.role === 'admin'
}

/**
 * For collections with published draft: admin can read all; blog-editor can read none; others get published only.
 * Use for Pages (and similar) so the frontend can still read published pages without a user.
 */
export const allowOnlyAdminOrPublishedForRead: Access = (args) => {
  if (allowOnlyAdmin(args as AccessArgs<User>)) return true
  const user = args.req.user as User | null | undefined
  if (user?.role === 'blog-editor') return false
  return authenticatedOrPublished(args)
}
