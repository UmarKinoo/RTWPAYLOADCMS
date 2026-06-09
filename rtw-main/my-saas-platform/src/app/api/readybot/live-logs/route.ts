import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import { loadReadyBotLiveLogs } from '@/lib/readybot/liveLogs'

export async function GET(request: NextRequest) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const payload = await getPayload({ config })
  const user = await getRequestAuthUser(payload)
  if (!user || user.collection !== 'users' || (user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const since = request.nextUrl.searchParams.get('since') ?? undefined
  const data = await loadReadyBotLiveLogs(since)
  return NextResponse.json(data)
}
