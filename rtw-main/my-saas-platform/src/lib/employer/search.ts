'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { getCurrentUserType } from '@/lib/currentUserType'
import { query as dbQuery } from '@/lib/db'
import type { BillingClass } from '@/lib/billing'

export interface SearchCandidatesResult {
  candidates: Array<{
    id: number
    firstName: string
    lastName: string
    jobTitle: string
    location: string
    nationality: string
    experienceYears: number
    saudiExperience: number
    profilePictureUrl: string | null
    billingClass: BillingClass | null
  }>
  total: number
}

export async function searchCandidates(
  query: string,
  limit: number = 20
): Promise<SearchCandidatesResult> {
  try {
    const payload = await getPayload({ config: await configPromise })

    // Get current user type
    const userType = await getCurrentUserType()

    if (!userType) {
      throw new Error('Unauthorized')
    }

    // Allow admin or employer
    let employerId: number
    if (userType.kind === 'admin') {
      // Admin can search, but we need an employer ID for tracking interactions
      // For now, throw error - you may want to handle admin search differently
      throw new Error('Admin search not yet supported')
    } else if (userType.kind === 'employer') {
      employerId = userType.employer.id
    } else {
      throw new Error('Unauthorized')
    }

    if (!query || typeof query !== 'string') {
      throw new Error('Query is required')
    }

    const searchQuery = query.trim()

    // Require minimum query length
    if (searchQuery.length < 2) {
      return {
        candidates: [],
        total: 0,
      }
    }

    let candidateIds: number[] = []
    let bioVectorCandidateIds: number[] = []
    let skillVectorCandidateIds: number[] = []

    // Hybrid search: bio vector + skill vector + keyword
    const openaiKey = process.env.OPENAI_API_KEY
    if (openaiKey) {
      try {
        // Generate embedding for the search query
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

        if (embeddingResponse.ok) {
          const embeddingResult = await embeddingResponse.json()
          const queryEmbedding = embeddingResult.data[0].embedding

          if (Array.isArray(queryEmbedding) && queryEmbedding.length === 1536) {
            // Convert embedding array to pgvector literal format
            const vectorLiteral = '[' + queryEmbedding.join(',') + ']'

            // 1. Direct candidate bio vector search (highest priority)
            // Using similarity threshold: cosine distance < 0.7 (more similar = lower distance)
            // This filters out candidates that are too dissimilar
            try {
              const bioVectorResult = await dbQuery<{ id: string; distance: number }>(`
                SELECT id, bio_embedding_vec <=> $1::vector(1536) as distance
                FROM candidates
                WHERE bio_embedding_vec IS NOT NULL
                  AND terms_accepted = true
                  AND (bio_embedding_vec <=> $1::vector(1536)) < 0.7
                ORDER BY bio_embedding_vec <=> $1::vector(1536)
                LIMIT 50
              `, [vectorLiteral])

              bioVectorCandidateIds = bioVectorResult.rows.map((row) => parseInt(row.id))
              console.log(`[Search] Bio vector search found ${bioVectorCandidateIds.length} candidates for query: "${searchQuery}"`)
            } catch (bioError) {
              console.warn('Bio vector search failed:', bioError)
            }

            // 2. Skill vector search (secondary)
            // Using similarity threshold: cosine distance < 0.7
            try {
              const skillsResult = await dbQuery<{ id: string; distance: number }>(`
                SELECT id, name_embedding_vec <=> $1::vector(1536) as distance
                FROM skills
                WHERE name_embedding_vec IS NOT NULL
                  AND (name_embedding_vec <=> $1::vector(1536)) < 0.7
                ORDER BY name_embedding_vec <=> $1::vector(1536)
                LIMIT 10
              `, [vectorLiteral])

              if (skillsResult.rows.length > 0) {
                const skillIds = skillsResult.rows.map((row) => parseInt(row.id))
                console.log(`[Search] Skill vector search found ${skillIds.length} matching skills for query: "${searchQuery}"`)

                // Find candidates with matching skills
                const candidatesBySkill = await payload.find({
                  collection: 'candidates',
                  where: {
                    and: [
                      {
                        termsAccepted: {
                          equals: true,
                        },
                      },
                      {
                        primarySkill: {
                          in: skillIds,
                        },
                      },
                    ],
                  },
                  limit: 50,
                  overrideAccess: true,
                })

                skillVectorCandidateIds = candidatesBySkill.docs.map((c) => c.id)
                console.log(`[Search] Found ${skillVectorCandidateIds.length} candidates with matching skills`)
              }
            } catch (skillError) {
              console.warn('Skill vector search failed:', skillError)
            }
          }
        }
      } catch (vectorError) {
        console.warn('Vector search failed, falling back to keyword search:', vectorError)
      }
    }

    // 3. Keyword search (name, job title) - only if no vector results found
    // Only run keyword search if vector search didn't return enough results
    let keywordCandidateIds: number[] = []
    if (bioVectorCandidateIds.length === 0 && skillVectorCandidateIds.length === 0) {
      const nameSearchResults = await payload.find({
        collection: 'candidates',
        where: {
          and: [
            {
              termsAccepted: {
                equals: true,
              },
            },
            {
              or: [
                {
                  firstName: {
                    contains: searchQuery,
                  },
                },
                {
                  lastName: {
                    contains: searchQuery,
                  },
                },
                {
                  jobTitle: {
                    contains: searchQuery,
                  },
                },
              ],
            },
          ],
        },
        limit: 50,
        overrideAccess: true,
      })

      keywordCandidateIds = nameSearchResults.docs.map((c) => c.id)
      console.log(`[Search] Keyword search found ${keywordCandidateIds.length} candidates for query: "${searchQuery}"`)
    }

    // Combine candidate IDs from all three search methods
    // Priority: bio vector > skill vector > keyword
    // Merge with priority: bio vector first, then skill vector, then keyword
    // Use Set to deduplicate while preserving order
    const allCandidateIds = [
      ...bioVectorCandidateIds,
      ...skillVectorCandidateIds.filter((id) => !bioVectorCandidateIds.includes(id)),
      ...keywordCandidateIds.filter(
        (id) => !bioVectorCandidateIds.includes(id) && !skillVectorCandidateIds.includes(id)
      ),
    ].slice(0, limit)

    console.log(
      `[Search] Total candidates after combining: ${allCandidateIds.length} (bio: ${bioVectorCandidateIds.length}, skill: ${skillVectorCandidateIds.length}, keyword: ${keywordCandidateIds.length})`
    )

    // Fetch final candidates (limit and deduplicate)
    const finalCandidates =
      allCandidateIds.length > 0
        ? await payload.find({
            collection: 'candidates',
            where: {
              and: [
                {
                  termsAccepted: {
                    equals: true,
                  },
                },
                {
                  id: {
                    in: allCandidateIds.slice(0, limit),
                  },
                },
              ],
            },
            limit,
            depth: 1,
            overrideAccess: true,
          })
        : { docs: [] }

    // Track view interaction for each candidate
    for (const candidate of finalCandidates.docs) {
      try {
        await payload.create({
          collection: 'candidate-interactions',
          data: {
            employer: employerId,
            candidate: candidate.id,
            interactionType: 'view',
            metadata: {
              source: 'dashboard_search',
              query: searchQuery,
            },
          },
        })
      } catch (error) {
        // Ignore duplicate interaction errors
        console.warn('Failed to track interaction:', error)
      }
    }

    return {
      candidates: finalCandidates.docs.map((candidate) => ({
        id: candidate.id,
        firstName: candidate.firstName,
        lastName: candidate.lastName,
        jobTitle: candidate.jobTitle,
        location: candidate.location,
        nationality: candidate.nationality || '',
        experienceYears: candidate.experienceYears || 0,
        saudiExperience: candidate.saudiExperience || 0,
        profilePictureUrl:
          candidate.profilePicture && typeof candidate.profilePicture === 'object'
            ? candidate.profilePicture.url || null
            : null,
        billingClass: (candidate.billingClass as BillingClass) || null,
      })),
      total: finalCandidates.docs.length,
    }
  } catch (error: any) {
    console.error('Search error:', error)
    throw new Error(error.message || 'Search failed')
  }
}
