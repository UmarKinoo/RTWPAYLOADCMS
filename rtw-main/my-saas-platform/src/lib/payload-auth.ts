'use server'

import { cookies, headers } from 'next/headers'
import type { Payload } from 'payload'
import { authenticateRequest } from '@/lib/single-session'

/** payload.auth + single-session (lastLoginAt vs JWT iat). */
export async function getRequestAuthUser(payload: Payload) {
  return authenticateRequest(payload, await headers(), await cookies())
}
