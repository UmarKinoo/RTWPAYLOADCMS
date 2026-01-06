/**
 * Batch Image Optimization Script
 *
 * Resizes images to max width 1920px (maintains aspect ratio)
 * Converts to WebP format with quality 75
 * Processes JPG, JPEG, PNG files
 * Outputs to /optimized folder preserving folder structure
 *
 * Usage: pnpm optimize:images
 */

import sharp from 'sharp'
import { glob } from 'glob'
import * as fs from 'fs'
import * as path from 'path'

// Configuration
const INPUT_DIR = 'public/assets'
const OUTPUT_DIR = 'public/assets-optimized'
const MAX_WIDTH = 1920
const INITIAL_QUALITY = 75
const MIN_QUALITY = 20
const MAX_FILE_SIZE = 100 * 1024 // 100KB in bytes
const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png']

// Stats tracking
let processedCount = 0
let skippedCount = 0
let errorCount = 0

async function ensureDir(dir: string): Promise<void> {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
}

async function optimizeImage(inputPath: string): Promise<void> {
  const relativePath = path.relative(INPUT_DIR, inputPath)
  const parsedPath = path.parse(relativePath)
  const outputRelativePath = path.join(parsedPath.dir, `${parsedPath.name}.webp`)
  const outputPath = path.join(OUTPUT_DIR, outputRelativePath)

  try {
    // Ensure output directory exists (for nested folders)
    await ensureDir(path.dirname(outputPath))

    // Get image metadata
    const metadata = await sharp(inputPath).metadata()
    const originalWidth = metadata.width || 0

    const inputStats = fs.statSync(inputPath)
    let quality = INITIAL_QUALITY
    let outputSize = Infinity
    let attempts = 0

    // Progressively reduce quality until file is under MAX_FILE_SIZE
    while (outputSize > MAX_FILE_SIZE && quality >= MIN_QUALITY) {
      attempts++

      // Build sharp pipeline
      let pipeline = sharp(inputPath)

      // Resize only if width > MAX_WIDTH
      if (originalWidth > MAX_WIDTH) {
        pipeline = pipeline.resize(MAX_WIDTH, null, {
          withoutEnlargement: true,
          fit: 'inside',
        })
      }

      // Convert to WebP and strip metadata
      await pipeline
        .webp({ quality })
        .toFile(outputPath)

      outputSize = fs.statSync(outputPath).size

      // If still too large, reduce quality
      if (outputSize > MAX_FILE_SIZE) {
        quality -= 10
      }
    }

    // If still over limit after all attempts, resize more aggressively
    if (outputSize > MAX_FILE_SIZE) {
      let currentWidth = Math.min(originalWidth, MAX_WIDTH)
      
      while (outputSize > MAX_FILE_SIZE && currentWidth > 400) {
        currentWidth = Math.floor(currentWidth * 0.8) // Reduce by 20%
        attempts++

        await sharp(inputPath)
          .resize(currentWidth, null, {
            withoutEnlargement: true,
            fit: 'inside',
          })
          .webp({ quality: MIN_QUALITY })
          .toFile(outputPath)

        outputSize = fs.statSync(outputPath).size
      }
    }

    const outputStats = fs.statSync(outputPath)
    const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1)
    const finalQuality = quality < MIN_QUALITY ? MIN_QUALITY : quality

    const sizeWarning = outputStats.size > MAX_FILE_SIZE ? ' ⚠️ OVER LIMIT' : ''

    console.log(
      `✓ ${relativePath} → ${outputRelativePath} ` +
        `(${formatBytes(inputStats.size)} → ${formatBytes(outputStats.size)}, -${savings}%, q=${finalQuality})${sizeWarning}`,
    )
    processedCount++
  } catch (error) {
    console.error(`✗ Error processing ${inputPath}:`, error instanceof Error ? error.message : error)
    errorCount++
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i]
}

async function main(): Promise<void> {
  console.log('🖼️  Image Optimization Script')
  console.log('================================')
  console.log(`Input directory:  ./${INPUT_DIR}`)
  console.log(`Output directory: ./${OUTPUT_DIR}`)
  console.log(`Max width:        ${MAX_WIDTH}px`)
  console.log(`Max file size:    ${formatBytes(MAX_FILE_SIZE)}`)
  console.log(`Quality range:    ${MIN_QUALITY}-${INITIAL_QUALITY}`)
  console.log(`Formats:          ${SUPPORTED_EXTENSIONS.join(', ')}`)
  console.log('================================\n')

  // Check if input directory exists
  if (!fs.existsSync(INPUT_DIR)) {
    console.log(`📁 Creating input directory: ./${INPUT_DIR}`)
    await ensureDir(INPUT_DIR)
    console.log(`\n⚠️  No images found. Place images in ./${INPUT_DIR} and run again.`)
    return
  }

  // Ensure output directory exists
  await ensureDir(OUTPUT_DIR)

  // Find all supported images (including nested folders)
  const patterns = SUPPORTED_EXTENSIONS.map((ext) => `${INPUT_DIR}/**/*${ext}`)
  const allPatterns = patterns.join(',')
  const files = await glob(`{${allPatterns}}`, { nocase: true })

  if (files.length === 0) {
    console.log(`⚠️  No images found in ./${INPUT_DIR}`)
    console.log(`   Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`)
    return
  }

  console.log(`Found ${files.length} image(s) to process...\n`)

  // Process each image
  for (const file of files) {
    const ext = path.extname(file).toLowerCase()
    if (!SUPPORTED_EXTENSIONS.includes(ext)) {
      console.log(`⊘ Skipping unsupported file: ${file}`)
      skippedCount++
      continue
    }
    await optimizeImage(file)
  }

  // Summary
  console.log('\n================================')
  console.log('📊 Summary')
  console.log('================================')
  console.log(`✓ Processed: ${processedCount}`)
  console.log(`⊘ Skipped:   ${skippedCount}`)
  console.log(`✗ Errors:    ${errorCount}`)
  console.log(`\n✨ Optimized images saved to ./${OUTPUT_DIR}`)
}

// Run the script
main().catch((error) => {
  console.error('Fatal error:', error)
  process.exit(1)
})

