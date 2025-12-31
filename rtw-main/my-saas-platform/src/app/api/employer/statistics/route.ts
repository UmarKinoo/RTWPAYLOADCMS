import { NextRequest, NextResponse } from 'next/server'
import { getEmployerStatistics } from '@/lib/payload/employer-dashboard'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const employerId = searchParams.get('employerId')
    const period = searchParams.get('period') as 'week' | 'month' | 'year'

    if (!employerId || !period) {
      return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
    }

    const data = await getEmployerStatistics(Number(employerId), period)

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Statistics error:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch statistics' }, { status: 500 })
  }
}



