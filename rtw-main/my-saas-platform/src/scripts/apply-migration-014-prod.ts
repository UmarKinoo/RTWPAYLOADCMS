// Script to apply migration 014 to PRODUCTION database
// Add name_en and name_ar columns to skills, categories, and subcategories tables
// This fixes the "column name_en does not exist" error on candidates page
// IMPORTANT: This script uses DATABASE_URI from environment - NEVER hardcode credentials

import dotenv from 'dotenv'
import path from 'path'
import fs from 'fs'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Get production database URI from environment
const DATABASE_URI = process.env.DATABASE_URI || process.env.DATABASE_URL || process.env.PRODUCTION_DATABASE_URI

async function applyMigration014Prod() {
  console.log('\n🚀 Applying migration 014 to PRODUCTION: Add localized name columns...\n')
  
  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI not set')
    console.error('   Set it temporarily: $env:DATABASE_URI="your-connection-string"')
    process.exit(1)
  }
  
  // Verify it's production
  if (DATABASE_URI.includes('localhost') || DATABASE_URI.includes('127.0.0.1') || DATABASE_URI.includes('54322')) {
    console.error('❌ ERROR: This looks like a LOCAL database!')
    process.exit(1)
  }
  
  console.log('🔌 Connecting to PRODUCTION database...')
  
  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: {
      rejectUnauthorized: false,
    },
  })

  try {
    // Read the migration file
    const migrationPath = path.resolve(process.cwd(), 'supabase', 'migrations', '014_add_localized_names_to_skills_categories_subcategories.sql')
    
    if (!fs.existsSync(migrationPath)) {
      console.error(`❌ Migration file not found: ${migrationPath}`)
      process.exit(1)
    }
    
    const sql = fs.readFileSync(migrationPath, 'utf-8')
    
    console.log('📄 Migration file loaded')
    
    // Test connection
    await pool.query('SELECT 1')
    console.log('✅ Connected to PRODUCTION database')
    
    // Check if columns exist
    console.log('\n🔍 Checking existing columns...')
    
    const checkSkills = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'skills' 
      AND column_name IN ('name_en', 'name_ar')
    `)
    
    const checkCategories = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      AND column_name IN ('name_en', 'name_ar')
    `)
    
    const checkSubcategories = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subcategories' 
      AND column_name IN ('name_en', 'name_ar')
    `)

    const existingSkills = checkSkills.rows.map((r: any) => r.column_name)
    const existingCategories = checkCategories.rows.map((r: any) => r.column_name)
    const existingSubcategories = checkSubcategories.rows.map((r: any) => r.column_name)

    console.log('   Skills:', existingSkills.length > 0 ? `✅ ${existingSkills.join(', ')}` : '❌ Missing')
    console.log('   Categories:', existingCategories.length > 0 ? `✅ ${existingCategories.join(', ')}` : '❌ Missing')
    console.log('   Subcategories:', existingSubcategories.length > 0 ? `✅ ${existingSubcategories.join(', ')}` : '❌ Missing')

    if (
      existingSkills.length === 2 &&
      existingCategories.length === 2 &&
      existingSubcategories.length === 2
    ) {
      console.log('\n✅ All columns already exist. Migration may have already been applied.')
      await pool.end()
      return
    }

    // Apply migration
    console.log('\n📝 Applying migration...')
    await pool.query(sql)
    console.log('✅ Migration applied successfully!')
    
    // Verify
    console.log('\n🔍 Verifying...')
    const verifySkills = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'skills' 
      AND column_name IN ('name_en', 'name_ar')
      ORDER BY column_name
    `)
    
    const verifyCategories = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'categories' 
      AND column_name IN ('name_en', 'name_ar')
      ORDER BY column_name
    `)
    
    const verifySubcategories = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'subcategories' 
      AND column_name IN ('name_en', 'name_ar')
      ORDER BY column_name
    `)

    if (verifySkills.rows.length > 0) {
      console.log('✅ Skills columns:')
      verifySkills.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    }
    
    if (verifyCategories.rows.length > 0) {
      console.log('✅ Categories columns:')
      verifyCategories.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    }
    
    if (verifySubcategories.rows.length > 0) {
      console.log('✅ Subcategories columns:')
      verifySubcategories.rows.forEach((row: any) => {
        console.log(`   - ${row.column_name} (${row.data_type})`)
      })
    }

    // Get row counts
    const skillsCount = await pool.query('SELECT COUNT(*) FROM skills')
    const categoriesCount = await pool.query('SELECT COUNT(*) FROM categories')
    const subcategoriesCount = await pool.query('SELECT COUNT(*) FROM subcategories')

    console.log('\n📊 Table row counts:')
    console.log(`   Skills: ${skillsCount.rows[0].count}`)
    console.log(`   Categories: ${categoriesCount.rows[0].count}`)
    console.log(`   Subcategories: ${subcategoriesCount.rows[0].count}`)
    
  } catch (error: any) {
    if (error.message?.includes('already exists')) {
      console.log('⚠️  Column may already exist (this is OK)')
    } else {
      console.error('❌ Error:', error.message)
      throw error
    }
  } finally {
    await pool.end()
    console.log('\n✅ Connection closed')
  }
}

applyMigration014Prod()
  .then(() => {
    console.log('\n🎉 Migration 014 complete!')
    console.log('\n📌 This should fix the "column name_en does not exist" error on the candidates page.')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
