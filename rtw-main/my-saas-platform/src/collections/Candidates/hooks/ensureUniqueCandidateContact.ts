import type { CollectionBeforeChangeHook } from 'payload'
import { assertUniqueContact } from '@/lib/auth/assertUniqueContact'

/**
 * One email/phone across candidates, employers, and users (email).
 * Normalizes phone to E.164 on create/update when phone is present.
 */
export const ensureUniqueCandidateContact: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data) return data

  const exclude = {
    payload: req.payload,
    req,
    excludeCollection: 'candidates' as const,
    excludeId: operation === 'update' ? originalDoc?.id : undefined,
  }

  const emailChanging =
    operation === 'create'
      ? data.email !== undefined && data.email !== null
      : data.email !== undefined

  const phoneChanging =
    operation === 'create'
      ? data.phone !== undefined && data.phone !== null && String(data.phone).trim() !== ''
      : data.phone !== undefined

  if (!emailChanging && !phoneChanging) {
    return data
  }

  const checked = await assertUniqueContact(
    {
      email: emailChanging
        ? (data.email as string)
        : undefined,
      phone: phoneChanging ? (data.phone as string | null) : undefined,
    },
    exclude,
  )

  if (checked.email !== undefined) {
    data.email = checked.email
  }
  if (phoneChanging) {
    data.phone = checked.phone
  }

  return data
}
