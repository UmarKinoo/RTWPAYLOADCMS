import type { CollectionAfterChangeHook } from 'payload'
import type { User } from '@/payload-types'
import { sendUserInvitation } from '@/lib/auth'

/**
 * When a new user with role "moderator" is created, automatically send them an invitation email
 * so they can set their password via the accept-invitation link.
 */
export const sendInvitationForNewModerator: CollectionAfterChangeHook<User> = async ({
  doc,
  operation,
}) => {
  if (operation !== 'create') return doc
  if (doc.role !== 'moderator') return doc
  if (!doc.email) return doc

  try {
    const result = await sendUserInvitation(doc.id)
    if (!result.success) {
      console.warn('[Users] Auto-send invitation for new moderator failed:', result.error)
    }
  } catch (err) {
    console.warn('[Users] Auto-send invitation for new moderator error:', err)
  }

  return doc
}
