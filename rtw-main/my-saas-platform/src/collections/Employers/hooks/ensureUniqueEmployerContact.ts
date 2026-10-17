import type { CollectionBeforeChangeHook } from 'payload'
import {
  assertUniqueContact,
  isEmailBeingChanged,
  isPhoneBeingChanged,
} from '@/lib/auth/assertUniqueContact'

/**
 * One email/phone across employers, candidates, and users (email).
 * Normalizes phone to E.164 when provided.
 */
export const ensureUniqueEmployerContact: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data) return data

  const exclude = {
    payload: req.payload,
    req,
    excludeCollection: 'employers' as const,
    excludeId: operation === 'update' ? originalDoc?.id : undefined,
  }

  const emailChanging = isEmailBeingChanged(operation, data.email, originalDoc?.email)
  const phoneChanging = isPhoneBeingChanged(operation, data.phone, originalDoc?.phone)

  if (!emailChanging && !phoneChanging) {
    return data
  }

  const checked = await assertUniqueContact(
    {
      email: emailChanging ? (data.email as string) : undefined,
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
