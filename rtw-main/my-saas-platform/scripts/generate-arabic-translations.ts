import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import OpenAI from 'openai'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: join(process.cwd(), '.env') })

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

async function translateObject(obj: any, path: string = ''): Promise<any> {
  if (typeof obj === 'string') {
    // Translate string value
    try {
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content:
              'You are a professional translator. Translate the following English text to Modern Standard Arabic. Preserve all interpolation variables like {name}, {count}, etc. exactly as they appear. Keep brand names unchanged (ReadyToWork, Payload, Supabase, OHIP, etc.). Return only the Arabic translation without any explanations or additional text.',
          },
          {
            role: 'user',
            content: obj,
          },
        ],
        temperature: 0.3,
      })

      const translated = response.choices[0]?.message?.content?.trim() || obj
      console.log(`  ✓ ${path}: "${obj}" → "${translated}"`)
      return translated
    } catch (error) {
      console.error(`  ✗ Error translating ${path}:`, error)
      return obj // Return original on error
    }
  } else if (Array.isArray(obj)) {
    // Translate array items
    return Promise.all(obj.map((item, index) => translateObject(item, `${path}[${index}]`)))
  } else if (obj !== null && typeof obj === 'object') {
    // Recursively translate object properties
    const translated: any = {}
    for (const [key, value] of Object.entries(obj)) {
      const newPath = path ? `${path}.${key}` : key
      translated[key] = await translateObject(value, newPath)
      // Small delay to avoid rate limits
      await new Promise((resolve) => setTimeout(resolve, 100))
    }
    return translated
  }
  return obj
}

async function generateArabicTranslations() {
  console.log('🌐 Starting Arabic translation generation...\n')

  const messagesDir = join(process.cwd(), 'messages')
  const enPath = join(messagesDir, 'en.json')
  const arPath = join(messagesDir, 'ar.json')

  try {
    // Read English translations
    console.log('📖 Reading English translations...')
    const enContent = readFileSync(enPath, 'utf-8')
    const enTranslations = JSON.parse(enContent)
    console.log(`✅ Loaded ${Object.keys(enTranslations).length} top-level keys\n`)

    // Translate to Arabic
    console.log('🔄 Translating to Modern Standard Arabic...\n')
    const arTranslations = await translateObject(enTranslations)

    // Write Arabic translations
    console.log('\n💾 Writing Arabic translations...')
    writeFileSync(arPath, JSON.stringify(arTranslations, null, 2), 'utf-8')
    console.log(`✅ Arabic translations saved to ${arPath}\n`)

    console.log('✨ Translation complete!')
  } catch (error) {
    console.error('❌ Error generating translations:', error)
    process.exit(1)
  }
}

generateArabicTranslations()







