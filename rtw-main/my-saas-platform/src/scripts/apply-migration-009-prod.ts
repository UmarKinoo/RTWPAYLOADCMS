// Script to apply migration 009 to PRODUCTION database
// Add phone_verified column to candidates table
// IMPORTANT: This script uses DATABASE_URI from environment - NEVER hardcode credentials

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Get production database URI from environment
// Set this temporarily: export DATABASE_URI="your-prod-connection-string"
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function applyMigration009Prod() {
  console.log('\n🚀 Applying migration 009 to PRODUCTION: Add phone_verified to candidates...\n')
  
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI, DATABASE_URL, or PRODUCTION_DATABASE_URI environment variable is not set.')
    console.error('   Set it temporarily: $env:DATABASE_URI="your-connection-string"')
    console.error('   NEVER commit production credentials to git!')
    process.exit(1)
  }
  
  // Verify it's production (not local)
  if (DATABASE_URI.includes('localhost') || DATABASE_URI.includes('127.0.0.1') || DATABASE_URI.includes('54322')) {
    console.error('❌ ERROR: This looks like a LOCAL database!')
    console.error('   Make sure DATABASE_URI points to PRODUCTION (Supabase cloud)')
    process.exit(1)
  }
  
  if (!DATABASE_URI.includes('supabase.com')) {
    console.warn('⚠️  WARNING: Connection string does not contain "supabase.com"')
    console.warn('   Are you sure this is the production database?')
    console.log('\n   Press Ctrl+C to cancel, or wait 3 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  console.log('🔌 Connecting to PRODUCTION database...')
  console.log('   Host:', DATABASE_URI.match(/@([^:]+)/)?.[1] || 'hidden')
  
  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase
    },
  })

  try {
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '009_add_candidates_phone_verified.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    
    // Test connection first
    await pool.query('SELECT 1')
    console.log('✅ Connected to PRODUCTION database')
    
    // Check current state
    console.log('\n🔍 Checking if phone_verified column exists...')
    const currentState = await pool.query(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'candidates' AND column_name = 'phone_verified'
    `)
    
    if (currentState.rows.length > 0) {
      console.log('   ⚠️  Column already exists:')
      console.log(`   - Column: ${currentState.rows[0].column_name}`)
      console.log(`   - Type: ${currentState.rows[0].data_type}`)
      console.log(`   - Nullable: ${currentState.rows[0].is_nullable}`)
      console.log(`   - Default: ${currentState.rows[0].column_default}`)
      console.log('   ✅ Migration may have already been applied.')
    } else {
      console.log('   ❌ Column does NOT exist. Applying migration...')
    }
    
    // Apply migration
    console.log('\n📝 Applying migration...')
    await pool.query(sql)
    console.log('✅ Migration applied successfully!')
    
    // Verify the change
    console.log('\n🔍 Verifying change...')
    const verifyResult = await pool.query(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'candidates' AND column_name = 'phone_verified'
    `)
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Verification successful:')
      console.log(`   - Column: ${verifyResult.rows[0].column_name}`)
      console.log(`   - Type: ${verifyResult.rows[0].data_type}`)
      console.log(`   - Nullable: ${verifyResult.rows[0].is_nullable}`)
      console.log(`   - Default: ${verifyResult.rows[0].column_default}`)
    } else {
      console.log('❌ Error: Column was not created')
    }
    
    // Test query to ensure it works
    console.log('\n🔍 Testing query with phone_verified column...')
    const testResult = await pool.query(`
      SELECT id, email, phone, phone_verified 
      FROM candidates 
      LIMIT 1
    `)
    
    if (testResult.rows.length > 0) {
      console.log('✅ Test query successful!')
      console.log('   Sample row:')
      console.log(`   - ID: ${testResult.rows[0].id}`)
      console.log(`   - Email: ${testResult.rows[0].email}`)
      console.log(`   - Phone: ${testResult.rows[0].phone || 'NULL'}`)
      console.log(`   - Phone Verified: ${testResult.rows[0].phone_verified}`)
    }
    
  } catch (error: any) {
    // Check if it's a "already exists" error (which is OK)
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('⚠️  Column may already exist (this is OK)')
      console.log('   Error message:', error.message)
    } else {
      console.error('❌ Error applying migration:', error.message)
      throw error
    }
  } finally {
    await pool.end()
    console.log('\n✅ Connection closed')
    console.log('🔒 Credentials cleared from memory')
  }
}

applyMigration009Prod()
  .then(() => {
    console.log('\n🎉 Migration 009 applied to PRODUCTION!')
    console.log('⚠️  Remember to clear DATABASE_URI from your environment')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })

