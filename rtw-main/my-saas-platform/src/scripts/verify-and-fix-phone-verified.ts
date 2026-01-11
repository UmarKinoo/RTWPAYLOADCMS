// Script to verify and add phone_verified column to employers in production
import dotenv from 'dotenv'
import path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function verifyAndFix() {
  console.log('\n🔍 Verifying phone_verified column in employers table...\n')
  
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI not set')
    console.error('   Make sure you have DATABASE_URI set to your PRODUCTION database')
    process.exit(1)
  }
  
  // Warn if it looks like local database
  if (DATABASE_URI.includes('localhost') || DATABASE_URI.includes('127.0.0.1') || DATABASE_URI.includes('54322')) {
    console.warn('⚠️  WARNING: This looks like a LOCAL database connection!')
    console.warn('   Make sure DATABASE_URI points to PRODUCTION (Supabase cloud)')
    console.warn('   Current URI starts with:', DATABASE_URI.substring(0, 50) + '...')
    console.log('\n   Press Ctrl+C to cancel, or wait 5 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  
  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: DATABASE_URI.includes('supabase') ? {
      rejectUnauthorized: false,
    } : undefined,
  })

  try {
    // Check if column exists
    const checkResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'employers' AND column_name = 'phone_verified'
    `)
    
    if (checkResult.rows.length === 0) {
      console.log('❌ phone_verified column does NOT exist')
      console.log('📝 Adding phone_verified column...')
      
      await pool.query(`
        ALTER TABLE employers 
        ADD COLUMN phone_verified boolean DEFAULT FALSE
      `)
      
      console.log('✅ Column added successfully!')
      
      // Update existing rows
      console.log('📝 Updating existing rows...')
      const updateResult = await pool.query(`
        UPDATE employers 
        SET phone_verified = FALSE 
        WHERE phone_verified IS NULL
      `)
      console.log(`   ✅ Updated ${updateResult.rowCount} rows`)
      
    } else {
      console.log('✅ phone_verified column exists:')
      console.log(`   - Type: ${checkResult.rows[0].data_type}`)
      console.log(`   - Nullable: ${checkResult.rows[0].is_nullable}`)
      console.log(`   - Default: ${checkResult.rows[0].column_default}`)
    }
    
    // Verify by selecting a row
    console.log('\n🔍 Verifying with a test query...')
    const testResult = await pool.query(`
      SELECT id, email, phone, phone_verified 
      FROM employers 
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
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

verifyAndFix()
  .then(() => {
    console.log('\n🎉 Verification complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })



