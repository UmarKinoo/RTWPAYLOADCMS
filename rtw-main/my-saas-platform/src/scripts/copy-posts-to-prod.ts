// Script to copy blog posts from local/dev to production Payload CMS
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

async function copyPostsToProd() {
  console.log('\n🚀 Copying blog posts from local/dev to PRODUCTION...\n')
  
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
      secret: process.env.PAYLOAD_SECRET || 'your-secret-here',
    })
    console.log('✅ Connected to production Payload')
    
    // Fetch all published posts from local database
    console.log('\n📋 Fetching posts from local/dev database...')
    const localPostsResult = await localPool.query(`
      SELECT 
        p.id,
        p.title,
        p.slug,
        p.content,
        p.published_at,
        p.meta_title,
        p.meta_description,
        p.hero_image_id,
        p.meta_image_id,
        p._status
      FROM posts p
      WHERE p._status = 'published'
      ORDER BY p.created_at DESC
      LIMIT 1000
    `)
    
    console.log(`   Found ${localPostsResult.rows.length} published posts in local/dev`)
    
    if (localPostsResult.rows.length === 0) {
      console.log('   ⚠️  No posts found in local/dev')
      process.exit(0)
    }
    
    // Get existing posts from production (by slug)
    console.log('\n📋 Checking existing posts in production...')
    const prodPosts = await prodPayload.find({
      collection: 'posts',
      limit: 1000,
    })
    
    const prodPostSlugs = new Set(prodPosts.docs.map(p => p.slug))
    console.log(`   Found ${prodPosts.docs.length} posts in production`)
    
    // Fetch categories and authors relationships from local (if tables exist)
    console.log('\n📋 Fetching post relationships from local...')
    const postCategoriesMap = new Map<string, string[]>()
    const postAuthorsMap = new Map<string, string[]>()
    
    try {
      const postCategoriesResult = await localPool.query(`
        SELECT post_id, category_id 
        FROM posts_categories
      `)
      postCategoriesResult.rows.forEach(row => {
        const postId = String(row.post_id)
        const catId = String(row.category_id)
        if (!postCategoriesMap.has(postId)) {
          postCategoriesMap.set(postId, [])
        }
        postCategoriesMap.get(postId)!.push(catId)
      })
      console.log(`   Found ${postCategoriesResult.rows.length} category relationships`)
    } catch (error: any) {
      console.log(`   ⚠️  Could not fetch categories relationships: ${error.message}`)
    }
    
    try {
      const postAuthorsResult = await localPool.query(`
        SELECT post_id, user_id 
        FROM posts_authors
      `)
      postAuthorsResult.rows.forEach(row => {
        const postId = String(row.post_id)
        const userId = String(row.user_id)
        if (!postAuthorsMap.has(postId)) {
          postAuthorsMap.set(postId, [])
        }
        postAuthorsMap.get(postId)!.push(userId)
      })
      console.log(`   Found ${postAuthorsResult.rows.length} author relationships`)
    } catch (error: any) {
      console.log(`   ⚠️  Could not fetch authors relationships: ${error.message}`)
    }
    
    // Copy each post
    let created = 0
    let updated = 0
    let skipped = 0
    let errors = 0
    
    for (const postRow of localPostsResult.rows) {
      try {
        const postId = String(postRow.id)
        const exists = prodPostSlugs.has(postRow.slug)
        
        // Parse content (stored as JSON in database)
        let content: any = null
        try {
          content = typeof postRow.content === 'string' 
            ? JSON.parse(postRow.content) 
            : postRow.content
        } catch {
          console.warn(`   ⚠️  Could not parse content for post "${postRow.title}"`)
        }
        
        // Prepare post data
        const postData: any = {
          title: postRow.title,
          slug: postRow.slug,
          content: content,
          publishedAt: postRow.published_at || new Date().toISOString(),
        }
        
        // Add meta if available
        if (postRow.meta_title || postRow.meta_description) {
          postData.meta = {
            title: postRow.meta_title || undefined,
            description: postRow.meta_description || undefined,
            // Skip image relationship for now (would need to copy media first)
          }
        }
        
        // Handle categories - try to find matching ones by ID or create mapping
        const localCategoryIds = postCategoriesMap.get(postId) || []
        if (localCategoryIds.length > 0) {
          // For now, skip categories as we'd need to map local IDs to production IDs
          // This could be enhanced to match by slug if categories have slugs
          console.log(`   ℹ️  Post "${postRow.title}" has ${localCategoryIds.length} categories (skipping for now)`)
        }
        
        // Handle authors - try to find matching ones by email
        const localAuthorIds = postAuthorsMap.get(postId) || []
        if (localAuthorIds.length > 0) {
          // For now, skip authors as we'd need to map local user IDs to production user IDs
          // This could be enhanced to match by email
          console.log(`   ℹ️  Post "${postRow.title}" has ${localAuthorIds.length} authors (skipping for now)`)
        }
        
        // Skip heroImage and meta.image relationships for now (would need to copy media first)
        
        if (exists) {
          // Find existing post by slug
          const existingPost = prodPosts.docs.find(p => p.slug === postRow.slug)
          if (existingPost) {
            await prodPayload.update({
              collection: 'posts',
              id: existingPost.id,
              data: postData,
              draft: false,
            })
            updated++
            console.log(`   ✅ Updated post: "${postRow.title}" (${postRow.slug})`)
          } else {
            skipped++
            console.log(`   ⏭️  Skipped post: "${postRow.title}" (slug exists but couldn't find post)`)
          }
        } else {
          await prodPayload.create({
            collection: 'posts',
            data: postData,
            draft: false,
          })
          created++
          console.log(`   ✅ Created post: "${postRow.title}" (${postRow.slug})`)
        }
      } catch (error: any) {
        errors++
        console.error(`   ❌ Error processing post "${postRow.title}":`, error.message)
      }
    }
    
    // Summary
    console.log('\n\n🎉 Summary:')
    console.log(`   Created: ${created} posts`)
    console.log(`   Updated: ${updated} posts`)
    console.log(`   Skipped: ${skipped} posts`)
    console.log(`   Errors: ${errors} posts`)
    
    if (errors === 0) {
      console.log(`\n✅ Successfully copied ${created + updated} posts to production!`)
    } else {
      console.log(`\n⚠️  Copied ${created + updated} posts with ${errors} errors`)
    }
    
    console.log('\n📝 Note:')
    console.log('   - Hero images and meta images were skipped (copy media separately if needed)')
    console.log('   - Categories and authors relationships were skipped (map manually if needed)')
    console.log('   - You may need to manually update images and relationships in the CMS')
    
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

copyPostsToProd()
  .then(() => {
    console.log('\n🎉 Blog posts copy complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Failed:', error)
    process.exit(1)
  })
