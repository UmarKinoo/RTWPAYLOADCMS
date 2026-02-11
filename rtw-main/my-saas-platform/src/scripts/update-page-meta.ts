/**
 * Update meta title and description for existing Pages in Payload CMS.
 *
 * Usage:
 *   Local only:   pnpm run update:page-meta
 *   Local + Prod: PROD_DATABASE_URI="postgresql://..." pnpm run update:page-meta
 *   Prod only:    DATABASE_URI="postgresql://..." pnpm run update:page-meta:prod
 *
 * Set the prod DB URL in the terminal for that run; no need to put it in .env.
 */
import { spawn } from 'child_process'
import dotenv from 'dotenv'
import path from 'path'
import { getPayload } from 'payload'

const envPath = path.resolve(process.cwd(), '.env')
// Save vars set in terminal (so .env does not overwrite them when --prod-only)
const isProdOnly = process.argv.includes('--prod-only')
const terminalDbUri =
  process.env.DATABASE_URI || process.env.PROD_DATABASE_URI || process.env.PROD_DB_URI || process.env.PRODUCTION_DATABASE_URI

dotenv.config({ path: envPath })

if (!process.env.PAYLOAD_SECRET) {
  console.error('❌ Error: PAYLOAD_SECRET is not set')
  process.exit(1)
}

const PROD_DB_URI =
  process.env.PROD_DATABASE_URI || process.env.PROD_DB_URI || process.env.PRODUCTION_DATABASE_URI

if (isProdOnly) {
  const dbUri = terminalDbUri || PROD_DB_URI || process.env.DATABASE_URI
  if (!dbUri) {
    console.error('❌ Set prod DB in terminal, e.g. DATABASE_URI="postgresql://..." pnpm run update:page-meta:prod')
    process.exit(1)
  }
  process.env.DATABASE_URI = dbUri
  // Prevent Payload from running schema push when connecting to prod (data-only script; use migrations for schema)
  process.env.PAYLOAD_DISABLE_PUSH = '1'
}

const configPromise = import('@payload-config')

const pageMetaUpdates: { slug: string; meta: { title: string; description: string } }[] = [
  {
    slug: 'home',
    meta: {
      title: 'Saudi Talent Sourcing Agency & Portal | Ready to Work',
      description:
        'Connect with verified talent and top employers in Saudi Arabia. Ready to Work is your trusted talent sourcing agency for hiring and career opportunities.',
    },
  },
  {
    slug: 'about',
    meta: {
      title: 'Saudi Recruitment Portal | Talent Hiring & Jobs in KSA',
      description:
        'A Saudi recruitment portal connecting employers with verified talent and supporting candidates with genuine job opportunities across Saudi Arabia.',
    },
  },
  {
    slug: 'candidates',
    meta: {
      title: 'Expatriate Jobs in Saudi Arabia – Find Top Opportunities',
      description:
        'Browse expatriate jobs in Saudi Arabia with Ready to Work. Connect with top employers and grow your career with relevant, long-term opportunities.',
    },
  },
]

async function runUpdates(payload: Awaited<ReturnType<typeof getPayload>>) {
  for (const { slug, meta } of pageMetaUpdates) {
    try {
      const result = await payload.find({
        collection: 'pages',
        where: { slug: { equals: slug } },
        limit: 1,
      })
      const page = result.docs[0]
      if (!page) {
        console.log(`   ⏭️  "${slug}" not found, skipping.`)
        continue
      }
      const existingMeta = (page.meta as Record<string, unknown>) || {}
      await payload.update({
        collection: 'pages',
        id: page.id,
        data: {
          meta: {
            ...existingMeta,
            title: meta.title,
            description: meta.description,
          },
        },
      })
      console.log(`   ✅ "${slug}" meta updated.`)
    } catch (error: any) {
      console.error(`   ❌ "${slug}":`, error.message)
    }
  }
}

async function updatePageMeta() {
  const label = isProdOnly ? 'Production' : 'Local'
  console.log(`📝 Updating page meta (title & description) — ${label}...`)
  console.log(`📁 Environment: ${envPath}\n`)

  const config = await configPromise
  console.log(`⏳ Initializing Payload (${label})...`)
  const payload = await getPayload({ config: config.default })
  console.log(`✅ Connected to ${label}.\n`)
  await runUpdates(payload)
  console.log('')

  if (!isProdOnly && PROD_DB_URI) {
    if (
      PROD_DB_URI.includes('localhost') ||
      PROD_DB_URI.includes('127.0.0.1') ||
      PROD_DB_URI.includes('54322')
    ) {
      console.error('❌ PROD_DATABASE_URI looks like a local database. Skipping prod run.')
    } else {
      console.log('☁️  Running same updates on production DB (spawning child)...\n')
      const child = spawn('pnpm', ['run', 'update:page-meta', '--', '--prod-only'], {
        stdio: 'inherit',
        env: process.env,
        cwd: process.cwd(),
        shell: true,
      })
      child.on('close', (code) => {
        process.exit(code ?? 0)
      })
      return
    }
  }

  if (!isProdOnly && !PROD_DB_URI) {
    console.log('ℹ️  To also update production: set PROD_DATABASE_URI in the terminal for this run.')
    console.log('   Example: PROD_DATABASE_URI="postgresql://..." pnpm run update:page-meta')
    console.log('   Or prod only: DATABASE_URI="postgresql://..." pnpm run update:page-meta:prod\n')
  }

  console.log('✨ Done. Check the Pages collection in Payload admin to verify.\n')
  process.exit(0)
}

updatePageMeta().catch((err) => {
  console.error('❌ Fatal:', err)
  process.exit(1)
})
