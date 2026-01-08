// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'

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

async function checkEmployersColumns() {
  console.log('\n🔍 Checking employers table columns...\n')

  try {
    // Get all columns
    const allColumns = await query<{ column_name: string; data_type: string }>(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'employers'
      ORDER BY column_name
    `)

    console.log(`   Found ${allColumns.rows.length} total columns:`)
    allColumns.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type})`)
    })

    // Check specifically for the required columns from Employers collection
    const columnNames = allColumns.rows.map(r => r.column_name)
    
    // Expected columns based on Employers collection
    // Payload converts camelCase to snake_case for database
    const requiredColumns = [
      'id',
      'email',
      'password', // Auth field
      'responsible_person', // responsiblePerson
      'company_name', // companyName
      'phone',
      'website',
      'address',
      'industry',
      'company_size', // companySize
      'terms_accepted', // termsAccepted
      'email_verified', // emailVerified
      'email_verification_token', // emailVerificationToken
      'email_verification_expires', // emailVerificationExpires
      'password_reset_token', // passwordResetToken
      'password_reset_expires', // passwordResetExpires
      'wallet_interview_credits', // wallet.interviewCredits
      'wallet_contact_unlock_credits', // wallet.contactUnlockCredits
      'active_plan_id', // activePlan (relationship)
      'features_basic_filters', // features.basicFilters
      'features_nationality_restriction', // features.nationalityRestriction
      'reset_password_token', // Auth field
      'reset_password_expiration', // Auth field
      'salt', // Auth field
      'hash', // Auth field
      'login_attempts', // Auth field
      'lock_until', // Auth field
      'created_at',
      'updated_at',
    ]
    
    console.log('\n📊 Required Column Status:')
    const missing: string[] = []
    requiredColumns.forEach(col => {
      if (columnNames.includes(col)) {
        console.log(`   ✅ ${col} - EXISTS`)
      } else {
        console.log(`   ❌ ${col} - MISSING`)
        missing.push(col)
      }
    })

    if (missing.length === 0) {
      console.log('\n✅ All required columns exist!')
    } else {
      console.log(`\n⚠️  Missing columns: ${missing.join(', ')}`)
    }

  } catch (error) {
    console.error('❌ Check failed:', error)
    throw error
  }
}

async function main() {
  try {
    await checkEmployersColumns()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

main()

