import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { NextRequest, NextResponse } from 'next/server'
import type { UIMessage } from 'ai'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import { saveReadyBotChatSessionMessages } from '@/lib/readybot/chatSessions'

type RouteContext = { params: Promise<{ id: string }> }

async function requireAdmin() {
  const payload = await getPayload({ config })
  const user = await getRequestAuthUser(payload)
  if (!user || user.collection !== 'users' || (user as { role?: string }).role !== 'admin') {
    return null
  }
  return { payload, user }
}

/** Save messages without running the LLM (edit, stop, regenerate prep). */
export async function PUT(request: NextRequest, context: RouteContext) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const body = (await request.json()) as { messages?: UIMessage[] }
  if (!Array.isArray(body.messages)) {
    return NextResponse.json({ success: false, error: 'messages required' }, { status: 400 })
  }

  const session = await saveReadyBotChatSessionMessages(
    auth.payload,
    id,
    auth.user.id,
    body.messages,
  )
  if (!session) {
    return NextResponse.json({ success: false, error: 'Not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true, session })
}
