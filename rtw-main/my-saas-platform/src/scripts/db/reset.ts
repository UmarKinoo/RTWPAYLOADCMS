/**
 * db:reset — rebuild local DB from migrations (LOCAL ONLY).
 * Refuses to run if DATABASE_URI looks like production.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')

dotenv.config({ path: path.join(root, '.env') })

const DATABASE_URI =
  process.env.DATABASE_URI || process.env.DATABASE_URL || ''

function isLocalUri(uri: string): boolean {
  if (!uri) return false
  const u = uri.toLowerCase()
  return (
    u.includes('localhost') ||
    u.includes('127.0.0.1') ||
    u.includes('54322') ||
    (u.includes(':5432') && u.includes('local'))
  )
}

async function main(): Promise<void> {
  console.log('\n🔄 db:reset — local only\n')

  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI (or DATABASE_URL) is not set')
    process.exit(1)
  }

  if (!isLocalUri(DATABASE_URI)) {
    console.error('❌ DATABASE_URI looks like PRODUCTION. db:reset is allowed only for local DB.')
    console.error('   Use a local connection string (localhost, 127.0.0.1, or port 54322).')
    process.exit(1)
  }

  const { execSync } = await import('node:child_process')

  console.log('1. Running Payload migrate:fresh (drops and re-runs Payload migrations)...')
  execSync('pnpm payload migrate:fresh', {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  })

  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: undefined,
  })
  try {
    await pool.query('DROP TABLE IF EXISTS app_migrations')
  } finally {
    await pool.end()
  }

  console.log('\n2. Running db:migrate (custom SQL + Payload migrate)...')
  execSync('pnpm db:migrate', {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  })

  console.log('\n✅ db:reset complete. Local DB rebuilt from migrations.\n')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
