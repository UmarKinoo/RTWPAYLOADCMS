// Script to apply migration 007 to production database
// Disable SSL certificate verification for Supabase (they use self-signed certs)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

import { Pool } from 'pg'
import fs from 'fs'
import path from 'path'

// Production database connection string - MUST be set via environment variable
// NEVER hardcode production credentials in source code
// Set PROD_DATABASE_URI in your .env file or pass it as an environment variable
import dotenv from 'dotenv'
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const PROD_DB_URI = process.env.PROD_DATABASE_URI || process.env.PRODUCTION_DATABASE_URI

async function applyMigrationToProd() {
  console.log('\n🚀 Applying migration 007 to production database...\n')
  
  if (!PROD_DB_URI) {
    console.error('❌ PROD_DATABASE_URI or PRODUCTION_DATABASE_URI environment variable is not set.')
    console.error('   Set it in your .env file or pass it as an environment variable.')
    console.error('   NEVER commit production database credentials to version control!')
    process.exit(1)
  }
  
  // Use pooler connection (Supabase pooler supports DDL operations)
  const pool = new Pool({
    connectionString: PROD_DB_URI,
    ssl: {
      rejectUnauthorized: false, // Required for Supabase self-signed certificates
    },
  })

  try {
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '007_add_candidates_password_reset_fields.sql')
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    console.log('🔌 Connecting to production database...')
    
    // Test connection first
    await pool.query('SELECT 1')
    console.log('✅ Connected to production database')
    
    // Apply migration
    console.log('📝 Applying migration...')
    await pool.query(sql)
    
    console.log('✅ Migration applied successfully!')
    
    // Verify the columns exist
    console.log('\n🔍 Verifying columns...')
    const verifyResult = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'candidates' 
        AND (column_name = 'password_reset_token' OR column_name = 'password_reset_expires')
      ORDER BY column_name
    `)
    
    if (verifyResult.rows.length === 2) {
      console.log('✅ Verification successful:')
      verifyResult.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    } else {
      console.log('⚠️  Warning: Expected 2 columns, found', verifyResult.rows.length)
      verifyResult.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    }
    
  } catch (error: any) {
    // Check if it's a "already exists" error (which is OK)
    if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
      console.log('⚠️  Columns may already exist (this is OK)')
      console.log('   Error message:', error.message)
    } else {
      console.error('❌ Error applying migration:', error.message)
      throw error
    }
  } finally {
    await pool.end()
    console.log('\n✅ Connection closed')
  }
}

applyMigrationToProd()
  .then(() => {
    console.log('\n🎉 Migration complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })

