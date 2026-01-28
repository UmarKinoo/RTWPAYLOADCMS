/**
 * db:status — show pending custom SQL migrations and Payload migration status.
 * Uses DATABASE_URI.
 */
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'
import { execSync } from 'node:child_process'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')

dotenv.config({ path: path.join(root, '.env') })

const DATABASE_URI =
  process.env.DATABASE_URI || process.env.DATABASE_URL || ''

const SUPABASE_MIGRATIONS_DIR = path.join(root, 'supabase', 'migrations')

function getCustomMigrationFiles(): string[] {
  if (!fs.existsSync(SUPABASE_MIGRATIONS_DIR)) {
    return []
  }
  const files = fs.readdirSync(SUPABASE_MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'))
  return files.sort()
}

async function getAppliedCustomMigrations(pool: Pool): Promise<Set<string>> {
  try {
    const { rows } = await pool.query<{ name: string }>(
      'SELECT name FROM app_migrations ORDER BY name',
    )
    return new Set(rows.map((r) => r.name))
  } catch {
    return new Set()
  }
}

function runPayloadMigrateStatus(): string {
  try {
    return execSync('pnpm payload migrate:status', {
      encoding: 'utf-8',
      cwd: root,
      env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
    })
  } catch (err: unknown) {
    const out = (err as { stdout?: string })?.stdout
    return out ?? String(err)
  }
}

async function main(): Promise<void> {
  console.log('\n📋 db:status — migration status\n')

  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI (or DATABASE_URL) is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: DATABASE_URI.includes('localhost') ? undefined : { rejectUnauthorized: false },
  })

  try {
    await pool.query('SELECT 1')

    const files = getCustomMigrationFiles()
    const applied = await getAppliedCustomMigrations(pool)
    const pending = files.filter((f) => !applied.has(f))

    console.log('📂 Custom SQL (supabase/migrations):')
    console.log(`   Total files: ${files.length}, applied: ${applied.size}, pending: ${pending.length}`)
    if (pending.length > 0) {
      pending.forEach((f) => console.log(`   ⏳ ${f}`))
    }

    console.log('\n📦 Payload migrations:')
    console.log(runPayloadMigrateStatus())

    if (pending.length > 0) {
      console.log('\n⚠️  Run `pnpm db:migrate` to apply pending custom SQL, then Payload will run on next db:migrate.')
    }
    console.log('')
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
