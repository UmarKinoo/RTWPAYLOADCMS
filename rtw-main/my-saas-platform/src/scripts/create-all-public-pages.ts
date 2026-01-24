// Script to create all public pages in Payload CMS for SEO management
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
              mode: 'normal',
              style: '',
              text: text,
              type: 'text',
              version: 1,
            },
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1,
        },
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }
}

// Public pages configuration
const publicPages = [
  {
    slug: 'home',
    title: 'Home',
    meta: {
      title: 'Ready to Work | Connect with Talented Candidates',
      description: 'Explore thousands of openings and talented profiles all in one place. Access a wide pool of qualified candidates across all roles and industries.',
    },
  },
  {
    slug: 'about',
    title: 'About Us',
    meta: {
      title: 'About Us | Ready to Work',
      description: 'Learn about Ready to Work - your trusted partner for connecting talented candidates with the right employers.',
    },
  },
  {
    slug: 'contact',
    title: 'Contact Us',
    meta: {
      title: 'Contact Us | Ready to Work',
      description: "Get in touch with Ready to Work. We'd love to hear from you! Whether you have a question, feedback, or just want to say hello, feel free to reach out.",
    },
  },
  {
    slug: 'pricing',
    title: 'Pricing',
    meta: {
      title: 'Pricing | Ready to Work',
      description: 'Flexible pricing for every team size. Find the right talent without complexity.',
    },
  },
  {
    slug: 'candidates',
    title: 'Candidates',
    meta: {
      title: 'Candidates | Ready to Work',
      description: 'Browse our talented candidates. Find skilled workers, specialists, and elite professionals for your team.',
    },
  },
  {
    slug: 'privacy-policy',
    title: 'Privacy Policy',
    meta: {
      title: 'Privacy Policy | Ready to Work',
      description: 'Read our privacy policy to understand how we collect, use, and protect your personal data.',
    },
  },
  {
    slug: 'terms-and-conditions',
    title: 'Terms and Conditions',
    meta: {
      title: 'Terms and Conditions | Ready to Work',
      description: 'Read our terms and conditions to understand the rules and regulations for using our platform.',
    },
  },
  {
    slug: 'custom-request',
    title: 'Custom Plan Request',
    meta: {
      title: 'Custom Plan Request | Ready to Work',
      description: 'Request a custom pricing plan tailored to your needs.',
    },
  },
]

async function createAllPages() {
  console.log('📝 Creating all public pages for SEO management...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    const results = {
      created: [] as string[],
      existing: [] as string[],
      errors: [] as { slug: string; error: string }[],
    }

    for (const pageConfig of publicPages) {
      try {
        // Check if page already exists
        const existing = await payload.find({
          collection: 'pages',
          where: {
            slug: {
              equals: pageConfig.slug,
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          results.existing.push(pageConfig.slug)
          console.log(`⏭️  Page "${pageConfig.slug}" already exists, skipping...`)
          continue
        }

        // Create the page
        const page = await payload.create({
          collection: 'pages',
          data: {
            title: pageConfig.title,
            slug: pageConfig.slug,
            meta: pageConfig.meta,
            layout: [
              {
                blockType: 'content',
                blockName: `${pageConfig.title} Placeholder`,
                columns: [
                  {
                    size: 'full',
                    richText: createMinimalLexicalContent(
                      `This is a placeholder. The ${pageConfig.slug} page uses custom components defined in the code.`
                    ),
                  },
                ],
              },
            ],
            _status: 'published',
          },
        })

        results.created.push(pageConfig.slug)
        console.log(`✅ Created page: ${pageConfig.slug} (ID: ${page.id})`)
      } catch (error: any) {
        results.errors.push({ slug: pageConfig.slug, error: error.message })
        console.error(`❌ Error creating page "${pageConfig.slug}": ${error.message}`)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   ✅ Created: ${results.created.length} pages`)
    console.log(`   ⏭️  Already existed: ${results.existing.length} pages`)
    console.log(`   ❌ Errors: ${results.errors.length} pages`)

    if (results.created.length > 0) {
      console.log(`\n✅ Created pages: ${results.created.join(', ')}`)
    }

    if (results.existing.length > 0) {
      console.log(`\n⏭️  Existing pages: ${results.existing.join(', ')}`)
    }

    if (results.errors.length > 0) {
      console.log(`\n❌ Errors:`)
      results.errors.forEach(({ slug, error }) => {
        console.log(`   - ${slug}: ${error}`)
      })
    }

    console.log(`\n📝 Next steps:`)
    console.log(`   1. Go to Payload CMS admin panel`)
    console.log(`   2. Navigate to Pages collection`)
    console.log(`   3. Edit any page to manage its SEO`)
    console.log(`   4. Go to the SEO tab to update meta title, description, and image`)
    console.log(`\n✨ All public pages are ready for SEO management!\n`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error:', error.message)
    if (error.stack) {
      console.error(error.stack)
    }
    process.exit(1)
  }
}

createAllPages()
