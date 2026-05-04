import type { CollectionBeforeChangeHook } from 'payload'
import { normalizePhone } from '@/server/sms/taqnyat'

/**
 * One normalized phone per candidate account. Blocks create/update if another
 * candidate already uses the same E.164 value (uses overrideAccess on lookup).
 */
export const ensureUniqueCandidatePhone: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data) return data

  if (operation === 'update' && data.phone === undefined) {
    return data
  }

  const raw =
    operation === 'create'
      ? data.phone
      : data.phone !== undefined
        ? data.phone
        : originalDoc?.phone

  if (raw === undefined || raw === null || String(raw).trim() === '') {
    return data
  }

  let phone: string
  try {
    phone = normalizePhone(String(raw))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invalid phone number'
    throw new Error(msg)
  }

  data.phone = phone

  const existing = await req.payload.find({
    collection: 'candidates',
    where: { phone: { equals: phone } },
    limit: 5,
    depth: 0,
    req,
    overrideAccess: true,
  })

  const selfId = operation === 'update' ? originalDoc?.id : undefined
  const conflict = existing.docs.find((d) => d.id !== selfId)
  if (conflict) {
    throw new Error('This phone number is already registered to another account.')
  }

  return data
}
