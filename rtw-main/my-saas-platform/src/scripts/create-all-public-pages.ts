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

// Public pages configuration
const publicPages = [
  {
    slug: 'home',
    title: 'Home',
    meta: {
      title: 'Saudi Talent Sourcing Agency & Portal | Ready to Work',
      description:
        'Connect with verified talent and top employers in Saudi Arabia. Ready to Work is your trusted talent sourcing agency for hiring and career opportunities.',
    },
  },
  {
    slug: 'about',
    title: 'About Us',
    meta: {
      title: 'Saudi Recruitment Portal | Talent Hiring & Jobs in KSA',
      description: 'A Saudi recruitment portal connecting employers with verified talent and supporting candidates with genuine job opportunities across Saudi Arabia.',
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
      title: 'Expatriate Jobs in Saudi Arabia – Find Top Opportunities',
      description: 'Browse expatriate jobs in Saudi Arabia with Ready to Work. Connect with top employers and grow your career with relevant, long-term opportunities.',
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
            hero: {
              type: 'none',
            },
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
          },
          draft: false,
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
