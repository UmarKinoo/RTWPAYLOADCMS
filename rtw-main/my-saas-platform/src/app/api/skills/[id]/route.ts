import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const locale = (searchParams.get('locale') || 'en') as 'en' | 'ar'

    const payload = await getPayload({ config })

    const skill = await payload.findByID({
      collection: 'skills',
      id,
      depth: 2, // Include subCategory, category, discipline
    })

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    // Helper function to get localized name
    const getLocalizedName = (doc: any): string => {
      if (locale === 'ar') {
        if (doc?.name_ar && doc.name_ar.trim()) return doc.name_ar
        // Prefer base name before falling back to English
        if (doc?.name && doc.name.trim()) return doc.name
        if (doc?.name_en && doc.name_en.trim()) return doc.name_en
        return ''
      }
      // locale === 'en'
      if (doc?.name_en && doc.name_en.trim()) return doc.name_en
      // Prefer base name before falling back to Arabic
      if (doc?.name && doc.name.trim()) return doc.name
      if (doc?.name_ar && doc.name_ar.trim()) return doc.name_ar
      return ''
    }

    const subCategory = typeof skill.subCategory === 'object' ? skill.subCategory : null
    const category =
      subCategory && typeof subCategory.category === 'object' ? subCategory.category : null
    const discipline =
      category && typeof category.discipline === 'object' ? category.discipline : null

    const skillName = getLocalizedName(skill)
    const subCategoryName = subCategory ? getLocalizedName(subCategory) : undefined
    const categoryName = category ? getLocalizedName(category) : undefined
    const disciplineName = discipline ? getLocalizedName(discipline) : undefined

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



















