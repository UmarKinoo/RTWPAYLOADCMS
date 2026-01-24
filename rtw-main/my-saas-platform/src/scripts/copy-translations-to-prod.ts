// Script to copy translation data (name_en, name_ar) from local/dev to production database
// This avoids re-translating everything with OpenAI
// IMPORTANT: This script uses DATABASE_URI from environment - NEVER hardcode credentials

import dotenv from 'dotenv'
import path from 'path'
import { Pool } from 'pg'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Get database URIs from environment
const LOCAL_DB_URI = process.env.LOCAL_DATABASE_URI || process.env.DATABASE_URI
const PROD_DB_URI = process.env.PROD_DATABASE_URI || process.env.PRODUCTION_DATABASE_URI

interface TranslationData {
  id: string
  name_en: string | null
  name_ar: string | null
}

async function copyTranslationsToProd() {
  console.log('\n🚀 Copying translations from local/dev to PRODUCTION...\n')
  
  if (!LOCAL_DB_URI) {
    console.error('❌ LOCAL_DATABASE_URI or DATABASE_URI not set')
    console.error('   Set it: $env:LOCAL_DATABASE_URI="your-local-connection-string"')
    process.exit(1)
  }
  
  if (!PROD_DB_URI) {
    console.error('❌ PROD_DATABASE_URI or PRODUCTION_DATABASE_URI not set')
    console.error('   Set it: $env:PROD_DATABASE_URI="your-production-connection-string"')
    process.exit(1)
  }
  
  // Verify production is not local
  if (PROD_DB_URI.includes('localhost') || PROD_DB_URI.includes('127.0.0.1') || PROD_DB_URI.includes('54322')) {
    console.error('❌ ERROR: PROD_DATABASE_URI looks like a LOCAL database!')
    process.exit(1)
  }
  
  if (!PROD_DB_URI.includes('supabase.com')) {
    console.warn('⚠️  WARNING: PROD_DATABASE_URI does not contain "supabase.com"')
    console.warn('   Are you sure this is the production database?')
    console.log('\n   Press Ctrl+C to cancel, or wait 3 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  console.log('🔌 Connecting to databases...')
  console.log('   Local/Dev:', LOCAL_DB_URI.match(/@([^:]+)/)?.[1] || 'hidden')
  console.log('   Production:', PROD_DB_URI.match(/@([^:]+)/)?.[1] || 'hidden')
  
  const localPool = new Pool({
    connectionString: LOCAL_DB_URI,
    ssl: LOCAL_DB_URI.includes('supabase.com') ? {
      rejectUnauthorized: false,
    } : undefined,
  })
  
  const prodPool = new Pool({
    connectionString: PROD_DB_URI,
    ssl: {
      rejectUnauthorized: false,
    },
  })
  
  try {
    // Test connections
    await localPool.query('SELECT 1')
    console.log('✅ Connected to local/dev database')
    
    await prodPool.query('SELECT 1')
    console.log('✅ Connected to production database')
    
    // Function to copy translations for a table
    async function copyTableTranslations(
      tableName: 'skills' | 'categories' | 'subcategories' | 'disciplines',
      displayName: string
    ) {
      console.log(`\n📋 Copying ${displayName} translations...`)
      
      // 1. Fetch translations from local
      const localResult = await localPool.query<TranslationData>(`
        SELECT id, name_en, name_ar
        FROM ${tableName}
        WHERE name_en IS NOT NULL OR name_ar IS NOT NULL
        ORDER BY id
      `)
      
      console.log(`   Found ${localResult.rows.length} ${displayName} with translations in local/dev`)
      
      if (localResult.rows.length === 0) {
        console.log(`   ⚠️  No translations found in local/dev for ${displayName}`)
        return { updated: 0, skipped: 0, errors: 0 }
      }
      
      // 2. Check which IDs exist in production
      const prodIdsResult = await prodPool.query<{ id: string }>(`
        SELECT id FROM ${tableName}
      `)
      
      const prodIds = new Set(prodIdsResult.rows.map(r => String(r.id)))
      console.log(`   Found ${prodIds.size} ${displayName} in production`)
      
      // 3. Update production with translations
      let updated = 0
      let skipped = 0
      let errors = 0
      
      for (const row of localResult.rows) {
        const id = String(row.id)
        
        // Skip if ID doesn't exist in production
        if (!prodIds.has(id)) {
          skipped++
          if (skipped <= 5 || skipped % 100 === 0) {
            console.log(`   ⏭️  Skipping ${displayName} ID ${id} (not found in production)`)
          }
          continue
        }
        
        try {
          // Update production with translations
          const updateData: string[] = []
          const values: any[] = []
          let paramIndex = 1
          
          if (row.name_en !== null) {
            updateData.push(`name_en = $${paramIndex}`)
            values.push(row.name_en)
            paramIndex++
          }
          
          if (row.name_ar !== null) {
            updateData.push(`name_ar = $${paramIndex}`)
            values.push(row.name_ar)
            paramIndex++
          }
          
          if (updateData.length === 0) {
            skipped++
            continue
          }
          
          values.push(id)
          await prodPool.query(
            `UPDATE ${tableName} SET ${updateData.join(', ')} WHERE id = $${paramIndex}`,
            values
          )
          
          updated++
          if (updated <= 5 || updated % 100 === 0) {
            const translations = [
              row.name_en ? 'EN' : '',
              row.name_ar ? 'AR' : ''
            ].filter(Boolean).join('+')
            console.log(`   ✅ Updated ${displayName} ID ${id} (${translations})`)
          }
        } catch (error: any) {
          errors++
          console.error(`   ❌ Error updating ${displayName} ID ${id}:`, error.message)
        }
      }
      
      console.log(`\n📊 ${displayName} Summary:`)
      console.log(`   Updated: ${updated}`)
      console.log(`   Skipped: ${skipped}`)
      console.log(`   Errors: ${errors}`)
      
      return { updated, skipped, errors }
    }
    
    // Copy translations for all four tables
    const skillsResult = await copyTableTranslations('skills', 'Skills')
    const categoriesResult = await copyTableTranslations('categories', 'Categories')
    const subcategoriesResult = await copyTableTranslations('subcategories', 'Subcategories')
    const disciplinesResult = await copyTableTranslations('disciplines', 'Disciplines')
    
    // Overall summary
    console.log('\n\n🎉 Overall Summary:')
    console.log(`   Skills: ${skillsResult.updated} updated, ${skillsResult.skipped} skipped, ${skillsResult.errors} errors`)
    console.log(`   Categories: ${categoriesResult.updated} updated, ${categoriesResult.skipped} skipped, ${categoriesResult.errors} errors`)
    console.log(`   Subcategories: ${subcategoriesResult.updated} updated, ${subcategoriesResult.skipped} skipped, ${subcategoriesResult.errors} errors`)
    console.log(`   Disciplines: ${disciplinesResult.updated} updated, ${disciplinesResult.skipped} skipped, ${disciplinesResult.errors} errors`)
    
    const totalUpdated = skillsResult.updated + categoriesResult.updated + subcategoriesResult.updated + disciplinesResult.updated
    const totalErrors = skillsResult.errors + categoriesResult.errors + subcategoriesResult.errors + disciplinesResult.errors
    
    if (totalErrors === 0) {
      console.log(`\n✅ Successfully copied ${totalUpdated} translations to production!`)
    } else {
      console.log(`\n⚠️  Copied ${totalUpdated} translations with ${totalErrors} errors`)
    }
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    throw error
  } finally {
    await localPool.end()
    await prodPool.end()
    console.log('\n✅ Connections closed')
  }
}

copyTranslationsToProd()
  .then(() => {
    console.log('\n🎉 Translation copy complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
