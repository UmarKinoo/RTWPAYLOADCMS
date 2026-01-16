// Quick script to check which database you're connected to
// Run: npx tsx src/scripts/check-database-connection.ts

import dotenv from 'dotenv'
import path from 'path'
import { Pool } from 'pg'

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL

console.log('\n🔍 Database Connection Check\n')
console.log('=' .repeat(60))

if (!DATABASE_URI) {
  console.error('❌ No DATABASE_URI or DATABASE_URL found in environment')
  console.error('   Check your .env file')
  process.exit(1)
}

// Mask the password for display
const maskedUri = DATABASE_URI.replace(/(:\/\/[^:]+:)([^@]+)(@)/, '$1****$3')
console.log('📋 Connection String:', maskedUri)

// Determine database type
const isLocal = DATABASE_URI.includes('localhost') || 
                DATABASE_URI.includes('127.0.0.1') || 
                DATABASE_URI.includes(':54322')

const isProduction = DATABASE_URI.includes('supabase.com') && 
                     !DATABASE_URI.includes('localhost') &&
                     !DATABASE_URI.includes('127.0.0.1')

console.log('\n📍 Database Type:')
if (isLocal) {
  console.log('   ✅ LOCAL database (development)')
} else if (isProduction) {
  console.log('   ⚠️  PRODUCTION database (Supabase cloud)')
} else {
  console.log('   ❓ Unknown/Other database')
}

// Try to connect and get database name
const pool = new Pool({
  connectionString: DATABASE_URI,
  ssl: DATABASE_URI.includes('supabase') ? {
    rejectUnauthorized: false,
  } : undefined,
})

try {
  const result = await pool.query('SELECT current_database() as db_name, version() as version')
  const dbName = result.rows[0].db_name
  const version = result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
  
  console.log('\n✅ Connection Successful!')
  console.log('   Database Name:', dbName)
  console.log('   PostgreSQL Version:', version)
  
  // Check if it's production by looking for production-like data
  if (isProduction) {
    console.log('\n⚠️  WARNING: You are connected to PRODUCTION!')
    console.log('   If you want to use local database:')
    console.log('   1. Make sure your .env file has:')
    console.log('      DATABASE_URI=postgresql://postgres:postgres@127.0.0.1:54322/postgres')
    console.log('   2. Restart your dev server')
    console.log('   3. Make sure no DATABASE_URI is set in your terminal session')
  } else if (isLocal) {
    console.log('\n✅ You are connected to LOCAL database (correct for development)')
  }
  
} catch (error: any) {
  console.error('\n❌ Connection Failed:', error.message)
} finally {
  await pool.end()
}

console.log('\n' + '='.repeat(60))

