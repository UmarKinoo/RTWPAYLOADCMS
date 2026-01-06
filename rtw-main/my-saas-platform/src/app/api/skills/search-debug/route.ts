import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { query as dbQuery } from '@/lib/db'

export async function GET(request: NextRequest) {
  const timings = {
    totalMs: 0,
    embeddingMs: 0,
    dbMs: 0,
  }
  const startTime = Date.now()
  
  // Declare searchQuery outside try block so it's accessible in catch block
  const { searchParams } = new URL(request.url)
  const searchQuery = searchParams.get('q') || ''
  const limit = parseInt(searchParams.get('limit') || '10')

  try {

    if (!searchQuery || searchQuery.length < 2) {
      timings.totalMs = Date.now() - startTime
      return NextResponse.json({ 
        skills: [], 
        method: 'text' as const,
        timings 
      })
    }

    const payload = await getPayload({ config })
    const openaiKey = process.env.OPENAI_API_KEY

    console.log('[Skills Search Debug] Request received:', {
      query: searchQuery,
      limit,
      hasOpenAIKey: !!openaiKey,
      openaiKeyLength: openaiKey?.length || 0,
    })

    // If OpenAI key is available, use pgvector similarity search
    if (openaiKey) {
      try {
        console.log('[OpenAI Debug] Starting embedding generation:', {
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

        if (!embeddingResponse.ok) {
          const errorText = await embeddingResponse.text()
          timings.embeddingMs = Date.now() - embeddingStart
          console.error('[OpenAI Debug] Embedding generation failed:', {
            status: embeddingResponse.status,
            statusText: embeddingResponse.statusText,
            error: errorText,
            query: searchQuery,
            timeMs: timings.embeddingMs,
          })
          throw new Error(`Failed to generate query embedding: ${embeddingResponse.status} ${embeddingResponse.statusText}`)
        }

        const embeddingResult = await embeddingResponse.json()
        const queryEmbedding = embeddingResult.data[0].embedding
        timings.embeddingMs = Date.now() - embeddingStart

        console.log('[OpenAI Debug] Embedding generated successfully:', {
          query: searchQuery,
          embeddingLength: queryEmbedding?.length || 0,
          timeMs: timings.embeddingMs,
          model: embeddingResult.model,
          usage: embeddingResult.usage,
        })

        // Validate embedding dimensions
        if (!Array.isArray(queryEmbedding) || queryEmbedding.length !== 1536) {
          console.error('[OpenAI Debug] Invalid embedding dimensions:', {
            expected: 1536,
            actual: queryEmbedding?.length || 0,
            isArray: Array.isArray(queryEmbedding),
            query: searchQuery,
          })
          throw new Error(`Invalid embedding dimensions: expected 1536, got ${queryEmbedding?.length || 0}`)
        }

        // 2. Convert embedding array to pgvector literal format
        const vectorLiteral = '[' + queryEmbedding.join(',') + ']'
        console.log('[pgvector Debug] Vector literal created, length:', vectorLiteral.length)

        // 3. Query database using pgvector cosine distance (<=>)
        const dbStart = Date.now()
        console.log('[pgvector Debug] Starting database query:', {
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
        timings.dbMs = Date.now() - dbStart

        console.log('[pgvector Debug] Database query completed:', {
          query: searchQuery,
          resultsCount: dbResult.rows.length,
          timeMs: timings.dbMs,
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

        timings.totalMs = Date.now() - startTime
        console.log('[Skills Search Debug] pgvector search completed successfully:', {
          query: searchQuery,
          skillsFound: skills.length,
          method: 'pgvector',
          timings,
        })

        return NextResponse.json({ 
          skills, 
          method: 'pgvector' as const,
          timings 
        })
      } catch (vectorError) {
        console.error('[Skills Search Debug] Vector search failed, falling back to text search:', {
          error: vectorError instanceof Error ? vectorError.message : String(vectorError),
          stack: vectorError instanceof Error ? vectorError.stack : undefined,
          query: searchQuery,
        })
        // Fall through to text search below
      }
    } else {
      console.log('[Skills Search Debug] OpenAI key not available, using text search:', {
        query: searchQuery,
      })
    }

    // Fallback to text search if vector search fails or OpenAI key is not available
    console.log('[Skills Search Debug] Using text search fallback:', {
      query: searchQuery,
      limit,
    })
    
    const dbStart = Date.now()
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
    timings.dbMs = Date.now() - dbStart

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

    timings.totalMs = Date.now() - startTime
    console.log('[Skills Search Debug] Text search completed:', {
      query: searchQuery,
      skillsFound: skills.length,
      method: 'text',
      timings,
    })

    return NextResponse.json({ 
      skills, 
      method: 'text' as const,
      timings 
    })
  } catch (error) {
    console.error('[Skills Search Debug] Fatal error:', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      query: searchQuery,
    })
    timings.totalMs = Date.now() - startTime
    return NextResponse.json({ 
      error: 'Failed to search skills',
      skills: [],
      method: 'text' as const,
      timings 
    }, { status: 500 })
  }
}

