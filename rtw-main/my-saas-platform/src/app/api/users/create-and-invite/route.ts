import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { createUserAndSendInvitation } from '@/lib/auth'
import type { User } from '@/payload-types'

/**
 * POST /api/users/create-and-invite
 * Body: { email: string, role?: 'admin' | 'blog-editor' | 'moderator' | 'user' }
 * Creates the user and sends an invitation email in one step. No need to save first.
 * Caller must be authenticated as a Payload admin user (admin or blog-editor).
 * Uses Payload auth with incoming request headers so the payload-token cookie is validated server-side (fixes 401 on prod).
 */
export async function POST(request: NextRequest) {
  try {
    const headersList = await headers()
    const payload = await getPayload({ config: await configPromise })
    const { user } = await payload.auth({ headers: headersList })
    if (!user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const typedUser = user as User
    if (typedUser.role !== 'admin' && typedUser.role !== 'blog-editor') {
      return NextResponse.json(
        { success: false, error: 'Only admins can create and send invitations' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const email = typeof body.email === 'string' ? body.email.trim() : ''
    if (!email) {
      return NextResponse.json(
        { success: false, error: 'Email is required' },
        { status: 400 },
      )
    }

    const role = ['admin', 'blog-editor', 'moderator', 'user'].includes(body.role) ? body.role : undefined

    const result = await createUserAndSendInvitation({ email, role })
    if (!result.success) {
      const status =
        result.errorCode === 'EMAIL_IN_USE' ? 409 : result.errorCode === 'INVALID_EMAIL' ? 400 : 500
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    return NextResponse.json({ success: true, userId: result.userId })
  } catch (error) {
    console.error('[create-and-invite]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create user and send invitation' },
      { status: 500 },
    )
  }
}
