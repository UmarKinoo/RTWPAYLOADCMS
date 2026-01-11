// Script to fix wallet columns data type in employers table
import dotenv from 'dotenv'
import path from 'path'
import { Pool } from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function fixWalletColumns() {
  console.log('\n🔧 Fixing wallet columns data type...\n')
  
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
    // Check current types
    const result = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employers' 
        AND column_name IN ('wallet_interview_credits', 'wallet_contact_unlock_credits')
    `)
    
    console.log('📋 Current wallet column types:')
    result.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`)
    })
    
    // Fix if needed
    for (const row of result.rows) {
      if (row.data_type === 'numeric') {
        console.log(`\n🔧 Converting ${row.column_name} from numeric to integer...`)
        try {
          // First, ensure all values are integers (round if needed)
          await pool.query(`
            UPDATE employers 
            SET ${row.column_name} = ROUND(${row.column_name}::numeric)::integer
            WHERE ${row.column_name} IS NOT NULL
          `)
          
          // Then alter the column type
          await pool.query(`
            ALTER TABLE employers 
            ALTER COLUMN ${row.column_name} TYPE integer 
            USING ${row.column_name}::integer
          `)
          
          console.log(`   ✅ Converted ${row.column_name} to integer`)
        } catch (error: any) {
          console.error(`   ❌ Error converting ${row.column_name}:`, error.message)
        }
      } else {
        console.log(`   ✅ ${row.column_name} is already ${row.data_type}`)
      }
    }
    
    // Verify
    console.log('\n🔍 Verifying changes...')
    const verifyResult = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'employers' 
        AND column_name IN ('wallet_interview_credits', 'wallet_contact_unlock_credits')
    `)
    
    verifyResult.rows.forEach(row => {
      console.log(`   - ${row.column_name}: ${row.data_type}`)
    })
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

fixWalletColumns()
  .then(() => {
    console.log('\n🎉 Fix complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })



