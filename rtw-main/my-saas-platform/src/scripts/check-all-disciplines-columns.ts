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

async function checkAllColumns() {
  console.log('\n🔍 Checking ALL disciplines table columns...\n')

  try {
    const result = await query<{ column_name: string; data_type: string; is_nullable: string }>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'disciplines'
      ORDER BY column_name
    `)

    console.log(`   Found ${result.rows.length} total columns:`)
    result.rows.forEach(col => {
      console.log(`   - ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`)
    })

    // Check specifically for the required columns from Disciplines collection
    const columnNames = result.rows.map(r => r.column_name)
    const requiredColumns = [
      'name',
      'name_en', 
      'name_ar',
      'slug',
      'display_order',  // Payload converts camelCase to snake_case
      'is_highlighted'  // Payload converts camelCase to snake_case
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
    await checkAllColumns()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

main()



