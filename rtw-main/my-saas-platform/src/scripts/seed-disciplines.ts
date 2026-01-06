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

/**
 * Optional: Map specific discipline names to display order and highlight status
 * This is only used if you want to set custom ordering/highlighting for homepage display.
 * If a discipline exists in DB but not in this map, it will use default values (displayOrder: 0, isHighlighted: false)
 */
const DISCIPLINE_DISPLAY_CONFIG: Record<string, { displayOrder: number; isHighlighted: boolean }> = {
  'Agriculture & Farm Services': { displayOrder: 1, isHighlighted: false },
  'Construction': { displayOrder: 2, isHighlighted: false },
  'Housekeeping & Home Services': { displayOrder: 3, isHighlighted: false },
  'Events & Hospitality': { displayOrder: 4, isHighlighted: false },
  'Business': { displayOrder: 5, isHighlighted: false },
  'Education': { displayOrder: 6, isHighlighted: false },
  'IT': { displayOrder: 7, isHighlighted: false },
  'Facility Management': { displayOrder: 8, isHighlighted: false },
  'Cafe & Restaurant': { displayOrder: 9, isHighlighted: false },
  'Entertainment & Leisure': { displayOrder: 10, isHighlighted: false },
  'Healthcare': { displayOrder: 11, isHighlighted: false },
  'Industrial & Logistic': { displayOrder: 12, isHighlighted: false },
  'Lifestyle & Personal Care': { displayOrder: 13, isHighlighted: false },
  'Retail': { displayOrder: 14, isHighlighted: true },
  'Mechanical & Auto Repair': { displayOrder: 15, isHighlighted: false },
  'Sustainability & Waste': { displayOrder: 16, isHighlighted: false },
  'Media & Visualization': { displayOrder: 17, isHighlighted: false },
  'Transport & Vehicle': { displayOrder: 18, isHighlighted: false },
}

/**
 * Generate slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Seed disciplines collection
 * This script updates existing disciplines with new fields (slug, displayOrder, isHighlighted)
 * or creates them if they don't exist yet.
 */
async function seedDisciplines() {
  console.log('🌱 Starting disciplines seed...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  // Dynamically import config after env vars are loaded
  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    // Get all existing disciplines from DB
    const allDisciplines = await payload.find({
      collection: 'disciplines',
      limit: 1000,
    })

    let updated = 0
    let skipped = 0

    // Update existing disciplines with new fields (slug, displayOrder, isHighlighted, name_en)
    for (const discipline of allDisciplines.docs) {
      const config = DISCIPLINE_DISPLAY_CONFIG[discipline.name]
      const slug = discipline.slug || generateSlug(discipline.name)
      
      // Use config if available, otherwise keep existing values or use defaults
      const displayOrder = config?.displayOrder ?? discipline.displayOrder ?? 0
      const isHighlighted = config?.isHighlighted ?? discipline.isHighlighted ?? false
      
      // Set name_en if not already set (use name as fallback)
      const nameEn = discipline.name_en || discipline.name || ''

      // Only update if something changed
      const needsUpdate =
        discipline.slug !== slug ||
        discipline.displayOrder !== displayOrder ||
        discipline.isHighlighted !== isHighlighted ||
        (!discipline.name_en && discipline.name)

      if (needsUpdate) {
        const updateData: any = {
          slug: slug,
          displayOrder: displayOrder,
          isHighlighted: isHighlighted,
        }

        // Set name_en if it's not already set
        if (!discipline.name_en && discipline.name) {
          updateData.name_en = discipline.name
        }

        await payload.update({
          collection: 'disciplines',
          id: discipline.id,
          data: updateData,
        })
        updated++
        console.log(`  ✅ Updated: ${discipline.name} (order: ${displayOrder}, highlighted: ${isHighlighted}${!discipline.name_en ? ', set name_en' : ''})`)
      } else {
        skipped++
        console.log(`  ⏭️  Skipped: ${discipline.name} (already up to date)`)
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total disciplines in DB: ${allDisciplines.docs.length}`)
    console.log(`   Updated: ${updated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`\n✅ Disciplines update completed successfully!`)
    console.log(`\n💡 Note: This script only updates existing disciplines with new fields.`)
    console.log(`   Disciplines are created when you run 'pnpm seed:skills' from the CSV.`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error seeding disciplines:', error)
    process.exit(1)
  }
}

// Run the seed
seedDisciplines()

