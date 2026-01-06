import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params

    const payload = await getPayload({ config })

    const skill = await payload.findByID({
      collection: 'skills',
      id,
      depth: 2, // Include subCategory, category, discipline
    })

    if (!skill) {
      return NextResponse.json({ error: 'Skill not found' }, { status: 404 })
    }

    const subCategory = typeof skill.subCategory === 'object' ? skill.subCategory : null
    const category =
      subCategory && typeof subCategory.category === 'object' ? subCategory.category : null
    const discipline =
      category && typeof category.discipline === 'object' ? category.discipline : null

    return NextResponse.json({
      skill: {
        id: skill.id,
        name: skill.name,
        billingClass: skill.billingClass,
        subCategory: subCategory?.name,
        category: category?.name,
        discipline: discipline?.name,
        fullPath: [discipline?.name, category?.name, subCategory?.name, skill.name]
          .filter(Boolean)
          .join(' > '),
      },
    })
  } catch (error) {
    console.error('Error fetching skill:', error)
    return NextResponse.json({ error: 'Failed to fetch skill' }, { status: 500 })
  }
}














