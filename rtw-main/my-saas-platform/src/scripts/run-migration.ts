/**
 * Run SQL migration script
 * 
 * Usage:
 *   pnpm tsx src/scripts/run-migration.ts <migration-file>
 * 
 * Example:
 *   pnpm tsx src/scripts/run-migration.ts supabase/migrations/001_enable_pgvector.sql
 */

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

/**
 * Read SQL file content
 */
function readSQLFile(filePath: string): string {
  const fullPath = path.resolve(process.cwd(), filePath)
  
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Migration file not found: ${fullPath}`)
  }

  return fs.readFileSync(fullPath, 'utf-8')
}

/**
 * Execute migration SQL file
 */
async function runMigration(migrationFile: string) {
  console.log(`\n🔄 Running migration: ${migrationFile}\n`)

  try {
    // Read SQL file
    const sqlContent = readSQLFile(migrationFile)
    console.log(`📄 Read migration file (${sqlContent.length} characters)\n`)

    // Execute the entire SQL file
    // PostgreSQL supports multiple statements separated by semicolons
    console.log('   Executing migration SQL...')
    
    try {
      await query(sqlContent)
      console.log(`   ✅ Migration executed successfully`)
    } catch (error: any) {
      // Some errors are expected (e.g., IF NOT EXISTS)
      if (error.code === '42710' || error.code === '42P07') {
        // Object already exists (expected with IF NOT EXISTS)
        console.log(`   ⚠️  Some objects already exist (this is expected with IF NOT EXISTS)`)
      } else {
        console.error(`   ❌ Migration failed:`, error.message)
        throw error
      }
    }

    console.log(`\n✅ Migration completed successfully!\n`)

    // Verify pgvector extension
    console.log('🔍 Verifying pgvector extension...')
    const extResult = await query<{ extname: string }>(`
      SELECT extname FROM pg_extension WHERE extname = 'vector'
    `)
    
    if (extResult.rows.length > 0) {
      console.log('   ✅ pgvector extension is installed')
    } else {
      console.log('   ⚠️  pgvector extension not found (may need manual installation)')
    }

    // Verify columns exist
    console.log('\n🔍 Verifying columns...')
    const colResult = await query<{ column_name: string; data_type: string }>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'skills' 
        AND column_name LIKE '%embedding%'
      ORDER BY column_name
    `)
    
    console.log(`   Found ${colResult.rows.length} embedding columns:`)
    colResult.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`)
    })

  } catch (error) {
    console.error('❌ Migration failed:', error)
    throw error
  }
}

/**
 * Main execution
 */
async function main() {
  const migrationFile = process.argv[2]

  if (!migrationFile) {
    console.error('❌ Error: Migration file path is required')
    console.error('   Usage: pnpm tsx src/scripts/run-migration.ts <migration-file>')
    console.error('   Example: pnpm tsx src/scripts/run-migration.ts supabase/migrations/001_enable_pgvector.sql')
    process.exit(1)
  }

  try {
    await runMigration(migrationFile)
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

// Run if executed directly
main()

