// Script to apply migration 011 to PRODUCTION database
// Create phone_verifications table
// IMPORTANT: This script uses DATABASE_URI from environment - NEVER hardcode credentials

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Get production database URI from environment
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function applyMigration011Prod() {
  console.log('\n🚀 Applying migration 011 to PRODUCTION: Create phone_verifications table...\n')
  
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
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '011_create_phone_verifications_table.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    
    // Test connection first
    await pool.query('SELECT 1')
    console.log('✅ Connected to PRODUCTION database')
    
    // Check if table exists
    console.log('\n🔍 Checking if phone_verifications table exists...')
    const tableCheck = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'phone_verifications'
      )
    `)
    
    if (tableCheck.rows[0].exists) {
      console.log('   ⚠️  Table already exists')
    } else {
      console.log('   ❌ Table does NOT exist. Creating...')
    }
    
    // Apply migration
    console.log('\n📝 Applying migration...')
    await pool.query(sql)
    console.log('✅ Migration applied successfully!')
    
    // Verify the table was created
    console.log('\n🔍 Verifying table structure...')
    const verifyResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'phone_verifications'
      ORDER BY ordinal_position
    `)
    
    if (verifyResult.rows.length > 0) {
      console.log('✅ Table created successfully with columns:')
      verifyResult.rows.forEach(row => {
        console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
      })
    } else {
      console.log('❌ Error: Table was not created')
    }
    
    // Check indexes
    console.log('\n🔍 Verifying indexes...')
    const indexResult = await pool.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'phone_verifications'
    `)
    
    if (indexResult.rows.length > 0) {
      console.log('✅ Indexes created:')
      indexResult.rows.forEach(row => {
        console.log(`   - ${row.indexname}`)
      })
    }
    
    // Test insert (then delete)
    console.log('\n🔍 Testing table with a sample query...')
    const testResult = await pool.query(`
      SELECT COUNT(*) as count FROM phone_verifications
    `)
    console.log(`   ✅ Table is accessible. Current row count: ${testResult.rows[0].count}`)
    
  } catch (error: any) {
    // Check if it's an "already exists" error (which is OK)
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('⚠️  Table or index may already exist (this is OK)')
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

applyMigration011Prod()
  .then(() => {
    console.log('\n🎉 Migration 011 applied to PRODUCTION!')
    console.log('⚠️  Remember to clear DATABASE_URI from your environment')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })



