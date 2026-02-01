// Script to create the about page in Payload CMS
// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from 'payload'

// Load environment variables from .env file in project root
const envPath = path.resolve(process.cwd(), '.env')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.warn('⚠️  Warning: Could not load .env file:', result.error.message)
} else {
  console.log('✅ Environment variables loaded from:', envPath)
}

// Verify required env vars
if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ Error: PAYLOAD_SECRET is not set')
  process.exit(1)
}

// Now dynamically import config after env vars are loaded
const configPromise = import('@payload-config')

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

async function createAboutPage() {
  console.log('📝 Creating about page...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    // Check if about page already exists
    const existing = await payload.find({
      collection: 'pages',
      where: {
        slug: {
          equals: 'about',
        },
      },
      limit: 1,
    })

    if (existing.docs.length > 0) {
      console.log(`✅ About page already exists with slug "about".`)
      console.log(`   Page ID: ${existing.docs[0].id}`)
      console.log(`\n📝 You can now:`)
      console.log(`   1. Go to Payload CMS admin panel`)
      console.log(`   2. Navigate to Pages collection`)
      console.log(`   3. Edit the page with slug "about"`)
      console.log(`   4. Go to the SEO tab to manage about page SEO`)
      console.log(`\n✨ About page is ready for SEO management!\n`)
      process.exit(0)
    }

    // Create the about page
    // Note: layout is required, so we create a minimal Content block
    const aboutPage = await payload.create({
      collection: 'pages',
      data: {
        title: 'About Us',
        slug: 'about',
        hero: {
          type: 'none',
        },
        meta: {
          title: 'Saudi Recruitment Portal | Talent Hiring & Jobs in KSA',
          description: 'A Saudi recruitment portal connecting employers with verified talent and supporting candidates with genuine job opportunities across Saudi Arabia.',
        },
        layout: [
          {
            blockType: 'content',
            blockName: 'About Page Placeholder',
            columns: [
              {
                size: 'full',
                richText: createMinimalLexicalContent(
                  'This is a placeholder. The about page uses custom components defined in the code.'
                ),
              },
            ],
          },
        ],
      },
      draft: false,
    })

    console.log(`\n✅ About page created successfully!`)
    console.log(`   Title: ${aboutPage.title}`)
    console.log(`   Slug: ${aboutPage.slug}`)
    console.log(`   ID: ${aboutPage.id}`)
    console.log(`\n📝 Next steps:`)
    console.log(`   1. Go to Payload CMS admin panel`)
    console.log(`   2. Navigate to Pages collection`)
    console.log(`   3. Edit the page with slug "about"`)
    console.log(`   4. Go to the SEO tab to manage about page SEO`)
    console.log(`   5. Update meta title, description, and image as needed`)
    console.log(`\n✨ About page is ready for SEO management!\n`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error creating about page:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

createAboutPage()
