import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { query as dbQuery } from '@/lib/db'

type Locale = 'en' | 'ar'

function localizedName(name: string | null, nameEn: string | null, nameAr: string | null, locale: Locale): string {
  const ok = (s: string | null) => s && s.trim().length > 0
  if (locale === 'ar') {
    if (ok(nameAr)) return nameAr!
    if (ok(name)) return name!
    if (ok(nameEn)) return nameEn!
    return ''
  }
  if (ok(nameEn)) return nameEn!
  if (ok(name)) return name!
  if (ok(nameAr)) return nameAr!
  return ''
}

function localizedNameFromDoc(doc: { name?: string | null; name_en?: string | null; name_ar?: string | null } | null, locale: Locale): string {
  if (!doc) return ''
  return localizedName(doc.name ?? null, doc.name_en ?? null, doc.name_ar ?? null, locale)
}

const DB_ROW_TYPE = {} as {
  id: string
  name: string
  name_en: string | null
  name_ar: string | null
  billing_class: string
  subcategory_name: string | null
  subcategory_name_en: string | null
  subcategory_name_ar: string | null
  category_name: string | null
  category_name_en: string | null
  category_name_ar: string | null
  discipline_name: string | null
  discipline_name_en: string | null
  discipline_name_ar: string | null
}

function rowToSkill(row: typeof DB_ROW_TYPE, locale: Locale) {
  const name = localizedName(row.name, row.name_en, row.name_ar, locale)
  const sub = localizedName(row.subcategory_name, row.subcategory_name_en, row.subcategory_name_ar, locale)
  const cat = localizedName(row.category_name, row.category_name_en, row.category_name_ar, locale)
  const disc = localizedName(row.discipline_name, row.discipline_name_en, row.discipline_name_ar, locale)
  return {
    id: String(row.id),
    name,
    billingClass: row.billing_class,
    subCategory: sub || undefined,
    category: cat || undefined,
    discipline: disc || undefined,
    fullPath: [disc, cat, sub, name].filter(Boolean).join(' > '),
  }
}

async function runVectorSearch(
  searchQuery: string,
  limit: number,
  locale: Locale,
): Promise<{ id: string; name: string; billingClass: string; subCategory?: string; category?: string; discipline?: string; fullPath: string }[] | null> {
  const openaiKey = process.env.OPENAI_API_KEY
  if (!openaiKey) return null
  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiKey}` },
      body: JSON.stringify({ model: 'text-embedding-3-small', input: searchQuery }),
    })
    if (!res.ok) throw new Error(`Embedding failed: ${res.status} ${res.statusText}`)
    const data = await res.json()
    const vec = data?.data?.[0]?.embedding
    if (!Array.isArray(vec) || vec.length !== 1536) throw new Error(`Invalid embedding length: ${vec?.length ?? 0}`)
    const literal = '[' + vec.join(',') + ']'
    const dbResult = await dbQuery<typeof DB_ROW_TYPE>(
      `SELECT s.id, s.name, s.name_en, s.name_ar, s.billing_class,
        sc.name as subcategory_name, sc.name_en as subcategory_name_en, sc.name_ar as subcategory_name_ar,
        c.name as category_name, c.name_en as category_name_en, c.name_ar as category_name_ar,
        d.name as discipline_name, d.name_en as discipline_name_en, d.name_ar as discipline_name_ar
       FROM skills s
       LEFT JOIN subcategories sc ON s.sub_category_id = sc.id
       LEFT JOIN categories c ON sc.category_id = c.id
       LEFT JOIN disciplines d ON c.discipline_id = d.id
       WHERE s.name_embedding_vec IS NOT NULL
       ORDER BY s.name_embedding_vec <=> $1::vector(1536) LIMIT $2`,
      [literal, limit]
    )
    return dbResult.rows.map((r) => rowToSkill(r, locale))
  } catch {
    return null
  }
}

async function runTextSearch(
  searchQuery: string,
  limit: number,
  locale: Locale,
): Promise<{ id: string; name: string; billingClass: string; subCategory?: string; category?: string; discipline?: string; fullPath: string }[]> {
  const payload = await getPayload({ config })
  const result = await payload.find({
    collection: 'skills',
    where: {
      or: [{ name: { contains: searchQuery } }, { group_text: { contains: searchQuery } }],
    },
    limit,
    depth: 2,
    sort: 'name',
  })
  return result.docs.map((skill) => {
    const sub = typeof skill.subCategory === 'object' ? skill.subCategory : null
    const cat = sub && typeof sub.category === 'object' ? sub.category : null
    const disc = cat && typeof cat.discipline === 'object' ? cat.discipline : null
    const name = localizedNameFromDoc(skill, locale)
    const subName = localizedNameFromDoc(sub, locale) || undefined
    const catName = localizedNameFromDoc(cat, locale) || undefined
    const discName = localizedNameFromDoc(disc, locale) || undefined
    return {
      id: String(skill.id),
      name,
      billingClass: skill.billingClass,
      subCategory: subName,
      category: catName,
      discipline: discName,
      fullPath: [discName, catName, subName, name].filter(Boolean).join(' > '),
    }
  })
}

export async function GET(request: NextRequest) {
  const sp = new URL(request.url).searchParams
  const searchQuery = (sp.get('q') || '').trim()
  const limit = Math.min(parseInt(sp.get('limit') || '10', 10) || 10, 100)
  const locale = (sp.get('locale') || 'en') as Locale

  if (searchQuery.length < 2) {
    return NextResponse.json({ skills: [] })
  }

  try {
    const vectorSkills = await runVectorSearch(searchQuery, limit, locale)
    if (vectorSkills) {
      return NextResponse.json({ skills: vectorSkills })
    }
    const skills = await runTextSearch(searchQuery, limit, locale)
    return NextResponse.json({ skills })
  } catch (error) {
    console.error('[Skills Search] Fatal error:', error instanceof Error ? error.message : error, 'query:', searchQuery)
    return NextResponse.json({ error: 'Failed to search skills' }, { status: 500 })
  }
}

