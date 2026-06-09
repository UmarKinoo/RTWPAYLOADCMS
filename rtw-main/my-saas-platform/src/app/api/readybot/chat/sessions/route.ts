import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import {
  createReadyBotChatSession,
  listReadyBotChatSessions,
} from '@/lib/readybot/chatSessions'

async function requireAdmin() {
  const payload = await getPayload({ config })
  const user = await getRequestAuthUser(payload)
  if (!user || user.collection !== 'users' || (user as { role?: string }).role !== 'admin') {
    return null
  }
  return { payload, user }
}

export async function GET() {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const sessions = await listReadyBotChatSessions(auth.payload, auth.user.id)
  return NextResponse.json({ success: true, sessions })
}

export async function POST(request: NextRequest) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as { locale?: string }
  const locale = typeof body.locale === 'string' ? body.locale : 'en'

  const session = await createReadyBotChatSession(auth.payload, auth.user.id, locale)
  return NextResponse.json({ success: true, session })
}
