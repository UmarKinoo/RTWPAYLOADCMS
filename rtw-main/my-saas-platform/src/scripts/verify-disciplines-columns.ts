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

async function verifyColumns() {
  console.log('\n🔍 Verifying disciplines table columns...\n')

  try {
    const result = await query<{ column_name: string; data_type: string }>(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'disciplines' 
        AND (column_name LIKE '%name%' OR column_name LIKE '%title%')
      ORDER BY column_name
    `)

    console.log(`   Found ${result.rows.length} name/title columns:`)
    result.rows.forEach(col => {
      console.log(`   ✅ ${col.column_name} (${col.data_type})`)
    })

    // Check specifically for the required columns
    const columnNames = result.rows.map(r => r.column_name)
    const requiredColumns = ['name', 'name_en', 'name_ar']
    
    console.log('\n📊 Column Status:')
    requiredColumns.forEach(col => {
      if (columnNames.includes(col)) {
        console.log(`   ✅ ${col} - EXISTS`)
      } else {
        console.log(`   ❌ ${col} - MISSING`)
      }
    })

    if (columnNames.includes('name_en') && columnNames.includes('name_ar')) {
      console.log('\n✅ All required columns exist! Migration successful.')
    } else {
      console.log('\n⚠️  Some required columns are missing.')
    }

  } catch (error) {
    console.error('❌ Verification failed:', error)
    throw error
  }
}

async function main() {
  try {
    await verifyColumns()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

main()



