import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import {
  deleteReadyBotChatSession,
  getReadyBotChatSession,
  renameReadyBotChatSession,
} from '@/lib/readybot/chatSessions'

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const payload = await getPayload({ config })
  const user = await getRequestAuthUser(payload)
  if (!user || user.collection !== 'users' || (user as { role?: string }).role !== 'admin') {
    return null
  }
  return { payload, user }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const session = await getReadyBotChatSession(auth.payload, id, auth.user.id)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, session })
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const body = (await request.json()) as { title?: string }
  if (typeof body.title !== 'string') {
    return NextResponse.json({ success: false, error: 'title required' }, { status: 400 })
  }

  const session = await renameReadyBotChatSession(auth.payload, id, auth.user.id, body.title)
  if (!session) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, session })
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const ok = await deleteReadyBotChatSession(auth.payload, id, auth.user.id)
  if (!ok) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
