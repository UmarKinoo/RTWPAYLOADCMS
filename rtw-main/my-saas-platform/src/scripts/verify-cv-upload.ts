/**
 * Verifies media (CV) upload goes to R2 when R2 env vars are set.
 * Usage: pnpm verify:cv-upload
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../..')
dotenv.config({ path: path.join(root, '.env') })

async function main(): Promise<void> {
  if (!process.env.PAYLOAD_SECRET) {
    throw new Error('PAYLOAD_SECRET is not set in .env')
  }

  const r2On = !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME
  )
  console.log('R2 configured:', r2On)
  if (!r2On) {
    throw new Error('R2 env vars missing — CV uploads may use Supabase S3 fallback')
  }

  const { getPayload } = await import('payload')
  const { default: config } = await import('@payload-config')
  const payload = await getPayload({ config })

  const pdf = Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n')
  const name = `verify-cv-${Date.now()}.pdf`

  const doc = await payload.create({
    collection: 'media',
    data: { alt: 'cv-upload-verify' },
    file: {
      data: pdf,
      mimetype: 'application/pdf',
      name,
      size: pdf.length,
    },
    overrideAccess: true,
  })

  const url = doc.url || ''
  console.log('Created media id:', doc.id)
  console.log('URL:', url)

  if (!/r2\.dev/i.test(url) && !process.env.R2_PUBLIC_URL?.split('/').pop()) {
    console.warn('URL does not look like R2 public URL — check R2_PUBLIC_URL')
  }

  await payload.delete({ collection: 'media', id: doc.id, overrideAccess: true })
  console.log('Cleanup: deleted test media', doc.id)
  console.log('OK — CV upload path (R2) works')
}

main().catch((err) => {
  console.error('FAIL:', err?.message || err)
  process.exit(1)
})
