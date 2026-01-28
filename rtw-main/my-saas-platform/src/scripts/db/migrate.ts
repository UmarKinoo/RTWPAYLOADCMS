/**
 * Enterprise migration runner: custom SQL (supabase/migrations) then Payload migrations.
 * Uses DATABASE_URI. Tracks custom SQL in app_migrations table.
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
const ENSURE_TABLE_SQL = path.join(
  __dirname,
  'ensure-app-migrations-table.sql',
)

function getCustomMigrationFiles(): string[] {
  if (!fs.existsSync(SUPABASE_MIGRATIONS_DIR)) {
    return []
  }
  const files = fs.readdirSync(SUPABASE_MIGRATIONS_DIR).filter((f) => f.endsWith('.sql'))
  return files.sort()
}

async function runCustomMigrations(pool: Pool): Promise<{ run: number; skipped: number }> {
  const ensureSql = fs.readFileSync(ENSURE_TABLE_SQL, 'utf-8')
  await pool.query(ensureSql)

  const { rows: applied } = await pool.query<{ name: string }>(
    'SELECT name FROM app_migrations ORDER BY name',
  )
  const appliedSet = new Set(applied.map((r) => r.name))

  const files = getCustomMigrationFiles()
  let run = 0
  let skipped = 0

  for (const file of files) {
    const name = file
    if (appliedSet.has(name)) {
      skipped += 1
      continue
    }
    const filePath = path.join(SUPABASE_MIGRATIONS_DIR, file)
    const sql = fs.readFileSync(filePath, 'utf-8')
    await pool.query('BEGIN')
    try {
      await pool.query(sql)
      await pool.query('INSERT INTO app_migrations (name) VALUES ($1)', [name])
      await pool.query('COMMIT')
      run += 1
      console.log(`  ✅ ${name}`)
    } catch (err) {
      await pool.query('ROLLBACK')
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`  ❌ ${name}: ${msg}`)
      throw err
    }
  }

  return { run, skipped }
}

function runPayloadMigrate(): void {
  console.log('\n📦 Running Payload migrations...')
  execSync('pnpm payload migrate', {
    stdio: 'inherit',
    cwd: root,
    env: { ...process.env, NODE_OPTIONS: '--no-deprecation' },
  })
}

async function main(): Promise<void> {
  console.log('\n🔄 db:migrate — custom SQL then Payload\n')

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
    console.log('📂 Custom SQL migrations (supabase/migrations)...')
    const { run, skipped } = await runCustomMigrations(pool)
    console.log(`   Applied: ${run}, already applied: ${skipped}`)
    runPayloadMigrate()
    console.log('\n✅ db:migrate complete.\n')
  } catch (err) {
    console.error(err)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
