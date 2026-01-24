import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { query as dbQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  // Declare searchQuery outside try block so it's accessible in catch block
  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10')
  // Get locale from query param or default to 'en'
  const locale = (searchParams.get('locale') || 'en') as 'en' | 'ar'

  try {

    if (!searchQuery || searchQuery.length < 2) {
      return NextResponse.json({ skills: [] })
    }

    const payload = await getPayload({ config })
    const openaiKey = process.env.OPENAI_API_KEY

    console.log('[Skills Search] Request received:', {
      query: searchQuery,
      limit,
      hasOpenAIKey: !!openaiKey,
      openaiKeyLength: openaiKey?.length || 0,
    })

    // If OpenAI key is available, use pgvector similarity search
    if (openaiKey) {
      try {
        console.log('[OpenAI] Starting embedding generation:', {
          query: searchQuery,
          model: 'text-embedding-3-small',
        })

        // 1. Generate embedding for the search query
        const embeddingStart = Date.now()
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: searchQuery,
          }),
        })

        const embeddingTime = Date.now() - embeddingStart

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text()
          console.error('[OpenAI] Embedding generation failed:', {
            status: embeddingResponse.status,
            statusText: embeddingResponse.statusText,
            error: errorText,
            query: searchQuery,
          })
          throw new Error(`Failed to generate query embedding: ${embeddingResponse.status} ${embeddingResponse.statusText}`)
        }

        const embeddingResult = await embeddingResponse.json()
        const queryEmbedding = embeddingResult.data[0].embedding

        console.log('[OpenAI] Embedding generated successfully:', {
          query: searchQuery,
          embeddingLength: queryEmbedding?.length || 0,
          timeMs: embeddingTime,
          model: embeddingResult.model,
          usage: embeddingResult.usage,
        })

        // Validate embedding dimensions
        if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 1536) {
          console.error('[OpenAI] Invalid embedding dimensions:', {
            expected: 1536,
            actual: queryEmbedding?.length || 0,
            isArray: Array.isArray(queryEmbedding),
            query: searchQuery,
          })
          throw new Error(`Invalid embedding dimensions: expected 1536, got ${queryEmbedding?.length || 0}`)
        }

        // 2. Convert embedding array to pgvector literal format
        const vectorLiteral = '[' + queryEmbedding.join(',') + ']'
        console.log('[pgvector] Vector literal created, length:', vectorLiteral.length)

        // 3. Query database using pgvector cosine distance (<=>)
        // The <=> operator returns cosine distance (0 = identical, 2 = opposite)
        // We order by distance ascending (most similar first)
        const dbStart = Date.now()
        console.log('[pgvector] Starting database query:', {
          query: searchQuery,
          limit,
        })
        
        const dbResult = await dbQuery<{
          id: string
          name: string
          name_en: string | null
          name_ar: string | null
          billing_class: string
          subcategory_id: string
          subcategory_name: string | null
          subcategory_name_en: string | null
          subcategory_name_ar: string | null
          category_id: string | null
          category_name: string | null
          category_name_en: string | null
          category_name_ar: string | null
          discipline_id: string | null
          discipline_name: string | null
          discipline_name_en: string | null
          discipline_name_ar: string | null
        }>(`
          SELECT 
            s.id,
            s.name,
            s.name_en,
            s.name_ar,
            s.billing_class,
            sc.id as subcategory_id,
            sc.name as subcategory_name,
            sc.name_en as subcategory_name_en,
            sc.name_ar as subcategory_name_ar,
            c.id as category_id,
            c.name as category_name,
            c.name_en as category_name_en,
            c.name_ar as category_name_ar,
            d.id as discipline_id,
            d.name as discipline_name,
            d.name_en as discipline_name_en,
            d.name_ar as discipline_name_ar
          FROM skills s
          LEFT JOIN subcategories sc ON s.sub_category_id = sc.id
          LEFT JOIN categories c ON sc.category_id = c.id
          LEFT JOIN disciplines d ON c.discipline_id = d.id
          WHERE s.name_embedding_vec IS NOT NULL
          ORDER BY s.name_embedding_vec <=> $1::vector(1536)
          LIMIT $2
        `, [vectorLiteral, limit])

        const dbTime = Date.now() - dbStart
        console.log('[pgvector] Database query completed:', {
          query: searchQuery,
          resultsCount: dbResult.rows.length,
          timeMs: dbTime,
        })

        // 4. Format results for frontend with localized names
        const getLocalizedName = (name: string | null, name_en: string | null, name_ar: string | null): string => {
          if (locale === 'ar') {
            if (name_ar && name_ar.trim()) return name_ar
            // Prefer base name before falling back to English
            if (name && name.trim()) return name
            if (name_en && name_en.trim()) return name_en
            return ''
          }
          // locale === 'en'
          if (name_en && name_en.trim()) return name_en
          // Prefer base name before falling back to Arabic
          if (name && name.trim()) return name
          if (name_ar && name_ar.trim()) return name_ar
          return ''
        }

        const skills = dbResult.rows.map((row, index) => {
          const skillName = getLocalizedName(row.name, row.name_en, row.name_ar)
          const subCategoryName = getLocalizedName(row.subcategory_name, row.subcategory_name_en, row.subcategory_name_ar)
          const categoryName = getLocalizedName(row.category_name, row.category_name_en, row.category_name_ar)
          const disciplineName = getLocalizedName(row.discipline_name, row.discipline_name_en, row.discipline_name_ar)
          
          // Debug logging for first result
          if (index === 0) {
            console.log('[Skills Search] First result localization:', {
              locale,
              skillName,
              name: row.name,
              name_en: row.name_en,
              name_ar: row.name_ar,
            })
          }

          return {
            id: String(row.id),
            name: skillName,
            billingClass: row.billing_class,
            subCategory: subCategoryName || undefined,
            category: categoryName || undefined,
            discipline: disciplineName || undefined,
            fullPath: [
              disciplineName,
              categoryName,
              subCategoryName,
              skillName,
            ]
              .filter(Boolean)
              .join(' > '),
          }
        })

        console.log('[Skills Search] pgvector search completed successfully:', {
          query: searchQuery,
          skillsFound: skills.length,
          method: 'pgvector',
        })

        return NextResponse.json({ skills })
      } catch (vectorError) {
        console.error('[Skills Search] Vector search failed, falling back to text search:', {
          error: vectorError instanceof Error ? vectorError.message : String(vectorError),
          stack: vectorError instanceof Error ? vectorError.stack : undefined,
          query: searchQuery,
        })
        // Fall through to text search below
      }
    } else {
      console.log('[Skills Search] OpenAI key not available, using text search:', {
        query: searchQuery,
      })
    }

    // Fallback to text search if vector search fails or OpenAI key is not available
    console.log('[Skills Search] Using text search fallback:', {
      query: searchQuery,
      limit,
    })
    
    const results = await payload.find({
      collection: 'skills',
      where: {
        or: [
          {
            name: {
              contains: searchQuery,
            },
          },
          {
            group_text: {
              contains: searchQuery,
            },
          },
        ],
      },
      limit,
      depth: 2, // Include subCategory, category, discipline
      sort: 'name',
    })

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

    // Format results for frontend with localized names
    const skills = results.docs.map((skill) => {
      const subCategory = typeof skill.subCategory === 'object' ? skill.subCategory : null
      const category =
        subCategory && typeof subCategory.category === 'object' ? subCategory.category : null
      const discipline =
        category && typeof category.discipline === 'object' ? category.discipline : null

      const skillName = getLocalizedName(skill)
      const subCategoryName = subCategory ? getLocalizedName(subCategory) : undefined
      const categoryName = category ? getLocalizedName(category) : undefined
      const disciplineName = discipline ? getLocalizedName(discipline) : undefined

      return {
        id: String(skill.id),
        name: skillName,
        billingClass: skill.billingClass,
        subCategory: subCategoryName,
        category: categoryName,
        discipline: disciplineName,
        // Full path for display
        fullPath: [disciplineName, categoryName, subCategoryName, skillName]
          .filter(Boolean)
          .join(' > '),
      }
    })

    console.log('[Skills Search] Text search completed:', {
      query: searchQuery,
      skillsFound: skills.length,
      method: 'text',
    })

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('[Skills Search] Fatal error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query: searchQuery,
    })
    return NextResponse.json({ error: 'Failed to search skills' }, { status: 500 })
  }
}

