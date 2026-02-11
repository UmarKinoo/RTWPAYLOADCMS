/**
 * Converts the Ready to Work logo from SVG to PNG for use in email templates.
 * Many email clients (Gmail, Outlook, etc.) don't display SVG; PNG is widely supported.
 *
 * Run: pnpm exec tsx scripts/svg-to-png-email-logo.ts
 * Output: public/assets/logo-email.png
 */

import sharp from 'sharp'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '..')
const svgPath = path.join(root, 'public', 'assets', '03bdd9d6f0fa9e8b68944b910c59a8474fc37999.svg')
const pngPath = path.join(root, 'public', 'assets', 'logo-email.png')

async function main() {
  if (!fs.existsSync(svgPath)) {
    console.error('SVG not found:', svgPath)
    process.exit(1)
  }
  const svgBuffer = fs.readFileSync(svgPath)
  await sharp(svgBuffer)
    .resize(400) // 2x for retina; display at 200px in emails
    .png()
    .toFile(pngPath)
  console.log('Created:', pngPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
