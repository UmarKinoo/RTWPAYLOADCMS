import type { Payload, PayloadRequest } from 'payload'
import { normalizePhone } from '@/server/sms/taqnyat'

export type AuthContactCollection = 'candidates' | 'employers' | 'users'

const EMAIL_COLLECTIONS: AuthContactCollection[] = ['candidates', 'employers', 'users']
const PHONE_COLLECTIONS: Array<'candidates' | 'employers'> = ['candidates', 'employers']

export class ContactConflictError extends Error {
  readonly field: 'email' | 'phone'

  constructor(message: string, field: 'email' | 'phone') {
    super(message)
    this.name = 'ContactConflictError'
    this.field = field
  }
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim()
}

export function isContactConflictError(error: unknown): error is ContactConflictError {
  return error instanceof ContactConflictError ||
    (error instanceof Error &&
      (error.message.includes('email is already registered') ||
        error.message.includes('phone number is already registered') ||
        error.message.includes('An account with this email already exists') ||
        error.message.includes('An account with this phone number already exists')))
}

type FindOpts = {
  payload: Payload
  req?: PayloadRequest
  excludeCollection?: AuthContactCollection
  excludeId?: string | number
}

async function emailTakenInCollection(
  collection: AuthContactCollection,
  email: string,
  opts: FindOpts,
): Promise<boolean> {
  const result = await opts.payload.find({
    collection,
    where: { email: { equals: email } },
    limit: 5,
    depth: 0,
    overrideAccess: true,
    ...(opts.req ? { req: opts.req } : {}),
  })

  return result.docs.some((doc) => {
    if (opts.excludeCollection === collection && opts.excludeId != null) {
      return String(doc.id) !== String(opts.excludeId)
    }
    return true
  })
}

async function phoneTakenInCollection(
  collection: 'candidates' | 'employers',
  phone: string,
  opts: FindOpts,
): Promise<boolean> {
  const result = await opts.payload.find({
    collection,
    where: { phone: { equals: phone } },
    limit: 5,
    depth: 0,
    overrideAccess: true,
    ...(opts.req ? { req: opts.req } : {}),
  })

  return result.docs.some((doc) => {
    if (opts.excludeCollection === collection && opts.excludeId != null) {
      return String(doc.id) !== String(opts.excludeId)
    }
    return true
  })
}

/**
 * Ensures email is not used by any candidates / employers / users account
 * (excluding the document being updated when exclude* is set).
 */
export async function assertEmailAvailable(
  emailRaw: string,
  opts: FindOpts,
): Promise<string> {
  const email = normalizeEmail(emailRaw)
  if (!email) {
    throw new ContactConflictError('Email is required', 'email')
  }

  for (const collection of EMAIL_COLLECTIONS) {
    if (await emailTakenInCollection(collection, email, opts)) {
      throw new ContactConflictError(
        'An account with this email already exists. Please log in or use a different email.',
        'email',
      )
    }
  }

  return email
}

/**
 * Ensures normalized phone is not used by any candidate or employer account.
 * Returns the E.164 phone. Empty/null phone is allowed (returns null).
 */
export async function assertPhoneAvailable(
  phoneRaw: string | null | undefined,
  opts: FindOpts,
): Promise<string | null> {
  if (phoneRaw === undefined || phoneRaw === null || String(phoneRaw).trim() === '') {
    return null
  }

  let phone: string
  try {
    phone = normalizePhone(String(phoneRaw))
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Invalid phone number'
    throw new Error(msg)
  }

  for (const collection of PHONE_COLLECTIONS) {
    if (await phoneTakenInCollection(collection, phone, opts)) {
      throw new ContactConflictError(
        'This phone number is already registered to another account.',
        'phone',
      )
    }
  }

  return phone
}

/**
 * Assert email and/or phone uniqueness across auth collections.
 * When phone is provided as a string it is normalized and returned.
 */
export async function assertUniqueContact(
  args: {
    email?: string | null
    phone?: string | null
  },
  opts: FindOpts,
): Promise<{ email?: string; phone?: string | null }> {
  const result: { email?: string; phone?: string | null } = {}

  if (args.email !== undefined && args.email !== null) {
    result.email = await assertEmailAvailable(args.email, opts)
  }

  if (args.phone !== undefined) {
    result.phone = await assertPhoneAvailable(args.phone, opts)
  }

  return result
}
