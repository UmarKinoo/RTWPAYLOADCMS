import { readyBotApiGuard } from '@/lib/readybot/isReadyBotEnabled'
import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { getRequestAuthUser } from '@/lib/payload-auth'
import { rejectHumanReview } from '@/readybot/services/applyHumanReview'

export async function POST(request: NextRequest) {
  const blocked = readyBotApiGuard()
  if (blocked) return blocked

  const payload = await getPayload({ config })
  const user = await getRequestAuthUser(payload)
  if (!user || user.collection !== 'users' || (user as { role?: string }).role !== 'admin') {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const reviewTaskId = body.reviewTaskId
  if (reviewTaskId == null) {
    return NextResponse.json({ success: false, error: 'reviewTaskId required' }, { status: 400 })
  }

  const result = await rejectHumanReview(
    { payload },
    reviewTaskId,
    user.id,
    body.adminNotes,
  )

  return NextResponse.json(result)
}
