import { NextRequest, NextResponse } from 'next/server'
import { getEmployerStatistics } from '@/lib/payload/employer-dashboard'
import { getCurrentUserType } from '@/lib/currentUserType'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employerId = searchParams.get('employerId')
    const period = searchParams.get('period') as 'week' | 'month' | 'year'

    if (!employerId || !period) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    // Employers may only read their own statistics; admins/moderators may read any
    const userType = await getCurrentUserType()
    const isOwner = userType?.kind === 'employer' && userType.employer.id === Number(employerId)
    const isStaff = userType?.kind === 'admin' || userType?.kind === 'moderator'
    if (!isOwner && !isStaff) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await getEmployerStatistics(Number(employerId), period)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Statistics error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch statistics' }, { status: 500 })
  }
}
