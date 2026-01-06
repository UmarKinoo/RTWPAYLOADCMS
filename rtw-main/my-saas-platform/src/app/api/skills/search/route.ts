import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { query as dbQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  // Declare searchQuery outside try block so it's accessible in catch block
  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10')

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
          billing_class: string
          subcategory_id: string
          subcategory_name: string | null
          category_id: string | null
          category_name: string | null
          discipline_id: string | null
          discipline_name: string | null
        }>(`
          SELECT 
            s.id,
            s.name,
            s.billing_class,
            sc.id as subcategory_id,
            sc.name as subcategory_name,
            c.id as category_id,
            c.name as category_name,
            d.id as discipline_id,
            d.name as discipline_name
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

        // 4. Format results for frontend (same shape as before)
        const skills = dbResult.rows.map((row) => {
          return {
            id: String(row.id),
            name: row.name,
            billingClass: row.billing_class,
            subCategory: row.subcategory_name || undefined,
            category: row.category_name || undefined,
            discipline: row.discipline_name || undefined,
            fullPath: [
              row.discipline_name,
              row.category_name,
              row.subcategory_name,
              row.name,
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

    // Format results for frontend
    const skills = results.docs.map((skill) => {
      const subCategory = typeof skill.subCategory === 'object' ? skill.subCategory : null
      const category =
        subCategory && typeof subCategory.category === 'object' ? subCategory.category : null
      const discipline =
        category && typeof category.discipline === 'object' ? category.discipline : null

      return {
        id: String(skill.id),
        name: skill.name,
        billingClass: skill.billingClass,
        subCategory: subCategory?.name,
        category: category?.name,
        discipline: discipline?.name,
        // Full path for display
        fullPath: [discipline?.name, category?.name, subCategory?.name, skill.name]
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

