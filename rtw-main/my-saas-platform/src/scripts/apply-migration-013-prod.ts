// Script to apply migration 013 to PRODUCTION database
// Add missing relationship columns to payload_locked_documents_rels
// This fixes the document locking query issue
// IMPORTANT: This script uses DATABASE_URI from environment - NEVER hardcode credentials

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Get production database URI from environment
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function applyMigration013Prod() {
  console.log('\n🚀 Applying migration 013 to PRODUCTION: Add missing locked_documents_rels columns...\n')
  
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
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '013_add_missing_locked_documents_rels.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    
    // Test connection
    await pool.query('SELECT 1')
    console.log('✅ Connected to PRODUCTION database')
    
    // Check if columns exist
    console.log('\n🔍 Checking existing columns...')
    const checkResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_name = 'payload_locked_documents_rels' 
      AND column_name IN ('contact_submissions_id', 'newsletter_subscriptions_id')
    `)
    
    const existingColumns = checkResult.rows.map((r: any) => r.column_name)
    console.log('   Existing columns:', existingColumns.length > 0 ? existingColumns.join(', ') : 'none')
    
    if (!existingColumns.includes('contact_submissions_id')) {
      console.log('   ❌ contact_submissions_id does NOT exist. Will add...')
    } else {
      console.log('   ✅ contact_submissions_id already exists')
    }
    
    if (!existingColumns.includes('newsletter_subscriptions_id')) {
      console.log('   ❌ newsletter_subscriptions_id does NOT exist. Will add...')
    } else {
      console.log('   ✅ newsletter_subscriptions_id already exists')
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
      AND column_name IN ('contact_submissions_id', 'newsletter_subscriptions_id')
      ORDER BY column_name
    `)
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Columns exist:')
      verifyResult.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    } else {
      console.log('⚠️  No columns found (may have been skipped if already exist)')
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

applyMigration013Prod()
  .then(() => {
    console.log('\n🎉 Migration 013 complete!')
    console.log('\n📌 This should fix the document locking query issue in production.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
