// Script to check and add missing columns to employers table
import dotenv from 'dotenv'
import path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function checkEmployersColumns() {
  console.log('\n🔍 Checking employers table columns...\n')
  
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI not set')
    process.exit(1)
  }
  
  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: DATABASE_URI.includes('supabase') ? {
      rejectUnauthorized: false,
    } : undefined,
  })

  try {
    // Get all columns
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'employers'
      ORDER BY column_name
    `)
    
    console.log('📋 Current columns in employers table:')
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
    })
    
    // Check for required columns from the query
    const requiredColumns = [
      'phone_verified',
      'wallet_interview_credits',
      'wallet_contact_unlock_credits',
      'active_plan_id',
      'features_basic_filters',
      'features_nationality_restriction',
    ]
    
    console.log('\n🔍 Checking for required columns...')
    const existingColumns = result.rows.map(r => r.column_name)
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col))
    
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:')
      missingColumns.forEach(col => console.log(`   - ${col}`))
      
      // Add missing columns
      console.log('\n📝 Adding missing columns...')
      for (const col of missingColumns) {
        try {
          if (col === 'phone_verified') {
            await pool.query('ALTER TABLE employers ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT FALSE')
            console.log(`   ✅ Added ${col}`)
          } else if (col === 'wallet_interview_credits') {
            await pool.query('ALTER TABLE employers ADD COLUMN IF NOT EXISTS wallet_interview_credits integer DEFAULT 0')
            console.log(`   ✅ Added ${col}`)
          } else if (col === 'wallet_contact_unlock_credits') {
            await pool.query('ALTER TABLE employers ADD COLUMN IF NOT EXISTS wallet_contact_unlock_credits integer DEFAULT 0')
            console.log(`   ✅ Added ${col}`)
          } else if (col === 'active_plan_id') {
            await pool.query('ALTER TABLE employers ADD COLUMN IF NOT EXISTS active_plan_id integer')
            console.log(`   ✅ Added ${col}`)
          } else if (col === 'features_basic_filters') {
            await pool.query('ALTER TABLE employers ADD COLUMN IF NOT EXISTS features_basic_filters boolean DEFAULT FALSE')
            console.log(`   ✅ Added ${col}`)
          } else if (col === 'features_nationality_restriction') {
            await pool.query('ALTER TABLE employers ADD COLUMN IF NOT EXISTS features_nationality_restriction text DEFAULT \'NONE\'')
            console.log(`   ✅ Added ${col}`)
          }
        } catch (error: any) {
          if (error.message?.includes('already exists')) {
            console.log(`   ⚠️  ${col} already exists`)
          } else {
            console.error(`   ❌ Error adding ${col}:`, error.message)
          }
        }
      }
    } else {
      console.log('✅ All required columns exist!')
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

checkEmployersColumns()
  .then(() => {
    console.log('\n🎉 Check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
