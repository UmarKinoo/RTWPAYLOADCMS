// IMPORTANT: Load environment variables FIRST
import dotenv from 'dotenv'
import path from 'path'
import OpenAI from 'openai'

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

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ Error: OPENAI_API_KEY is not set')
  process.exit(1)
}

// Now dynamically import config and Payload after env vars are loaded
import { getPayload } from 'payload'

// Dynamic import of config to ensure env vars are loaded first
const configPromise = import('@payload-config')

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Translate name to Arabic using OpenAI
 */
async function translateToArabic(text: string, itemType: string = 'job skill'): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following English text into Modern Standard Arabic.
          This is a ${itemType} name, so keep it concise and professional.
          Do not translate brand names or technical terms that are commonly used in Arabic as-is.
          Return only the Arabic translation, nothing else.`,
        },
        { role: 'user', content: text },
      ],
      temperature: 0.3,
    })
    return completion.choices[0].message.content?.trim() || text
  } catch (error) {
    console.error(`Error translating "${text}":`, error)
    return text
  }
}

/**
 * Translate a collection (categories, subcategories, or skills)
 */
async function translateCollection(
  payload: any,
  collectionName: 'categories' | 'subcategories' | 'skills',
  itemType: string
) {
  console.log(`\n📋 Translating ${collectionName}...`)
  
  const allItems = await payload.find({
    collection: collectionName,
    limit: 10000, // Skills can be many
  })

  console.log(`   Found ${allItems.docs.length} ${collectionName} to translate\n`)

  let translated = 0
  let skipped = 0
  let errors = 0

  for (const item of allItems.docs) {
    const englishName = item.name_en || item.name || ''
    
    if (!englishName) {
      console.log(`  ⚠️  Skipping: ${collectionName} ${item.id} has no name`)
      skipped++
      continue
    }

    // Skip if Arabic translation already exists
    if (item.name_ar) {
      skipped++
      // Only log every 10th skipped item to avoid spam
      if (skipped % 10 === 0) {
        console.log(`  ⏭️  Skipped ${skipped} items (Arabic already exists)...`)
      }
      continue
    }

    try {
      // Only log every 10th translation to avoid spam for large collections
      if (translated % 10 === 0 || translated === 0) {
        console.log(`  🔄 Translating: "${englishName}"... (${translated + 1}/${allItems.docs.length})`)
      }
      
      const arabicName = await translateToArabic(englishName, itemType)
      
      // Update item with name_en (if not set) and name_ar
      const updateData: any = {
        name_ar: arabicName,
      }

      // Set name_en if it's not already set (use name as fallback)
      if (!item.name_en && item.name) {
        updateData.name_en = item.name
      }

      await payload.update({
        collection: collectionName,
        id: item.id,
        data: updateData,
      })

      if (translated % 10 === 0 || translated < 5) {
        console.log(`  ✅ Translated: "${englishName}" → "${arabicName}"`)
      }
      translated++

      // Small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    } catch (error: any) {
      console.error(`  ❌ Error translating "${englishName}":`, error.message)
      errors++
    }
  }

  console.log(`\n📊 ${collectionName} Summary:`)
  console.log(`   Total: ${allItems.docs.length}`)
  console.log(`   Translated: ${translated}`)
  console.log(`   Skipped: ${skipped}`)
  console.log(`   Errors: ${errors}`)

  return { translated, skipped, errors, total: allItems.docs.length }
}

/**
 * Generate Arabic translations for categories, subcategories, and skills
 */
async function translateSkills() {
  console.log('🌐 Starting skills, categories, and subcategories translation...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log(`🔑 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    // Translate in order: categories -> subcategories -> skills
    // This ensures parent items are translated before children
    
    const categoriesResult = await translateCollection(payload, 'categories', 'job category')
    const subcategoriesResult = await translateCollection(payload, 'subcategories', 'job subcategory')
    const skillsResult = await translateCollection(payload, 'skills', 'job skill')

    console.log(`\n\n🎉 Overall Summary:`)
    console.log(`   Categories: ${categoriesResult.translated} translated, ${categoriesResult.skipped} skipped, ${categoriesResult.errors} errors`)
    console.log(`   Subcategories: ${subcategoriesResult.translated} translated, ${subcategoriesResult.skipped} skipped, ${subcategoriesResult.errors} errors`)
    console.log(`   Skills: ${skillsResult.translated} translated, ${skillsResult.skipped} skipped, ${skillsResult.errors} errors`)
    console.log(`\n✅ Translation completed!`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the translation
translateSkills()
