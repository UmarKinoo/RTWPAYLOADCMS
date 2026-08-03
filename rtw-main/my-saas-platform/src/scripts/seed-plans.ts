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

// Verify PAYLOAD_SECRET is loaded
if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ Error: PAYLOAD_SECRET is not set')
  console.error(`   Checked .env file at: ${envPath}`)
  process.exit(1)
}

// Now dynamically import config and Payload after env vars are loaded
import { getPayload } from 'payload'

// Dynamic import of config to ensure env vars are loaded first
const configPromise = import('@payload-config')

const PLANS = [
  {
    slug: 'skilled',
    title: 'Skilled',
    price: 350,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 5,
      contactUnlockCreditsGranted: 1,
      basicFilters: true,
      nationalityRestriction: 'NONE' as 'NONE' | 'SAUDI',
      isCustom: false,
    },
  },
  {
    slug: 'specialty',
    title: 'Specialty',
    price: 450,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 5,
      contactUnlockCreditsGranted: 1,
      basicFilters: true,
      nationalityRestriction: 'NONE' as 'NONE' | 'SAUDI',
      isCustom: false,
    },
  },
  {
    slug: 'elite-specialty',
    title: 'Elite Specialty',
    price: 600,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 5,
      contactUnlockCreditsGranted: 1,
      basicFilters: true,
      nationalityRestriction: 'NONE' as 'NONE' | 'SAUDI',
      isCustom: false,
    },
  },
  {
    slug: 'top-picks',
    title: 'Saudi Nationals',
    price: 700,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 5,
      contactUnlockCreditsGranted: 1,
      basicFilters: true,
      nationalityRestriction: 'SAUDI' as 'NONE' | 'SAUDI',
      isCustom: false,
    },
  },
  {
    slug: 'custom',
    title: 'Business',
    price: null,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 0,
      contactUnlockCreditsGranted: 0,
      basicFilters: false,
      nationalityRestriction: 'NONE' as 'NONE' | 'SAUDI',
      isCustom: true,
    },
  },
]

async function seedPlans() {
  console.log('🌱 Starting plans seeding...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  // Dynamically import config after env vars are loaded
  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    let created = 0
    let updated = 0
    let skipped = 0

    for (const planData of PLANS) {
      try {
        // Check if plan already exists by slug
        const existing = await payload.find({
          collection: 'plans',
          where: {
            slug: {
              equals: planData.slug,
            },
          },
          limit: 1,
        })

        if (existing.docs.length > 0) {
          // Update existing plan
          const existingPlan = existing.docs[0]
          await payload.update({
            collection: 'plans',
            id: existingPlan.id,
            data: {
              title: planData.title,
              price: planData.price,
              currency: planData.currency,
              entitlements: planData.entitlements,
            },
            context: {
              disableRevalidate: true, // Disable revalidation during seeding
            },
          })
          console.log(`✓ Updated plan: ${planData.slug}`)
          updated++
        } else {
          // Create new plan
          await payload.create({
            collection: 'plans',
            data: planData,
            context: {
              disableRevalidate: true, // Disable revalidation during seeding
            },
          })
          console.log(`✓ Created plan: ${planData.slug}`)
          created++
        }
      } catch (error) {
        console.error(`✗ Error processing plan ${planData.slug}:`, error)
        skipped++
      }
    }

    console.log('\n================================')
    console.log('📊 Summary')
    console.log('================================')
    console.log(`✓ Created: ${created}`)
    console.log(`✓ Updated: ${updated}`)
    console.log(`⊘ Skipped: ${skipped}`)
    console.log('\n✨ Plans seeding completed!\n')
  } catch (error) {
    console.error('❌ Error seeding plans:', error)
    process.exit(1)
  }
}

seedPlans().catch(console.error)

