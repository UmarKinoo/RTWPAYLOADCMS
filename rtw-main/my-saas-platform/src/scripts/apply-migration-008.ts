// Script to apply migration 008 to production database
// Make employers.phone optional (nullable)

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function applyMigration008() {
  console.log('\n🚀 Applying migration 008: Make employers.phone optional...\n')
  
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
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '008_make_employers_phone_optional.sql')
    
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
    console.log('\n🔍 Checking current state of employers.phone column...')
    const currentState = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'employers' AND column_name = 'phone'
    `)
    
    if (currentState.rows.length === 0) {
      console.error('❌ Column "phone" not found in employers table')
      process.exit(1)
    }
    
    const currentNullable = currentState.rows[0].is_nullable
    console.log(`   Current state: is_nullable = ${currentNullable}`)
    
    if (currentNullable === 'YES') {
      console.log('   ✅ Column is already nullable. Migration may have already been applied.')
    } else {
      console.log('   ⚠️  Column is NOT NULL. Applying migration...')
    }
    
    // Apply migration
    console.log('\n📝 Applying migration...')
    await pool.query(sql)
    console.log('✅ Migration applied successfully!')
    
    // Verify the change
    console.log('\n🔍 Verifying change...')
    const verifyResult = await pool.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'employers' AND column_name = 'phone'
    `)
    
    if (verifyResult.rows[0].is_nullable === 'YES') {
      console.log('✅ Verification successful:')
      console.log(`   - Column: ${verifyResult.rows[0].column_name}`)
      console.log(`   - Type: ${verifyResult.rows[0].data_type}`)
      console.log(`   - Nullable: ${verifyResult.rows[0].is_nullable}`)
    } else {
      console.log('⚠️  Warning: Column is still NOT NULL')
    }
    
  } catch (error: any) {
    // Check if it's a "column does not exist" or similar error
    if (error.message?.includes('does not exist')) {
      console.error('❌ Error: Column or table does not exist')
      console.error('   Error message:', error.message)
    } else if (error.message?.includes('already')) {
      console.log('⚠️  Migration may have already been applied')
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

applyMigration008()
  .then(() => {
    console.log('\n🎉 Migration 008 complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Migration failed:', error)
    process.exit(1)
  })



