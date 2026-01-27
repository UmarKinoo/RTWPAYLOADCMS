import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

function getLocalizedName(doc: any, locale: 'en' | 'ar'): string {
  const n = doc?.name
  const ne = doc?.name_en
  const na = doc?.name_ar
  const ok = (s: unknown) => typeof s === 'string' && s.trim().length > 0
  if (locale === 'ar') {
    if (ok(na)) return na
    if (ok(n)) return n
    if (ok(ne)) return ne
    return ''
  }
  if (ok(ne)) return ne
  if (ok(n)) return n
  if (ok(na)) return na
  return ''
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const locale = ((new URL(request.url).searchParams.get('locale')) || 'en') as 'en' | 'ar'
    const payload = await getPayload({ config })
    const skill = await payload.findByID({
      collection: 'skills',
      id,
      depth: 2,
    })
    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    const subCategory = typeof skill.subCategory === 'object' ? skill.subCategory : null
    const category =
      subCategory && typeof subCategory.category === 'object' ? subCategory.category : null
    const discipline =
      category && typeof category.discipline === 'object' ? category.discipline : null

    const skillName = getLocalizedName(skill, locale)
    const subCategoryName = subCategory ? getLocalizedName(subCategory, locale) : undefined
    const categoryName = category ? getLocalizedName(category, locale) : undefined
    const disciplineName = discipline ? getLocalizedName(discipline, locale) : undefined

    return NextResponse.json({
      skill: {
        id: skill.id,
        name: skillName,
        billingClass: skill.billingClass,
        subCategory: subCategoryName,
        category: categoryName,
        discipline: disciplineName,
        fullPath: [disciplineName, categoryName, subCategoryName, skillName]
          .filter(Boolean)
          .join(' > '),
      },
    })
  } catch (error) {
    console.error('Error fetching skill:', error)
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 })
  }
}



















