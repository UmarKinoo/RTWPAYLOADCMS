// Script to apply migration 010 to production database
// Add phone_verified column to employers table

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function applyMigration010() {
  console.log('\n🚀 Applying migration 010: Add phone_verified to employers...\n')
  
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI, DATABASE_URL, or PRODUCTION_DATABASE_URI environment variable is not set.')
    console.error('   Set it in your .env file or pass it as an environment variable.')
    process.exit(1)
  }
  
  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: DATABASE_URI.includes('supabase') ? {
      rejectUnauthorized: false, // Required for Supabase
    } : undefined,
  })

  try {
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '010_add_employers_phone_verified.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    console.log('🔌 Connecting to database...')
    
    // Test connection first
    await pool.query('SELECT 1')
    console.log('✅ Connected to database')
    
    // Check current state
    console.log('\n🔍 Checking if phone_verified column exists...')
    const currentState = await pool.query(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'employers' AND column_name = 'phone_verified'
    `)
    
    if (currentState.rows.length > 0) {
      console.log('   ⚠️  Column already exists:')
      console.log(`   - Column: ${currentState.rows[0].column_name}`)
      console.log(`   - Type: ${currentState.rows[0].data_type}`)
      console.log(`   - Nullable: ${currentState.rows[0].is_nullable}`)
      console.log(`   - Default: ${currentState.rows[0].column_default}`)
      console.log('   ✅ Migration may have already been applied.')
    } else {
      console.log('   ⚠️  Column does not exist. Applying migration...')
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
      WHERE table_name = 'employers' AND column_name = 'phone_verified'
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
  }
}

applyMigration010()
  .then(() => {
    console.log('\n🎉 Migration 010 complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })



