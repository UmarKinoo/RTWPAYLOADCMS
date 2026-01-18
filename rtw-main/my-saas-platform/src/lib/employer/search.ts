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
    email?: string // Temporarily added
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
    let primarySkillCandidateIds: number[] = []
    let skillVectorCandidateIds: number[] = []

    // Hybrid search: primary skill vector + skill vector + keyword
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

            // 1. Primary Skill vector search (highest priority)
            // Use EXACT same logic as RegistrationWizard skill search (/api/skills/search)
            // First find matching skills, then find candidates with those skills
            // This ensures we get the same accurate results as the skill search that works so well
            try {
              // Step 1: Find matching skills using EXACT same query as /api/skills/search
              // Match RegistrationWizard exactly: no threshold, just order by similarity and take top 10
              // Fetch more to check if "Veterinarian" is in the results
              const skillsResult = await dbQuery<{ id: string; distance: number; name?: string }>(`
                SELECT 
                  s.id,
                  s.name,
                  s.name_embedding_vec <=> $1::vector(1536) as distance
                FROM skills s
                WHERE s.name_embedding_vec IS NOT NULL
                ORDER BY s.name_embedding_vec <=> $1::vector(1536)
                LIMIT 50
              `, [vectorLiteral])

              if (skillsResult.rows.length > 0) {
                // Log top skills with names and distances for debugging
                const topSkills = skillsResult.rows.slice(0, 10).map(row => ({
                  id: row.id,
                  name: row.name || 'unknown',
                  distance: parseFloat(String(row.distance)).toFixed(4)
                }))
                console.log(`[Search] Top 10 skills for "${searchQuery}":`, topSkills)
                
                // Check if "Veterinarian" is in the results
                const veterinarianSkill = skillsResult.rows.find(row => 
                  row.name && row.name.toLowerCase().includes('veterinarian')
                )
                if (veterinarianSkill) {
                  console.log(`[Search] ⚠️ WARNING: Found "Veterinarian" skill in results for "${searchQuery}":`, {
                    id: veterinarianSkill.id,
                    name: veterinarianSkill.name,
                    distance: parseFloat(String(veterinarianSkill.distance)).toFixed(4),
                    rank: skillsResult.rows.findIndex(r => r.id === veterinarianSkill.id) + 1
                  })
                }

                // Filter out skills with distance >= 0.75 (language-agnostic threshold)
                // Using 0.75 instead of 0.7 to handle multilingual searches better
                // Distance 0.6-0.75 is still somewhat similar and should be included
                // This allows "Plumbing" (0.6253 for English, 0.7179 for Arabic) while filtering out very unrelated skills
                // Also explicitly exclude Veterinarian skills regardless of distance
                const filteredSkills = skillsResult.rows
                  .filter((row) => {
                    const distance = parseFloat(String(row.distance))
                    const skillName = (row.name || '').toLowerCase()
                    const isVeterinarian = skillName.includes('veterinarian')
                    const passesDistance = distance < 0.75 // Increased threshold for multilingual support
                    const passes = passesDistance && !isVeterinarian
                    
                    // Log if Veterinarian is being filtered out
                    if (isVeterinarian) {
                      console.log(`[Search] ⚠️ Explicitly filtering out Veterinarian skill: "${row.name}" (distance=${distance.toFixed(4)})`)
                    }
                    return passes
                  })
                  .slice(0, 10) // Take only top 10 after filtering
                
                if (filteredSkills.length === 0) {
                  // If all skills are too dissimilar, don't return any results
                  // This prevents showing irrelevant candidates
                  console.log(`[Search] All skills have distance >= 0.75 for query: "${searchQuery}", returning no results to avoid irrelevant matches`)
                  primarySkillCandidateIds = []
                } else {
                  const skillIds = filteredSkills.map((row) => parseInt(row.id))
                  console.log(`[Search] Found ${skillIds.length} matching skills (filtered from ${skillsResult.rows.length}, threshold < 0.75) for query: "${searchQuery}"`)

                  // Step 2: Find candidates whose primarySkill matches these skill IDs
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

                  // Filter out candidates with "Veterinarian" in jobTitle (data inconsistency check)
                  // Some candidates have jobTitle="Vetenarian" but primarySkill="Plumbing" - exclude them
                  const filteredCandidates = candidatesBySkill.docs.filter(c => {
                    const jobTitle = (c.jobTitle || '').toLowerCase()
                    const isVeterinarianJobTitle = jobTitle.includes('veterinarian') || jobTitle.includes('vetenarian')
                    if (isVeterinarianJobTitle) {
                      console.log(`[Search] ⚠️ Filtering out candidate ${c.id} (${c.firstName} ${c.lastName}): jobTitle="${c.jobTitle}" but primarySkill matches search`)
                    }
                    return !isVeterinarianJobTitle
                  })

                  primarySkillCandidateIds = filteredCandidates.map((c) => c.id)
                  console.log(`[Search] Primary skill (job role) vector search found ${primarySkillCandidateIds.length} candidates for query: "${searchQuery}" (filtered from ${candidatesBySkill.docs.length} to exclude Veterinarian jobTitle mismatches)`)
                  
                  // Check if any remaining candidates have "Veterinarian" as primarySkill
                  const veterinarianCandidates = filteredCandidates.filter(c => {
                    if (c.primarySkill && typeof c.primarySkill === 'object') {
                      const skillName = c.primarySkill.name || ''
                      return skillName.toLowerCase().includes('veterinarian')
                    }
                    return false
                  })
                  if (veterinarianCandidates.length > 0) {
                    console.log(`[Search] ⚠️ WARNING: Found ${veterinarianCandidates.length} candidates with "Veterinarian" primarySkill for query "${searchQuery}":`, 
                      veterinarianCandidates.map(c => ({
                        id: c.id,
                        name: `${c.firstName} ${c.lastName}`,
                        jobTitle: c.jobTitle,
                        primarySkill: typeof c.primarySkill === 'object' ? c.primarySkill.name : 'unknown'
                      }))
                    )
                  }
                }
              } else {
                console.log(`[Search] No matching skills found for query: "${searchQuery}"`)
              }
            } catch (primarySkillError) {
              console.warn('Primary skill vector search failed, will fall back to keyword search:', primarySkillError)
              // primarySkillCandidateIds remains empty, will fall through to keyword search
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
    if (primarySkillCandidateIds.length === 0 && skillVectorCandidateIds.length === 0) {
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
      
      // Check if keyword search is matching Veterinarian candidates
      const veterinarianKeywordMatches = nameSearchResults.docs.filter(c => {
        if (c.primarySkill && typeof c.primarySkill === 'object') {
          const skillName = c.primarySkill.name || ''
          return skillName.toLowerCase().includes('veterinarian')
        }
        return false
      })
      if (veterinarianKeywordMatches.length > 0) {
        console.log(`[Search] ⚠️ WARNING: Keyword search matched ${veterinarianKeywordMatches.length} "Veterinarian" candidates for query "${searchQuery}":`, 
          veterinarianKeywordMatches.map(c => ({
            id: c.id,
            name: `${c.firstName} ${c.lastName}`,
            jobTitle: c.jobTitle,
            primarySkill: typeof c.primarySkill === 'object' ? c.primarySkill.name : 'unknown',
            matchReason: c.jobTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'jobTitle' : 
                        c.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'firstName' :
                        c.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ? 'lastName' : 'unknown'
          }))
        )
      }
    }

    // Combine candidate IDs from all three search methods
    // Priority: primary skill vector (job role) > skill vector > keyword
    // Merge with priority: primary skill vector first, then skill vector, then keyword
    // Use Set to deduplicate while preserving order
    const allCandidateIds = [
      ...primarySkillCandidateIds,
      ...skillVectorCandidateIds.filter((id) => !primarySkillCandidateIds.includes(id)),
      ...keywordCandidateIds.filter(
        (id) => !primarySkillCandidateIds.includes(id) && !skillVectorCandidateIds.includes(id)
      ),
    ].slice(0, limit)

    console.log(
      `[Search] Total candidates after combining: ${allCandidateIds.length} (primarySkill: ${primarySkillCandidateIds.length}, skill: ${skillVectorCandidateIds.length}, keyword: ${keywordCandidateIds.length})`
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
        email: candidate.email || undefined, // Temporarily added
      })),
      total: finalCandidates.docs.length,
    }
  } catch (error: any) {
    console.error('Search error:', error)
    throw new Error(error.message || 'Search failed')
  }
}
