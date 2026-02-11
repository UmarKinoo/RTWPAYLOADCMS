import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSideURL } from '@/utilities/getURL'
import { createUserAndSendInvitation } from '@/lib/auth'
import type { User } from '@/payload-types'

/**
 * POST /api/users/create-and-invite
 * Body: { email: string, role?: 'admin' | 'blog-editor' | 'moderator' | 'user' }
 * Creates the user and sends an invitation email in one step. No need to save first.
 * Caller must be authenticated as a Payload admin user (admin or blog-editor).
 */
export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('payload-token')?.value
    if (!token) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const baseUrl = getServerSideURL()
    const meRes = await fetch(`${baseUrl}/api/users/me`, {
      headers: { Authorization: `JWT ${token}` },
    })
    if (!meRes.ok) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { user } = (await meRes.json()) as { user: User }
    if (!user || (user.role !== 'admin' && user.role !== 'blog-editor')) {
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
