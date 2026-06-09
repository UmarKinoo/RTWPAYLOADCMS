import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { NextRequest, NextResponse } from 'next/server'
import config from '@payload-config'
import { getPayload } from 'payload'
import { getRequestAuthUser } from '@/lib/payload-auth'
import { scanIncompleteCandidates } from '@/trigger/scanIncompleteCandidates'
import { readyBotTerminalError } from '@/readybot/tools/terminalLog'

async function requireAdmin() {
  const payload = await getPayload({ config })
  const user = await getRequestAuthUser(payload)
  if (!user || user.collection !== 'users' || (user as { role?: string }).role !== 'admin') {
    return null
  }
  return { payload, user }
}

export async function POST(request: NextRequest) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const auth = await requireAdmin()
  if (!auth) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = (await request.json().catch(() => ({}))) as Partial<{
    useLangGraphMultiAgent: boolean
    parallelAgentCount: number
  }>

  const useLangGraphMultiAgent = body.useLangGraphMultiAgent
  const parallelAgentCount =
    body.parallelAgentCount == null ? undefined : Number(body.parallelAgentCount)

  // Validate/normalize. We’ll clamp parallelAgentCount in scanIncompleteCandidates anyway,
  // but we keep it tight here for friendlier errors.
  const overrides: {
    useLangGraphMultiAgent?: boolean
    parallelAgentCount?: number
  } = {}

  if (typeof useLangGraphMultiAgent === 'boolean') {
    overrides.useLangGraphMultiAgent = useLangGraphMultiAgent
    if (useLangGraphMultiAgent && parallelAgentCount != null && Number.isFinite(parallelAgentCount)) {
      overrides.parallelAgentCount = parallelAgentCount
    }
  }

  // Fire-and-forget so the UI can switch to "Live" immediately.
  void scanIncompleteCandidates({ source: 'manual', overrides }).catch((err) => {
    readyBotTerminalError('Dashboard run-scan failed', err, { overrides })
  })

  return NextResponse.json({ success: true })
}

