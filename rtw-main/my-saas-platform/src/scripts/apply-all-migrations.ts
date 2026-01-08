// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'

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

async function applyMigration(filePath: string) {
  console.log(`\n📄 Applying migration: ${path.basename(filePath)}`)
  
  try {
    const sql = fs.readFileSync(filePath, 'utf-8')
    
    // Execute the entire SQL file as a single query
    // PostgreSQL supports multiple statements in a single query
    await query(sql)
    
    console.log(`   ✅ Successfully applied: ${path.basename(filePath)}`)
    return true
  } catch (error: any) {
    // Check if it's a "already exists" error (which is OK)
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log(`   ⚠️  Migration already applied (or column/extension already exists): ${path.basename(filePath)}`)
      return true
    }
    console.error(`   ❌ Error applying ${path.basename(filePath)}:`, error.message)
    return false
  }
}

async function main() {
  console.log('\n🚀 Applying migrations to local database...\n')
  
  const migrationsDir = path.resolve(process.cwd(), 'supabase', 'migrations')
  const migrations = [
    '002_add_disciplines_localized_names.sql',
    '003_add_plans_localized_titles.sql',
    '004_add_pages_localized_titles.sql',
    '005_add_disciplines_missing_fields.sql',
    '006_add_employers_missing_fields.sql',
  ]
  
  let successCount = 0
  let skipCount = 0
  
  for (const migration of migrations) {
    const filePath = path.join(migrationsDir, migration)
    
    if (!fs.existsSync(filePath)) {
      console.log(`   ⚠️  Migration file not found: ${migration}`)
      continue
    }
    
    const result = await applyMigration(filePath)
    if (result) {
      successCount++
    } else {
      skipCount++
    }
  }
  
  console.log(`\n✅ Migration Summary:`)
  console.log(`   - Successfully applied: ${successCount}`)
  console.log(`   - Skipped/Failed: ${skipCount}`)
  console.log(`   - Total: ${migrations.length}`)
}

main()
  .then(() => {
    closePool()
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    closePool()
    process.exit(1)
  })

