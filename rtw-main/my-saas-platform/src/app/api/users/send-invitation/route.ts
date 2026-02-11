import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getServerSideURL } from '@/utilities/getURL'
import { sendUserInvitation } from '@/lib/auth'
import type { User } from '@/payload-types'

/**
 * POST /api/users/send-invitation
 * Body: { userId: number }
 * Sends an invitation email to the user so they can set their password.
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
        { success: false, error: 'Only admins can send invitations' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const userId = typeof body.userId === 'number' ? body.userId : parseInt(body.userId, 10)
    if (Number.isNaN(userId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid userId' },
        { status: 400 },
      )
    }

    const result = await sendUserInvitation(userId)
    if (!result.success) {
      const status = result.errorCode === 'USER_NOT_FOUND' ? 404 : 400
      return NextResponse.json({ success: false, error: result.error }, { status })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[send-invitation]', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send invitation' },
      { status: 500 },
    )
  }
}
