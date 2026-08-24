import { NextRequest, NextResponse } from 'next/server'
import { getSkillTree, type Locale } from '@/lib/skills/tree'

export async function GET(request: NextRequest) {
  const localeParam = request.nextUrl.searchParams.get('locale') || 'en'
  const locale: Locale = localeParam === 'ar' ? 'ar' : 'en'

  try {
    const tree = await getSkillTree(locale)
    return NextResponse.json(tree, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    })
  } catch (error) {
    console.error('[Skills Tree] Failed to load:', error)
    return NextResponse.json({ error: 'Failed to load job role tree' }, { status: 500 })
  }
}
