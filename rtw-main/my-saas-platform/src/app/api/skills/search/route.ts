import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'

// Helper function to calculate cosine similarity between two vectors
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    return 0
  }

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i]
    normA += vecA[i] * vecA[i]
    normB += vecB[i] * vecB[i]
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB)
  return denominator === 0 ? 0 : dotProduct / denominator
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query || query.length < 2) {
      return NextResponse.json({ skills: [] })
    }

    const payload = await getPayload({ config })
    const openaiKey = process.env.OPENAI_API_KEY

    // If OpenAI key is available, use vector search with group_text embeddings
    if (openaiKey) {
      try {
        // 1. Generate embedding for the search query
        const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${openaiKey}`,
          },
          body: JSON.stringify({
            model: 'text-embedding-3-small',
            input: query,
          }),
        })

        if (!embeddingResponse.ok) {
          throw new Error('Failed to generate query embedding')
        }

        const embeddingResult = await embeddingResponse.json()
        const queryEmbedding = embeddingResult.data[0].embedding

        // 2. Fetch all skills with their embeddings
        const allSkills = await payload.find({
          collection: 'skills',
          limit: 1000, // Adjust based on your dataset size (you have ~370 skills)
          depth: 2, // Include subCategory, category, discipline
          where: {
            name_embedding: {
              exists: true,
            },
          },
        })

        // 3. Calculate cosine similarity for each skill
        const skillsWithSimilarity = allSkills.docs
          .map((skill) => {
            const skillEmbedding = skill.name_embedding as number[] | null
            if (!skillEmbedding || !Array.isArray(skillEmbedding)) {
              return null
            }

            const similarity = cosineSimilarity(queryEmbedding, skillEmbedding)

            const subCategory = typeof skill.subCategory === 'object' ? skill.subCategory : null
            const category =
              subCategory && typeof subCategory.category === 'object' ? subCategory.category : null
            const discipline =
              category && typeof category.discipline === 'object' ? category.discipline : null

            return {
              skill,
              similarity,
              subCategory,
              category,
              discipline,
            }
          })
          .filter((item): item is NonNullable<typeof item> => item !== null)
          .sort((a, b) => b.similarity - a.similarity) // Sort by similarity (highest first)
          .slice(0, limit) // Take top N results

        // 4. Format results for frontend
        const skills = skillsWithSimilarity.map(({ skill, subCategory, category, discipline }) => {
          return {
            id: String(skill.id),
            name: skill.name,
            billingClass: skill.billingClass,
            subCategory: subCategory?.name,
            category: category?.name,
            discipline: discipline?.name,
            fullPath: [discipline?.name, category?.name, subCategory?.name, skill.name]
              .filter(Boolean)
              .join(' > '),
          }
        })

        return NextResponse.json({ skills })
      } catch (vectorError) {
        console.error('Vector search failed, falling back to text search:', vectorError)
        // Fall through to text search below
      }
    }

    // Fallback to text search if vector search fails or OpenAI key is not available
    const results = await payload.find({
      collection: 'skills',
      where: {
        or: [
          {
            name: {
              contains: query,
            },
          },
          {
            group_text: {
              contains: query,
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

    return NextResponse.json({ skills })
  } catch (error) {
    console.error('Error searching skills:', error)
    return NextResponse.json({ error: 'Failed to search skills' }, { status: 500 })
  }
}

