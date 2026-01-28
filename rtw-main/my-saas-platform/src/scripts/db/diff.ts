/**
 * db:diff — deterministic schema dump for drift detection.
 * Dumps public schema (tables, columns, indexes) in sorted order; optional compare to baseline.
 * Uses DATABASE_URI. CI can fail if diff is non-empty (drift).
 */
import dotenv from 'dotenv'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { Pool } from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(__dirname, '../../..')
const SNAPSHOT_FILE = path.join(root, '.schema-snapshot.txt')

dotenv.config({ path: path.join(root, '.env') })

const DATABASE_URI =
  process.env.DATABASE_URI || process.env.DATABASE_URL || ''

async function dumpSchema(pool: Pool): Promise<string> {
  const lines: string[] = []

  const tables = await pool.query<{ tablename: string }>(`
    SELECT tablename FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename
  `)
  for (const { tablename } of tables.rows) {
    lines.push(`TABLE: ${tablename}`)
    const cols = await pool.query<{ column_name: string; data_type: string; is_nullable: string }>(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `, [tablename])
    for (const c of cols.rows) {
      lines.push(`  COLUMN: ${c.column_name} ${c.data_type} ${c.is_nullable}`)
    }
    const idx = await pool.query<{ indexname: string }>(`
      SELECT indexname FROM pg_indexes
      WHERE schemaname = 'public' AND tablename = $1
      ORDER BY indexname
    `, [tablename])
    for (const i of idx.rows) {
      lines.push(`  INDEX: ${i.indexname}`)
    }
    lines.push('')
  }

  return lines.join('\n')
}

async function main(): Promise<void> {
  const writeSnapshot = process.argv.includes('--write') || process.argv.includes('-w')

  if (!DATABASE_URI) {
    console.error('❌ DATABASE_URI (or DATABASE_URL) is not set')
    process.exit(1)
  }

  const pool = new Pool({
    connectionString: DATABASE_URI,
    ssl: DATABASE_URI.includes('localhost') ? undefined : { rejectUnauthorized: false },
  })

  try {
    const schema = await dumpSchema(pool)
    await pool.end()

    if (writeSnapshot) {
      fs.writeFileSync(SNAPSHOT_FILE, schema, 'utf-8')
      console.log(`\n✅ Schema snapshot written to ${path.relative(root, SNAPSHOT_FILE)}\n`)
      return
    }

    if (fs.existsSync(SNAPSHOT_FILE)) {
      const baseline = fs.readFileSync(SNAPSHOT_FILE, 'utf-8')
      if (schema !== baseline) {
        console.log('\n⚠️  Schema drift detected (current DB vs .schema-snapshot.txt):\n')
        const baselineLines = baseline.split('\n')
        const currentLines = schema.split('\n')
        const maxLen = Math.max(baselineLines.length, currentLines.length)
        for (let i = 0; i < maxLen; i++) {
          const b = baselineLines[i] ?? '(deleted)'
          const c = currentLines[i] ?? '(deleted)'
          if (b !== c) {
            console.log(`  ${i + 1}: - ${b}`)
            console.log(`      + ${c}`)
          }
        }
        console.log('\n  Update baseline: pnpm db:diff --write\n')
        process.exit(1)
      }
      console.log('\n✅ No schema drift (matches .schema-snapshot.txt)\n')
      return
    }

    console.log('\n📄 Current schema (no baseline found; run `pnpm db:diff --write` to create):\n')
    console.log(schema)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
