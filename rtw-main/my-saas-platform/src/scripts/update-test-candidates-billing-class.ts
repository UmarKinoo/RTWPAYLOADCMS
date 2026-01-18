/**
 * Script to update existing test candidates with correct billing class from their primary skill
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

import { query as dbQuery, closePool } from '@/lib/db'

async function updateBillingClasses() {
  console.log('🔄 Updating billing classes for test candidates...\n')

  try {
    // Get all test candidates (those with test.*@test.com emails)
    const candidates = await dbQuery<{
      id: string
      email: string
      first_name: string
      last_name: string
      primary_skill_id: number | null
      billing_class: string | null
    }>(`
      SELECT id, email, first_name, last_name, primary_skill_id, billing_class
      FROM candidates
      WHERE email LIKE 'test.%@test.com'
      ORDER BY email
    `)

    console.log(`Found ${candidates.rows.length} test candidates to update\n`)

    let updated = 0
    let skipped = 0
    let errors = 0

    for (const candidate of candidates.rows) {
      try {
        if (!candidate.primary_skill_id) {
          console.log(`⏭️  Skipping ${candidate.email} - no primary skill`)
          skipped++
          continue
        }

        // Get billing class from skill
        const skillResult = await dbQuery<{ billing_class: string }>(`
          SELECT billing_class
          FROM skills
          WHERE id = $1
        `, [candidate.primary_skill_id])

        if (skillResult.rows.length === 0) {
          console.log(`❌ Skipping ${candidate.email} - skill not found`)
          errors++
          continue
        }

        const billingClass = skillResult.rows[0].billing_class

        // Update candidate if billing class is different
        if (candidate.billing_class !== billingClass) {
          await dbQuery(`
            UPDATE candidates
            SET billing_class = $1, updated_at = NOW()
            WHERE id = $2
          `, [billingClass, candidate.id])

          console.log(`✅ Updated ${candidate.first_name} ${candidate.last_name} (${candidate.email})`)
          console.log(`   Class: ${candidate.billing_class || 'NULL'} → ${billingClass}`)
          updated++
        } else {
          console.log(`✓ ${candidate.email} already has correct billing class: ${billingClass}`)
          skipped++
        }
      } catch (error: any) {
        console.error(`❌ Error updating ${candidate.email}:`, error.message)
        errors++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Updated: ${updated}`)
    console.log(`   ⏭️  Skipped: ${skipped}`)
    console.log(`   ❌ Errors: ${errors}`)
    console.log(`\n✅ Billing class update complete!`)

    await closePool()
  } catch (error) {
    console.error('Fatal error:', error)
    await closePool()
    process.exit(1)
  }
}

updateBillingClasses()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('Fatal error:', error)
    process.exit(1)
  })
