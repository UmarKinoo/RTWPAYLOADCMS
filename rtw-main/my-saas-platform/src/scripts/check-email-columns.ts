// Script to check if email columns exist in candidates and employers tables
// When Payload CMS has auth: true, it automatically adds email and password fields
// But if tables were created manually, these columns might be missing

import dotenv from 'dotenv'
import path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function checkEmailColumns() {
  console.log('\n🔍 Checking email columns in candidates and employers tables...\n')
  
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI not set')
    process.exit(1)
  }
  
  // Show which database we're connecting to (masked for security)
  const maskedUri = DATABASE_URI.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3')
  const isLocal = DATABASE_URI.includes('localhost') || DATABASE_URI.includes('127.0.0.1') || DATABASE_URI.includes(':54322')
  const isSupabase = DATABASE_URI.includes('supabase')
  
  console.log(`📡 Database Connection:`)
  console.log(`   - URI: ${maskedUri}`)
  console.log(`   - Type: ${isLocal ? '🖥️  LOCAL' : '☁️  PRODUCTION/REMOTE'}`)
  console.log(`   - Provider: ${isSupabase ? 'Supabase' : 'Other PostgreSQL'}\n`)
  
  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: DATABASE_URI.includes('supabase') ? {
      rejectUnauthorized: false,
    } : undefined,
  })

  try {
    // Check candidates table
    console.log('📋 Checking candidates table...')
    const candidatesResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'candidates'
      ORDER BY column_name
    `)
    
    const candidatesColumns = candidatesResult.rows.map(r => r.column_name)
    const hasCandidatesEmail = candidatesColumns.includes('email')
    
    console.log(`   - Email column exists: ${hasCandidatesEmail ? '✅ YES' : '❌ NO'}`)
    
    if (!hasCandidatesEmail) {
      console.log('   📝 Adding email column to candidates table...')
      try {
        await pool.query(`
          ALTER TABLE candidates 
          ADD COLUMN email text UNIQUE;
        `)
        console.log('   ✅ Added email column to candidates table')
      } catch (error: any) {
        console.error(`   ❌ Error adding email column: ${error.message}`)
      }
    } else {
      // Check if email column has data
      const emailCount = await pool.query(`
        SELECT COUNT(*) as count, COUNT(email) as email_count
        FROM candidates
      `)
      console.log(`   - Total candidates: ${emailCount.rows[0].count}`)
      console.log(`   - Candidates with email: ${emailCount.rows[0].email_count}`)
    }
    
    // Check employers table
    console.log('\n📋 Checking employers table...')
    const employersResult = await pool.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'employers'
      ORDER BY column_name
    `)
    
    const employersColumns = employersResult.rows.map(r => r.column_name)
    const hasEmployersEmail = employersColumns.includes('email')
    
    console.log(`   - Email column exists: ${hasEmployersEmail ? '✅ YES' : '❌ NO'}`)
    
    if (!hasEmployersEmail) {
      console.log('   📝 Adding email column to employers table...')
      try {
        await pool.query(`
          ALTER TABLE employers 
          ADD COLUMN email text UNIQUE;
        `)
        console.log('   ✅ Added email column to employers table')
      } catch (error: any) {
        console.error(`   ❌ Error adding email column: ${error.message}`)
      }
    } else {
      // Check if email column has data
      const emailCount = await pool.query(`
        SELECT COUNT(*) as count, COUNT(email) as email_count
        FROM employers
      `)
      console.log(`   - Total employers: ${emailCount.rows[0].count}`)
      console.log(`   - Employers with email: ${emailCount.rows[0].email_count}`)
    }
    
    // Show sample data to verify emails are visible
    console.log('\n📊 Sample data check...')
    const candidatesSample = await pool.query(`
      SELECT id, email, first_name, last_name
      FROM candidates
      LIMIT 5
    `)
    console.log('\n   Sample candidates:')
    candidatesSample.rows.forEach(row => {
      console.log(`   - ID: ${row.id}, Email: ${row.email || 'NULL'}, Name: ${row.first_name} ${row.last_name}`)
    })
    
    const employersSample = await pool.query(`
      SELECT id, email, company_name, responsible_person
      FROM employers
      LIMIT 5
    `)
    console.log('\n   Sample employers:')
    employersSample.rows.forEach(row => {
      console.log(`   - ID: ${row.id}, Email: ${row.email || 'NULL'}, Company: ${row.company_name}`)
    })
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

checkEmailColumns()
  .then(() => {
    console.log('\n🎉 Check complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })

