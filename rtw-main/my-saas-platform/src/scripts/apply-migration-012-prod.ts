// Script to apply migration 012 to PRODUCTION database
// Add phone_verifications relationship column to payload_locked_documents_rels
// IMPORTANT: This script uses DATABASE_URI from environment - NEVER hardcode credentials

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Get production database URI from environment
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function applyMigration012Prod() {
  console.log('\n🚀 Applying migration 012 to PRODUCTION: Add phone_verifications relationship...\n')
  
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI not set')
    console.error('   Set it temporarily: $env:DATABASE_URI="your-connection-string"')
    process.exit(1)
  }
  
  // Verify it's production
  if (DATABASE_URI.includes('localhost') || DATABASE_URI.includes('127.0.0.1') || DATABASE_URI.includes('54322')) {
    console.error('❌ ERROR: This looks like a LOCAL database!')
    process.exit(1)
  }
  
  console.log('🔌 Connecting to PRODUCTION database...')
  
  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '012_add_phone_verifications_relationship.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    
    // Test connection
    await pool.query('SELECT 1')
    console.log('✅ Connected to PRODUCTION database')
    
    // Check if column exists
    console.log('\n🔍 Checking if phone_verifications_id column exists...')
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'payload_locked_documents_rels' 
      AND column_name = 'phone_verifications_id'
    `)
    
    if (checkResult.rows.length > 0) {
      console.log('   ✅ Column already exists')
    } else {
      console.log('   ❌ Column does NOT exist. Adding...')
    }
    
    // Apply migration
    console.log('\n📝 Applying migration...')
    await pool.query(sql)
    console.log('✅ Migration applied successfully!')
    
    // Verify
    console.log('\n🔍 Verifying...')
    const verifyResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'payload_locked_documents_rels' 
      AND column_name = 'phone_verifications_id'
    `)
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Column exists:')
      console.log(`   - ${verifyResult.rows[0].column_name} (${verifyResult.rows[0].data_type})`)
    }
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Column may already exist (this is OK)')
    } else {
      console.error('❌ Error:', error.message)
      throw error
    }
  } finally {
    await pool.end()
    console.log('\n✅ Connection closed')
  }
}

applyMigration012Prod()
  .then(() => {
    console.log('\n🎉 Migration 012 complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })



