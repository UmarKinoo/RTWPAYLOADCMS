/**
 * Backfill script to migrate JSONB embeddings to pgvector columns
 * 
 * This script:
 * 1. Reads skills where name_embedding (JSONB) exists but name_embedding_vec (vector) is NULL
 * 2. Converts JSON array to pgvector format
 * 3. Updates the name_embedding_vec column
 * 
 * Usage:
 *   pnpm tsx src/scripts/backfill-pgvector.ts
 * 
 * The script is idempotent and safe to re-run.
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

// Verify DATABASE_URI is loaded
if (!process.env.DATABASE_URI && !process.env.DATABASE_URL) {
  console.error('❌ Error: DATABASE_URI or DATABASE_URL is not set')
  console.error(`   Checked .env file at: ${envPath}`)
  process.exit(1)
}

import { query, closePool } from '../lib/db.js'

interface SkillRow {
  id: string
  name_embedding: number[] | null
  name_embedding_vec: string | null
}

/**
 * Convert a JavaScript number array to pgvector literal format
 * Example: [0.1, 0.2, 0.3] -> '[0.1,0.2,0.3]'
 */
function arrayToVectorLiteral(arr: number[]): string {
  return '[' + arr.join(',') + ']'
}

/**
 * Backfill skills table: migrate name_embedding (JSONB) to name_embedding_vec (vector)
 */
async function backfillSkills() {
  console.log('\n🔄 Starting pgvector backfill for skills table...\n')

  try {
    // Step 1: Find all skills with JSONB embeddings but NULL vector columns
    console.log('📊 Checking for skills that need backfill...')
    
    const checkResult = await query<{
      total_with_embedding: number
      total_with_vector: number
      needs_backfill: number
    }>(`
      SELECT 
        COUNT(*) FILTER (WHERE name_embedding IS NOT NULL) as total_with_embedding,
        COUNT(*) FILTER (WHERE name_embedding_vec IS NOT NULL) as total_with_vector,
        COUNT(*) FILTER (WHERE name_embedding IS NOT NULL AND name_embedding_vec IS NULL) as needs_backfill
      FROM skills
    `)

    const stats = checkResult.rows[0]
    console.log(`   📈 Skills with JSONB embeddings: ${stats.total_with_embedding}`)
    console.log(`   ✅ Skills with vector embeddings: ${stats.total_with_vector}`)
    console.log(`   🔄 Skills needing backfill: ${stats.needs_backfill}\n`)

    if (stats.needs_backfill === 0) {
      console.log('✅ All skills already have vector embeddings. Nothing to do!')
      return
    }

    // Step 2: Fetch skills that need backfill (in batches)
    const batchSize = 100
    let offset = 0
    let totalProcessed = 0
    let totalUpdated = 0

    while (true) {
      const fetchResult = await query<SkillRow>(`
        SELECT 
          id,
          name_embedding::text as name_embedding,
          name_embedding_vec::text as name_embedding_vec
        FROM skills
        WHERE name_embedding IS NOT NULL 
          AND name_embedding_vec IS NULL
        ORDER BY id
        LIMIT $1 OFFSET $2
      `, [batchSize, offset])

      const rows = fetchResult.rows

      if (rows.length === 0) {
        break // No more rows to process
      }

      console.log(`   🔄 Processing batch: ${offset + 1} to ${offset + rows.length}...`)

      // Step 3: Update each row
      for (const row of rows) {
        try {
          // Parse JSONB embedding (stored as text in query result)
          let embedding: number[]
          try {
            embedding = JSON.parse(row.name_embedding || '[]')
          } catch (parseError) {
            console.warn(`   ⚠️  Skipping skill ${row.id}: Invalid JSON in name_embedding`)
            continue
          }

          // Validate embedding
          if (!Array.isArray(embedding) || embedding.length !== 1536) {
            console.warn(
              `   ⚠️  Skipping skill ${row.id}: Invalid embedding length (expected 1536, got ${embedding.length})`
            )
            continue
          }

          // Convert to vector literal and update
          const vectorLiteral = arrayToVectorLiteral(embedding)

          await query(`
            UPDATE skills
            SET name_embedding_vec = $1::vector(1536)
            WHERE id = $2
          `, [vectorLiteral, row.id])

          totalUpdated++
        } catch (error) {
          console.error(`   ❌ Error updating skill ${row.id}:`, error)
          // Continue with next row
        }
      }

      totalProcessed += rows.length
      offset += batchSize

      // If we got fewer rows than batch size, we're done
      if (rows.length < batchSize) {
        break
      }
    }

    console.log(`\n✅ Backfill complete!`)
    console.log(`   📊 Total processed: ${totalProcessed}`)
    console.log(`   ✅ Total updated: ${totalUpdated}`)
    console.log(`   ⚠️  Skipped: ${totalProcessed - totalUpdated}\n`)

    // Step 4: Verify results
    console.log('🔍 Verifying results...')
    const verifyResult = await query<{
      total_with_embedding: number
      total_with_vector: number
      remaining: number
    }>(`
      SELECT 
        COUNT(*) FILTER (WHERE name_embedding IS NOT NULL) as total_with_embedding,
        COUNT(*) FILTER (WHERE name_embedding_vec IS NOT NULL) as total_with_vector,
        COUNT(*) FILTER (WHERE name_embedding IS NOT NULL AND name_embedding_vec IS NULL) as remaining
      FROM skills
    `)

    const verify = verifyResult.rows[0]
    console.log(`   📈 Skills with JSONB embeddings: ${verify.total_with_embedding}`)
    console.log(`   ✅ Skills with vector embeddings: ${verify.total_with_vector}`)
    console.log(`   🔄 Remaining to backfill: ${verify.remaining}\n`)

    if (verify.remaining > 0) {
      console.log('⚠️  Warning: Some skills still need backfill. You may need to re-run the script.')
    } else {
      console.log('✅ All skills successfully migrated to pgvector!\n')
    }
  } catch (error) {
    console.error('❌ Backfill failed:', error)
    throw error
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await backfillSkills()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run if executed directly
main()

