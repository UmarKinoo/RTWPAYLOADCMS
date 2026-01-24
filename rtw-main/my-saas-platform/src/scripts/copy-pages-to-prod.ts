// Script to copy SEO pages from local/dev to production Payload CMS
// IMPORTANT: This script uses environment variables - NEVER hardcode credentials

import dotenv from 'dotenv'
import path from 'path'
import { Pool } from 'pg'
import { getPayload } from 'payload'

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env')
dotenv.config({ path: envPath })

// Get database URIs from environment
const LOCAL_DB_URI = process.env.LOCAL_DATABASE_URI || process.env.DATABASE_URI
const PROD_DB_URI = process.env.PROD_DB_URI || process.env.PROD_DATABASE_URI || process.env.PRODUCTION_DATABASE_URI

// Helper function to create minimal Lexical content
function createMinimalLexicalContent(text: string) {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal' as const,
              style: '',
              text: text,
              type: 'text' as const,
              version: 1,
            },
          ],
          direction: 'ltr' as const,
          format: '' as const,
          indent: 0,
          type: 'paragraph' as const,
          version: 1,
        },
      ],
      direction: 'ltr' as const,
      format: '' as const,
      indent: 0,
      type: 'root' as const,
      version: 1,
    },
  }
}

async function copyPagesToProd() {
  console.log('\n🚀 Copying SEO pages from local/dev to PRODUCTION...\n')
  
  if (!LOCAL_DB_URI) {
    console.error('❌ LOCAL_DATABASE_URI or DATABASE_URI not set')
    console.error('   Set it: $env:LOCAL_DATABASE_URI="your-local-connection-string"')
    process.exit(1)
  }
  
  if (!PROD_DB_URI) {
    console.error('❌ PROD_DB_URI, PROD_DATABASE_URI or PRODUCTION_DATABASE_URI not set')
    console.error('   Set it: $env:PROD_DB_URI="your-production-connection-string"')
    process.exit(1)
  }
  
  // Verify production is not local
  if (PROD_DB_URI.includes('localhost') || PROD_DB_URI.includes('127.0.0.1') || PROD_DB_URI.includes('54322')) {
    console.error('❌ ERROR: PROD_DB_URI looks like a LOCAL database!')
    process.exit(1)
  }
  
  if (!PROD_DB_URI.includes('supabase.com')) {
    console.warn('⚠️  WARNING: PROD_DB_URI does not contain "supabase.com"')
    console.warn('   Are you sure this is the production database?')
    console.log('\n   Press Ctrl+C to cancel, or wait 3 seconds to continue...')
    await new Promise(resolve => setTimeout(resolve, 3000))
  }
  
  console.log('🔌 Connecting to Payload instances...')
  console.log('   Local/Dev:', LOCAL_DB_URI.match(/@([^:]+)/)?.[1] || 'hidden')
  console.log('   Production:', PROD_DB_URI.match(/@([^:]+)/)?.[1] || 'hidden')
  
  // Connect to databases
  const localPool = new Pool({
    connectionString: LOCAL_DB_URI,
    ssl: LOCAL_DB_URI.includes('supabase.com') ? {
      rejectUnauthorized: false,
    } : undefined,
  })
  
  // Initialize production Payload (for writing)
  const originalDbUri = process.env.DATABASE_URI
  process.env.DATABASE_URI = PROD_DB_URI
  
  try {
    // Test local connection
    await localPool.query('SELECT 1')
    console.log('✅ Connected to local database')
    
    // Initialize production Payload
    console.log('\n📦 Initializing production Payload instance...')
    const prodConfig = await import('@payload-config')
    const prodPayload = await getPayload({ 
      config: prodConfig.default,
    })
    console.log('✅ Connected to production Payload')
    
    // Fetch all pages from local database
    console.log('\n📋 Fetching pages from local/dev database...')
    const localPagesResult = await localPool.query(`
      SELECT 
        p.id,
        p.title,
        p.title_en,
        p.title_ar,
        p.slug,
        p.meta_title,
        p.meta_description,
        p.meta_image_id,
        p._status
      FROM pages p
      ORDER BY p.created_at DESC
      LIMIT 1000
    `)
    
    console.log(`   Found ${localPagesResult.rows.length} pages in local/dev`)
    
    if (localPagesResult.rows.length === 0) {
      console.log('   ⚠️  No pages found in local/dev')
      process.exit(0)
    }
    
    // Get existing pages from production (by slug)
    console.log('\n📋 Checking existing pages in production...')
    const prodPages = await prodPayload.find({
      collection: 'pages',
      limit: 1000,
    })
    
    const prodPageSlugs = new Set(prodPages.docs.map(p => p.slug))
    console.log(`   Found ${prodPages.docs.length} pages in production`)
    
    // Copy each page
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const pageRow of localPagesResult.rows) {
      try {
        const exists = prodPageSlugs.has(pageRow.slug)
        
        // Create minimal placeholder layout (required field)
        const layout = [
          {
            blockType: 'content',
            blockName: `${pageRow.title || pageRow.slug} Placeholder`,
            columns: [
              {
                size: 'full',
                richText: createMinimalLexicalContent(
                  `This is a placeholder. The ${pageRow.slug} page uses custom components defined in the code.`
                ),
              },
            ],
          },
        ]
        
        // Prepare page data
        const pageData: any = {
          title: pageRow.title || pageRow.title_en || pageRow.title_ar || 'Untitled',
          slug: pageRow.slug,
          hero: {
            type: 'none',
          },
          layout: layout,
        }
        
        // Add localized titles if available
        if (pageRow.title_en) {
          pageData.title_en = pageRow.title_en
        }
        if (pageRow.title_ar) {
          pageData.title_ar = pageRow.title_ar
        }
        
        // Add meta if available
        if (pageRow.meta_title || pageRow.meta_description) {
          pageData.meta = {
            title: pageRow.meta_title || undefined,
            description: pageRow.meta_description || undefined,
            // Skip image relationship for now (would need to copy media first)
          }
        }
        
        // Skip meta.image relationship for now (would need to copy media first)
        
        if (exists) {
          // Find existing page by slug
          const existingPage = prodPages.docs.find(p => p.slug === pageRow.slug)
          if (existingPage) {
            await prodPayload.update({
              collection: 'pages',
              id: existingPage.id,
              data: pageData,
              draft: false,
            })
            updated++
            console.log(`   ✅ Updated page: "${pageRow.title || pageRow.slug}" (${pageRow.slug})`)
          } else {
            skipped++
            console.log(`   ⏭️  Skipped page: "${pageRow.title || pageRow.slug}" (slug exists but couldn't find page)`)
          }
        } else {
          await prodPayload.create({
            collection: 'pages',
            data: pageData,
            draft: false,
          })
          created++
          console.log(`   ✅ Created page: "${pageRow.title || pageRow.slug}" (${pageRow.slug})`)
        }
      } catch (error: any) {
        errors++
        console.error(`   ❌ Error processing page "${pageRow.title || pageRow.slug}":`, error.message)
        if (error.stack) {
          console.error(`      ${error.stack.split('\n')[1]}`)
        }
      }
    }
    
    // Summary
    console.log('\n\n🎉 Summary:')
    console.log(`   Created: ${created} pages`)
    console.log(`   Updated: ${updated} pages`)
    console.log(`   Skipped: ${skipped} pages`)
    console.log(`   Errors: ${errors} pages`)
    
    if (errors === 0) {
      console.log(`\n✅ Successfully copied ${created + updated} pages to production!`)
    } else {
      console.log(`\n⚠️  Copied ${created + updated} pages with ${errors} errors`)
    }
    
    console.log('\n📝 Note:')
    console.log('   - Meta images were skipped (copy media separately if needed)')
    console.log('   - Pages are now available in production for SEO management')
    console.log('   - You can edit SEO metadata in the Payload CMS admin panel')
    
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    throw error
  } finally {
    // Restore original DATABASE_URI
    if (originalDbUri) {
      process.env.DATABASE_URI = originalDbUri
    } else {
      delete process.env.DATABASE_URI
    }
    await localPool.end()
    console.log('\n✅ Connections closed')
  }
}

copyPagesToProd()
  .then(() => {
    console.log('\n🎉 SEO pages copy complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
