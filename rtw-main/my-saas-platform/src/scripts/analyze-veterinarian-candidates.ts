/**
 * Diagnostic script to analyze Veterinarian candidates and understand
 * why they appear when searching "fix pipes"
 */

// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables from .env file in project root
const envPath = path.resolve(process.cwd(), '.env')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env file:', result.error.message)
} else {
  console.log('✅ Environment variables loaded from:', envPath)
}

import { query as dbQuery } from '@/lib/db'

async function analyzeVeterinarianCandidates() {
  console.log('🔍 Analyzing Veterinarian candidates...\n')

  try {

    // Step 1: Find all skills with "Veterinarian" in the name
    console.log('Step 1: Finding Veterinarian skills...')
    const veterinarianSkillsResult = await dbQuery<{ id: string; name: string }>(`
      SELECT id, name
      FROM skills
      WHERE name ILIKE '%Veterinarian%'
      ORDER BY name
      LIMIT 100
    `)

    console.log(`Found ${veterinarianSkillsResult.rows.length} Veterinarian skills:`)
    veterinarianSkillsResult.rows.forEach((skill) => {
      console.log(`  - ID: ${skill.id}, Name: ${skill.name}`)
    })
    console.log()

    // Step 2: Find all candidates with Veterinarian as primarySkill OR jobTitle
    console.log('Step 2: Finding candidates with Veterinarian primarySkill OR jobTitle...')
    const veterinarianSkillIds: number[] = veterinarianSkillsResult.rows.map((s) => parseInt(s.id, 10))

    // Also search by jobTitle in case some have Veterinarian in jobTitle but different primarySkill
    const allCandidatesResult = await dbQuery<{
      id: string
      first_name: string
      last_name: string
      email: string
      job_title: string | null
      primary_skill_id: number | null
      location: string | null
      experience_years: number | null
      nationality: string | null
      languages: string | null
      current_employer: string | null
      billing_class: string | null
    }>(`
      SELECT 
        c.id,
        c.first_name,
        c.last_name,
        c.email,
        c.job_title,
        c.primary_skill_id,
        c.location,
        c.experience_years,
        c.nationality,
        c.languages,
        c.current_employer,
        c.billing_class
      FROM candidates c
      WHERE c.terms_accepted = true
        AND (
          c.primary_skill_id IN (${veterinarianSkillIds.map((_, i) => `$${i + 1}`).join(',')})
          OR c.job_title ILIKE '%Veterinarian%'
          OR c.job_title ILIKE '%Vetenarian%'
        )
      ORDER BY c.id
      LIMIT 200
    `, veterinarianSkillIds)

    if (allCandidatesResult.rows.length > 0) {
      const candidatesResult = allCandidatesResult

      console.log(`Found ${candidatesResult.rows.length} candidates with Veterinarian primarySkill OR jobTitle:\n`)

      // Check for the specific email
      const specificCandidate = candidatesResult.rows.find(c => 
        c.email.toLowerCase() === 'candidatetestuploadcv@live.com'
      )

      if (specificCandidate) {
        console.log('🔍 FOUND TARGET CANDIDATE: candidatetestuploadcv@live.com')
        console.log('=' .repeat(60))
        const skill = veterinarianSkillsResult.rows.find(s => s.id === String(specificCandidate.primary_skill_id))
        const primarySkillName = skill?.name || 'Unknown'
        console.log(`  ID: ${specificCandidate.id}`)
        console.log(`  Name: ${specificCandidate.first_name} ${specificCandidate.last_name}`)
        console.log(`  Email: ${specificCandidate.email}`)
        console.log(`  Job Title: ${specificCandidate.job_title || 'N/A'}`)
        console.log(`  Primary Skill ID: ${specificCandidate.primary_skill_id}`)
        console.log(`  Primary Skill Name: ${primarySkillName}`)
        console.log(`  Location: ${specificCandidate.location || 'N/A'}`)
        console.log(`  Experience: ${specificCandidate.experience_years || 0} years`)
        console.log(`  Nationality: ${specificCandidate.nationality || 'N/A'}`)
        console.log(`  Languages: ${specificCandidate.languages || 'N/A'}`)
        console.log(`  Current Employer: ${specificCandidate.current_employer || 'N/A'}`)
        console.log(`  Billing Class: ${specificCandidate.billing_class || 'N/A'}`)
        console.log('=' .repeat(60))
        console.log()
      }

      for (const candidate of candidatesResult.rows) {
        const skill = veterinarianSkillsResult.rows.find(s => s.id === String(candidate.primary_skill_id))
        const primarySkillName = skill?.name || 'Unknown'
        const isVetBySkill = candidate.primary_skill_id && veterinarianSkillIds.includes(candidate.primary_skill_id)
        const isVetByJobTitle = candidate.job_title && (
          candidate.job_title.toLowerCase().includes('veterinarian') || 
          candidate.job_title.toLowerCase().includes('vetenarian')
        )

        console.log(`Candidate ID: ${candidate.id}`)
        console.log(`  Name: ${candidate.first_name} ${candidate.last_name}`)
        console.log(`  Email: ${candidate.email}`)
        console.log(`  Job Title: ${candidate.job_title || 'N/A'}`)
        console.log(`  Primary Skill: ${primarySkillName} (ID: ${candidate.primary_skill_id || 'N/A'})`)
        console.log(`  Match Reason: ${isVetBySkill ? 'Primary Skill' : ''}${isVetBySkill && isVetByJobTitle ? ' + ' : ''}${isVetByJobTitle ? 'Job Title' : ''}`)
        console.log(`  Location: ${candidate.location || 'N/A'}`)
        console.log(`  Experience: ${candidate.experience_years || 0} years`)
        console.log(`  Nationality: ${candidate.nationality || 'N/A'}`)
        console.log(`  Languages: ${candidate.languages || 'N/A'}`)
        console.log(`  Current Employer: ${candidate.current_employer || 'N/A'}`)
        console.log(`  Billing Class: ${candidate.billing_class || 'N/A'}`)
        console.log()
      }

      // Step 3: Check vector distance for "fix pipes" query
      console.log('Step 3: Checking vector distance for "fix pipes" query...\n')
      const searchQuery = 'fix pipes'
      const openaiKey = process.env.OPENAI_API_KEY

      if (openaiKey) {
        // Generate embedding for "fix pipes"
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
          const vectorLiteral = '[' + queryEmbedding.join(',') + ']'

          // Check distance for each Veterinarian skill
          for (const skill of veterinarianSkillsResult.rows) {
            const distanceResult = await dbQuery<{ distance: number }>(`
              SELECT name_embedding_vec <=> $1::vector(1536) as distance
              FROM skills
              WHERE id = $2
                AND name_embedding_vec IS NOT NULL
            `, [vectorLiteral, skill.id])

            if (distanceResult.rows.length > 0) {
              const distance = parseFloat(String(distanceResult.rows[0].distance))
              console.log(`  Skill: "${skill.name}" (ID: ${skill.id})`)
              console.log(`    Distance from "fix pipes": ${distance.toFixed(4)}`)
              console.log(`    Passes < 0.7 filter: ${distance < 0.7}`)
              console.log()
            }
          }

          // Check the specific candidate's primarySkill distance
          if (specificCandidate && specificCandidate.primary_skill_id) {
            const specificSkillDistance = await dbQuery<{ distance: number; name: string }>(`
              SELECT 
                s.name_embedding_vec <=> $1::vector(1536) as distance,
                s.name
              FROM skills s
              WHERE s.id = $2
                AND s.name_embedding_vec IS NOT NULL
            `, [vectorLiteral, specificCandidate.primary_skill_id])

            if (specificSkillDistance.rows.length > 0) {
              const distance = parseFloat(String(specificSkillDistance.rows[0].distance))
              console.log(`\n🎯 TARGET CANDIDATE'S PRIMARY SKILL ANALYSIS:`)
              console.log(`  Skill: "${specificSkillDistance.rows[0].name}" (ID: ${specificCandidate.primary_skill_id})`)
              console.log(`  Distance from "fix pipes": ${distance.toFixed(4)}`)
              console.log(`  Passes < 0.7 filter: ${distance < 0.7}`)
              console.log(`  ⚠️  This candidate would ${distance < 0.7 ? 'BE INCLUDED' : 'BE FILTERED OUT'} in search results`)
              console.log()
            }
          }

          // Check if any Veterinarian skill is in top results
          const topSkillsResult = await dbQuery<{ id: string; name: string; distance: number }>(`
            SELECT 
              s.id,
              s.name,
              s.name_embedding_vec <=> $1::vector(1536) as distance
            FROM skills s
            WHERE s.name_embedding_vec IS NOT NULL
            ORDER BY s.name_embedding_vec <=> $1::vector(1536)
            LIMIT 50
          `, [vectorLiteral])

          const veterinarianInTop = topSkillsResult.rows.filter((row) =>
            row.name.toLowerCase().includes('veterinarian')
          )

          if (veterinarianInTop.length > 0) {
            console.log('⚠️  WARNING: Veterinarian skills found in top 50 results for "fix pipes":')
            veterinarianInTop.forEach((row) => {
              console.log(`  - "${row.name}" (ID: ${row.id}): distance = ${parseFloat(String(row.distance)).toFixed(4)}`)
            })
          } else {
            console.log('✅ No Veterinarian skills in top 50 results for "fix pipes"')
          }
        }
      }

      // Step 4: Check if keyword search might match
      console.log('\nStep 4: Checking if keyword search might match...')
      const keywordMatches = candidatesResult.rows.filter((c) => {
        const jobTitle = (c.job_title || '').toLowerCase()
        const firstName = (c.first_name || '').toLowerCase()
        const lastName = (c.last_name || '').toLowerCase()
        const searchLower = 'fix pipes'.toLowerCase()

        return (
          jobTitle.includes('fix') ||
          jobTitle.includes('pipes') ||
          jobTitle.includes('pipe') ||
          firstName.includes('fix') ||
          firstName.includes('pipes') ||
          lastName.includes('fix') ||
          lastName.includes('pipes')
        )
      })

      if (keywordMatches.length > 0) {
        console.log(`⚠️  WARNING: ${keywordMatches.length} Veterinarian candidates might match keyword search:`)
        keywordMatches.forEach((c) => {
          console.log(`  - ${c.first_name} ${c.last_name} (ID: ${c.id})`)
          console.log(`    Job Title: ${c.job_title || 'N/A'}`)
        })
      } else {
        console.log('✅ No keyword matches found')
      }
    }
  } catch (error) {
    console.error('Error analyzing Veterinarian candidates:', error)
  }
}

// Run the analysis
analyzeVeterinarianCandidates()
  .then(() => {
    console.log('\n✅ Analysis complete')
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
