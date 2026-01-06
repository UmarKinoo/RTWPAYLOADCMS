/**
 * Optimize Contact Hero Image
 * Converts the contact hero PNG to WebP format under 100KB
 */

import sharp from 'sharp'
import * as fs from 'fs'
import * as path from 'path'

const INPUT_FILE = 'public/assets/72a7dc683281a0bfe193c81609cc3ea29e31fd5b.png'
const OUTPUT_FILE = 'public/assets/72a7dc683281a0bfe193c81609cc3ea29e31fd5b.webp'
const MAX_WIDTH = 1920
const MAX_FILE_SIZE = 100 * 1024 // 100KB
const INITIAL_QUALITY = 75
const MIN_QUALITY = 20

async function optimizeContactHero() {
  console.log('🖼️  Optimizing Contact Hero Image')
  console.log('================================')
  console.log(`Input:  ${INPUT_FILE}`)
  console.log(`Output: ${OUTPUT_FILE}`)
  console.log(`Max size: ${MAX_FILE_SIZE / 1024}KB\n`)

  if (!fs.existsSync(INPUT_FILE)) {
    console.error(`❌ Input file not found: ${INPUT_FILE}`)
    process.exit(1)
  }

  try {
    const metadata = await sharp(INPUT_FILE).metadata()
    const originalWidth = metadata.width || 0
    const originalSize = fs.statSync(INPUT_FILE).size

    console.log(`Original: ${(originalSize / 1024 / 1024).toFixed(2)}MB (${originalWidth}x${metadata.height})`)

    let quality = INITIAL_QUALITY
    let outputSize = Infinity
    let currentWidth = Math.min(originalWidth, MAX_WIDTH)

    // Step 1: Try with quality reduction
    while (outputSize > MAX_FILE_SIZE && quality >= MIN_QUALITY) {
      let pipeline = sharp(INPUT_FILE)

      if (originalWidth > MAX_WIDTH) {
        pipeline = pipeline.resize(currentWidth, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
      }

      await pipeline
        .webp({ quality, effort: 6 })
        .toFile(OUTPUT_FILE)

      outputSize = fs.statSync(OUTPUT_FILE).size

      if (outputSize > MAX_FILE_SIZE) {
        quality -= 10
      }
    }

    // Step 2: If still too large, reduce dimensions
    if (outputSize > MAX_FILE_SIZE) {
      currentWidth = Math.min(originalWidth, MAX_WIDTH)
      
      while (outputSize > MAX_FILE_SIZE && currentWidth > 400) {
        currentWidth = Math.floor(currentWidth * 0.8)
        
        await sharp(INPUT_FILE)
          .resize(currentWidth, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: MIN_QUALITY, effort: 6 })
          .toFile(OUTPUT_FILE)

        outputSize = fs.statSync(OUTPUT_FILE).size
      }
    }

    const finalSize = fs.statSync(OUTPUT_FILE).size
    const savings = ((1 - finalSize / originalSize) * 100).toFixed(1)
    const finalQuality = quality < MIN_QUALITY ? MIN_QUALITY : quality

    console.log(`\n✅ Optimization complete!`)
    console.log(`   Size: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(finalSize / 1024).toFixed(2)}KB`)
    console.log(`   Savings: ${savings}%`)
    console.log(`   Quality: ${finalQuality}`)
    console.log(`   Width: ${currentWidth}px`)
    
    if (finalSize > MAX_FILE_SIZE) {
      console.log(`\n⚠️  Warning: File size (${(finalSize / 1024).toFixed(2)}KB) exceeds ${MAX_FILE_SIZE / 1024}KB limit`)
    } else {
      console.log(`\n✨ File is under ${MAX_FILE_SIZE / 1024}KB limit!`)
    }
  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

optimizeContactHero()







