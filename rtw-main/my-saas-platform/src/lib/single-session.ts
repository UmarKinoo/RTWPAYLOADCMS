import type { Payload } from 'payload'
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers'
import type { ReadonlyRequestCookies } from 'next/dist/server/web/spec-extension/adapters/request-cookies'
import { getAuthCookieName } from '@/lib/auth-cookies'

/** Grace window: avoid invalidating the token from the login that just set lastLoginAt. */
export const STALE_SESSION_GRACE_MS = 10_000

export type AuthCollection = 'users' | 'candidates' | 'employers'

type AuthUser = {
  id: string | number
  collection?: AuthCollection
  email?: string
}

/** Decode JWT payload.iat (seconds) without verifying — caller already ran payload.auth. */
export function getTokenIat(token: string): number | null {
  try {
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(
      Buffer.from(parts[1], 'base64url').toString('utf8'),
    ) as { iat?: number }
    return typeof payload.iat === 'number' ? payload.iat : null
  } catch {
    return null
  }
}

export function resolveAuthCollections(user: AuthUser): AuthCollection[] {
  const coll = user.collection
  if (coll === 'users' || coll === 'candidates' || coll === 'employers') {
    return [coll]
  }
  return ['candidates', 'employers', 'users']
}

export function getTokenFromCookies(
  cookieStore: Pick<ReadonlyRequestCookies, 'get'>,
  collection?: AuthCollection,
): string | undefined {
  if (collection) {
    const named = cookieStore.get(getAuthCookieName(collection))?.value
    if (named) return named
  }
  return cookieStore.get('payload-token')?.value
}

/** True when lastLoginAt is meaningfully after token iat (another login invalidated this token). */
export function isTokenStaleForLastLogin(
  lastLoginAt: string | Date | null | undefined,
  token: string | undefined,
): boolean {
  if (!lastLoginAt || !token) return false
  const iat = getTokenIat(token)
  if (iat == null) return false
  const lastLoginMs = new Date(lastLoginAt).getTime()
  const tokenIssuedMs = iat * 1000
  return lastLoginMs - tokenIssuedMs > STALE_SESSION_GRACE_MS
}

export async function fetchLastLoginAt(
  payload: Payload,
  user: AuthUser,
  collections: AuthCollection[],
): Promise<string | null> {
  for (const coll of collections) {
    try {
      const doc = await payload.findByID({ collection: coll, id: user.id, depth: 0 })
      const lastLoginAt = (doc as { lastLoginAt?: string | null } | null)?.lastLoginAt
      if (lastLoginAt) return lastLoginAt
    } catch {
      /* not in this collection */
    }
  }
  return null
}

export async function isAuthSessionStale(
  payload: Payload,
  user: AuthUser,
  token: string | undefined,
): Promise<boolean> {
  const collections = resolveAuthCollections(user)
  const lastLoginAt = await fetchLastLoginAt(payload, user, collections)
  return isTokenStaleForLastLogin(lastLoginAt, token)
}

/**
 * payload.auth + single-session check (lastLoginAt vs JWT iat).
 * Returns null if unauthenticated or token is from a previous login.
 */
export type PayloadAuthUser = NonNullable<Awaited<ReturnType<Payload['auth']>>['user']>

export async function authenticateRequest(
  payload: Payload,
  headers: ReadonlyHeaders,
  cookieStore: Pick<ReadonlyRequestCookies, 'get'>,
): Promise<PayloadAuthUser | null> {
  const { user } = await payload.auth({ headers })
  if (!user) return null

  const authUser = user as AuthUser
  const token = getTokenFromCookies(cookieStore, authUser.collection)
  if (await isAuthSessionStale(payload, authUser, token)) return null
  return user
}
