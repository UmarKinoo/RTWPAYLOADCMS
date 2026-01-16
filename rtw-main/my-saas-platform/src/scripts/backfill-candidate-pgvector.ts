/**
 * Backfill script to migrate candidate JSONB embeddings to pgvector columns
 * 
 * This script:
 * 1. Reads candidates where bio_embedding (JSONB) exists but bio_embedding_vec (vector) is NULL
 * 2. Converts JSON array to pgvector format
 * 3. Updates the bio_embedding_vec column
 * 
 * Usage:
 *   pnpm tsx src/scripts/backfill-candidate-pgvector.ts
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

interface CandidateRow {
  id: string
  bio_embedding: number[] | null
  bio_embedding_vec: string | null
}

/**
 * Convert a JavaScript number array to pgvector literal format
 * Example: [0.1, 0.2, 0.3] -> '[0.1,0.2,0.3]'
 */
function arrayToVectorLiteral(arr: number[]): string {
  return '[' + arr.join(',') + ']'
}

/**
 * Backfill candidates table: migrate bio_embedding (JSONB) to bio_embedding_vec (vector)
 */
async function backfillCandidates() {
  console.log('\n🔄 Starting pgvector backfill for candidates table...\n')

  try {
    // Step 1: Find all candidates with JSONB embeddings but NULL vector columns
    console.log('📊 Checking for candidates that need backfill...')
    
    const checkResult = await query<{
      total_with_embedding: number
      total_with_vector: number
      needs_backfill: number
    }>(`
      SELECT 
        COUNT(*) FILTER (WHERE bio_embedding IS NOT NULL) as total_with_embedding,
        COUNT(*) FILTER (WHERE bio_embedding_vec IS NOT NULL) as total_with_vector,
        COUNT(*) FILTER (WHERE bio_embedding IS NOT NULL AND bio_embedding_vec IS NULL) as needs_backfill
      FROM candidates
    `)

    const stats = checkResult.rows[0]
    console.log(`   📈 Candidates with JSONB embeddings: ${stats.total_with_embedding}`)
    console.log(`   ✅ Candidates with vector embeddings: ${stats.total_with_vector}`)
    console.log(`   🔄 Candidates needing backfill: ${stats.needs_backfill}\n`)

    if (stats.needs_backfill === 0) {
      console.log('✅ All candidates already have vector embeddings. Nothing to do!')
      return
    }

    // Step 2: Fetch candidates that need backfill (in batches)
    const batchSize = 100
    let offset = 0
    let totalProcessed = 0
    let totalUpdated = 0

    while (true) {
      const fetchResult = await query<CandidateRow>(`
        SELECT 
          id,
          bio_embedding::text as bio_embedding,
          bio_embedding_vec::text as bio_embedding_vec
        FROM candidates
        WHERE bio_embedding IS NOT NULL 
          AND bio_embedding_vec IS NULL
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
            // Handle both string and already-parsed array cases
            if (typeof row.bio_embedding === 'string') {
              embedding = JSON.parse(row.bio_embedding || '[]')
            } else if (Array.isArray(row.bio_embedding)) {
              embedding = row.bio_embedding
            } else {
              embedding = []
            }
          } catch (parseError) {
            console.warn(`   ⚠️  Skipping candidate ${row.id}: Invalid JSON in bio_embedding`)
            continue
          }

          // Validate embedding
          if (!Array.isArray(embedding) || embedding.length !== 1536) {
            console.warn(
              `   ⚠️  Skipping candidate ${row.id}: Invalid embedding length (expected 1536, got ${embedding?.length || 0})`
            )
            continue
          }

          // Convert to vector literal and update
          const vectorLiteral = arrayToVectorLiteral(embedding)

          await query(`
            UPDATE candidates
            SET bio_embedding_vec = $1::vector(1536)
            WHERE id = $2
          `, [vectorLiteral, row.id])

          totalUpdated++
        } catch (error) {
          console.error(`   ❌ Error updating candidate ${row.id}:`, error)
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
        COUNT(*) FILTER (WHERE bio_embedding IS NOT NULL) as total_with_embedding,
        COUNT(*) FILTER (WHERE bio_embedding_vec IS NOT NULL) as total_with_vector,
        COUNT(*) FILTER (WHERE bio_embedding IS NOT NULL AND bio_embedding_vec IS NULL) as remaining
      FROM candidates
    `)

    const verify = verifyResult.rows[0]
    console.log(`   📈 Candidates with JSONB embeddings: ${verify.total_with_embedding}`)
    console.log(`   ✅ Candidates with vector embeddings: ${verify.total_with_vector}`)
    console.log(`   🔄 Remaining to backfill: ${verify.remaining}\n`)

    if (verify.remaining > 0) {
      console.log('⚠️  Warning: Some candidates still need backfill. You may need to re-run the script.')
    } else {
      console.log('✅ All candidates successfully migrated to pgvector!\n')
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
    await backfillCandidates()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run if executed directly
main()

