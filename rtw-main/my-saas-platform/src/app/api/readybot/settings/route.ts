import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import {
  loadReadyBotSettings,
  saveReadyBotSettings,
  type ReadyBotRuntimeSettings,
} from '@/lib/readybot/settings'

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
  const settings = await loadReadyBotSettings(auth.payload)
  return NextResponse.json({ success: true, settings })
}

export async function POST(request: NextRequest) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json()) as Partial<ReadyBotRuntimeSettings>
  const settings = await saveReadyBotSettings(auth.payload, body)
  return NextResponse.json({ success: true, settings })
}
