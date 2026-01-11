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
 * Translate discipline name to Arabic using OpenAI
 */
async function translateToArabic(text: string): Promise<string> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a professional translator. Translate the following English text into Modern Standard Arabic.
          This is a job category/discipline name, so keep it concise and professional.
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
 * Generate Arabic translations for all disciplines
 */
async function translateDisciplines() {
  console.log('🌐 Starting discipline translation...')
  console.log(`📁 Environment loaded from: ${envPath}`)
  console.log(`🔑 PAYLOAD_SECRET: ${process.env.PAYLOAD_SECRET ? '✅ Set' : '❌ Missing'}`)
  console.log(`🔑 OPENAI_API_KEY: ${process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing'}`)
  console.log('⏳ Initializing Payload (this may take a moment on first run)...\n')

  const config = await configPromise
  console.log('📦 Config loaded, connecting to database...')

  try {
    const payload = await getPayload({ config: config.default })
    console.log('✅ Payload initialized successfully!\n')

    // Get all disciplines
    const allDisciplines = await payload.find({
      collection: 'disciplines',
      limit: 1000,
    })

    console.log(`📋 Found ${allDisciplines.docs.length} disciplines to translate\n`)

    let translated = 0
    let skipped = 0
    let errors = 0

    for (const discipline of allDisciplines.docs) {
      const englishName = discipline.name_en || discipline.name || ''
      
      if (!englishName) {
        console.log(`  ⚠️  Skipping: Discipline ${discipline.id} has no name`)
        skipped++
        continue
      }

      // Skip if Arabic translation already exists
      if (discipline.name_ar) {
        console.log(`  ⏭️  Skipped: ${englishName} (Arabic already exists: ${discipline.name_ar})`)
        skipped++
        continue
      }

      try {
        console.log(`  🔄 Translating: "${englishName}"...`)
        const arabicName = await translateToArabic(englishName)
        
        // Update discipline with name_en (if not set) and name_ar
        const updateData: any = {
          name_ar: arabicName,
        }

        // Set name_en if it's not already set (use name as fallback)
        if (!discipline.name_en && discipline.name) {
          updateData.name_en = discipline.name
        }

        await payload.update({
          collection: 'disciplines',
          id: discipline.id,
          data: updateData,
        })

        console.log(`  ✅ Translated: "${englishName}" → "${arabicName}"`)
        translated++

        // Small delay to avoid rate limiting
        await new Promise((resolve) => setTimeout(resolve, 500))
      } catch (error: any) {
        console.error(`  ❌ Error translating "${englishName}":`, error.message)
        errors++
      }
    }

    console.log(`\n📊 Summary:`)
    console.log(`   Total disciplines: ${allDisciplines.docs.length}`)
    console.log(`   Translated: ${translated}`)
    console.log(`   Skipped: ${skipped}`)
    console.log(`   Errors: ${errors}`)
    console.log(`\n✅ Translation completed!`)

    process.exit(0)
  } catch (error: any) {
    console.error('❌ Error:', error)
    process.exit(1)
  }
}

// Run the translation
translateDisciplines()







