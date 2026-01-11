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

async function checkPasswordResetFields() {
  console.log('\n🔍 Checking password reset fields in all collections...\n')

  const collections = ['users', 'candidates', 'employers']

  for (const collection of collections) {
    console.log(`\n📋 ${collection.toUpperCase()} table:`)
    
    try {
      const result = await query<{ column_name: string; data_type: string }>(`
        SELECT column_name, data_type
        FROM information_schema.columns 
        WHERE table_name = $1
          AND (column_name LIKE '%password%reset%' OR column_name LIKE '%reset%password%')
        ORDER BY column_name
      `, [collection])

      if (result.rows.length === 0) {
        console.log(`   ⚠️  No password reset columns found`)
      } else {
        result.rows.forEach(col => {
          console.log(`   - ${col.column_name} (${col.data_type})`)
        })
      }

      // Check for sample data
      const sampleResult = await query(`
        SELECT 
          email,
          password_reset_token,
          password_reset_expires,
          reset_password_token,
          reset_password_expiration
        FROM ${collection}
        WHERE password_reset_token IS NOT NULL 
           OR reset_password_token IS NOT NULL
        LIMIT 3
      `)

      if (sampleResult.rows.length > 0) {
        console.log(`   📊 Sample records with reset tokens:`)
        sampleResult.rows.forEach((row: any, idx: number) => {
          console.log(`   ${idx + 1}. Email: ${row.email}`)
          console.log(`      password_reset_token: ${row.password_reset_token ? 'SET' : 'NULL'}`)
          console.log(`      password_reset_expires: ${row.password_reset_expires || 'NULL'}`)
          console.log(`      reset_password_token: ${row.reset_password_token ? 'SET' : 'NULL'}`)
          console.log(`      reset_password_expiration: ${row.reset_password_expiration || 'NULL'}`)
        })
      }

    } catch (error: any) {
      console.log(`   ❌ Error checking ${collection}:`, error.message)
    }
  }
}

async function main() {
  try {
    await checkPasswordResetFields()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

main()



