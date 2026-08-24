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

/** Old slug → new slug for in-place rename during seed */
const SLUG_RENAMES: Record<string, string> = {
  skilled: 'basic',
  specialty: 'standard',
  'elite-specialty': 'premium',
}

const PLANS = [
  {
    slug: 'basic',
    title: 'Basic',
    title_en: 'Basic',
    title_ar: 'أساسي',
    price: 350,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 7,
      contactUnlockCreditsGranted: 1,
      basicFilters: true,
      nationalityRestriction: 'NONE' as const,
      isCustom: false,
      unlimitedInterviews: false,
      validityDays: 30,
    },
  },
  {
    slug: 'standard',
    title: 'Standard',
    title_en: 'Standard',
    title_ar: 'قياسي',
    price: 450,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 0,
      contactUnlockCreditsGranted: 2,
      basicFilters: true,
      nationalityRestriction: 'NONE' as const,
      isCustom: false,
      unlimitedInterviews: true,
      validityDays: 30,
    },
  },
  {
    slug: 'premium',
    title: 'Premium',
    title_en: 'Premium',
    title_ar: 'مميز',
    price: 600,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 0,
      contactUnlockCreditsGranted: 3,
      basicFilters: true,
      nationalityRestriction: 'NONE' as const,
      isCustom: false,
      unlimitedInterviews: true,
      validityDays: 30,
    },
  },
  {
    slug: 'custom',
    title: 'Business',
    title_en: 'Business',
    title_ar: 'أعمال',
    price: null,
    currency: 'SAR',
    entitlements: {
      interviewCreditsGranted: 0,
      contactUnlockCreditsGranted: 0,
      basicFilters: false,
      nationalityRestriction: 'NONE' as const,
      isCustom: true,
      unlimitedInterviews: false,
      validityDays: 30,
    },
  },
]

async function findPlanBySlug(payload: Awaited<ReturnType<typeof getPayload>>, slug: string) {
  const existing = await payload.find({
    collection: 'plans',
    where: { slug: { equals: slug } },
    limit: 1,
  })
  return existing.docs[0] ?? null
}

async function seedPlans() {
  console.log('🌱 Starting plans seeding...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    let created = 0
    let updated = 0
    let deleted = 0
    let skipped = 0

    // Rename legacy slugs in place (preserves plan IDs referenced by employers/purchases)
    for (const [oldSlug, newSlug] of Object.entries(SLUG_RENAMES)) {
      const oldPlan = await findPlanBySlug(payload, oldSlug)
      if (!oldPlan) continue
      const conflict = await findPlanBySlug(payload, newSlug)
      if (conflict) {
        console.log(`⊘ Skip rename ${oldSlug} → ${newSlug} (target already exists); deleting old`)
        await payload.delete({
          collection: 'plans',
          id: oldPlan.id,
          context: { disableRevalidate: true },
        })
        deleted++
        continue
      }
      await payload.update({
        collection: 'plans',
        id: oldPlan.id,
        data: { slug: newSlug },
        context: { disableRevalidate: true },
      })
      console.log(`✓ Renamed plan slug: ${oldSlug} → ${newSlug}`)
    }

    // Remove Saudi / top-picks plan
    const saudiPlan = await findPlanBySlug(payload, 'top-picks')
    if (saudiPlan) {
      await payload.delete({
        collection: 'plans',
        id: saudiPlan.id,
        context: { disableRevalidate: true },
      })
      console.log('✓ Deleted plan: top-picks (Saudi Nationals)')
      deleted++
    }

    for (const planData of PLANS) {
      try {
        const existingPlan = await findPlanBySlug(payload, planData.slug)

        if (existingPlan) {
          await payload.update({
            collection: 'plans',
            id: existingPlan.id,
            data: {
              title: planData.title,
              title_en: planData.title_en,
              title_ar: planData.title_ar,
              price: planData.price,
              currency: planData.currency,
              entitlements: planData.entitlements,
            },
            context: {
              disableRevalidate: true,
            },
          })
          console.log(`✓ Updated plan: ${planData.slug}`)
          updated++
        } else {
          await payload.create({
            collection: 'plans',
            data: planData,
            context: {
              disableRevalidate: true,
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
    console.log(`✓ Deleted: ${deleted}`)
    console.log(`⊘ Skipped: ${skipped}`)
    console.log('\n✨ Plans seeding completed!\n')
  } catch (error) {
    console.error('❌ Error seeding plans:', error)
    process.exit(1)
  }
}

seedPlans().catch(console.error)
