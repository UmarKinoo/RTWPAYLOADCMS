import type { ClientUser } from 'payload'

/**
 * Returns true to hide the collection from blog-editors in the admin UI.
 * Blog-editors only see: Posts, Categories, Media.
 * Use this as admin.hidden for collections that full admins should see but blog-editors should not.
 *
 * Payload 3.0 passes `{ user: ClientUser }` to admin.hidden. ClientUser has [key: string]: any
 * so we read role via (user as { role?: string }).role.
 */
export const hiddenFromBlogEditor = (args: { user: ClientUser }): boolean => {
  return (args.user as { role?: string })?.role === 'blog-editor'
}
