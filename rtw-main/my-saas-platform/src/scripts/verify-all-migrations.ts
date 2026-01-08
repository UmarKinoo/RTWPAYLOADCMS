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

async function verifyAllMigrations() {
  console.log('\n🔍 Verifying all migrations...\n')

  const checks = [
    {
      name: 'pgvector extension',
      query: `SELECT extname FROM pg_extension WHERE extname = 'vector'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'disciplines.name_en',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'disciplines' AND column_name = 'name_en'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'disciplines.name_ar',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'disciplines' AND column_name = 'name_ar'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'disciplines.slug',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'disciplines' AND column_name = 'slug'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'disciplines.display_order',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'disciplines' AND column_name = 'display_order'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'disciplines.is_highlighted',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'disciplines' AND column_name = 'is_highlighted'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'plans.title_en',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'title_en'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'plans.title_ar',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'plans' AND column_name = 'title_ar'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'pages.title_en',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'title_en'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'pages.title_ar',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'pages' AND column_name = 'title_ar'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'candidates.bio_embedding_vec',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'candidates' AND column_name = 'bio_embedding_vec'`,
      check: (rows: any[]) => rows.length > 0,
    },
    {
      name: 'skills.name_embedding_vec',
      query: `SELECT column_name FROM information_schema.columns WHERE table_name = 'skills' AND column_name = 'name_embedding_vec'`,
      check: (rows: any[]) => rows.length > 0,
    },
  ]

  let allPassed = true

  for (const check of checks) {
    try {
      const result = await query(check.query)
      const passed = check.check(result.rows)
      const status = passed ? '✅' : '❌'
      console.log(`${status} ${check.name}: ${passed ? 'EXISTS' : 'MISSING'}`)
      if (!passed) allPassed = false
    } catch (error: any) {
      console.log(`❌ ${check.name}: ERROR - ${error.message}`)
      allPassed = false
    }
  }

  console.log('\n' + '='.repeat(50))
  if (allPassed) {
    console.log('✅ All migrations verified successfully!')
  } else {
    console.log('⚠️  Some migrations are missing. Please apply them.')
  }
  console.log('='.repeat(50) + '\n')
}

async function main() {
  try {
    await verifyAllMigrations()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await closePool()
  }
}

main()

