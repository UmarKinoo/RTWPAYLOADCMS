/**
 * Phase 1: scan candidates and create screening tasks (no WhatsApp send until Phase 2).
 * Usage: pnpm readybot:scan
 */
import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

// Terminal step-by-step logs (set READYBOT_VERBOSE=0 to silence)
if (process.env.READYBOT_VERBOSE == null) process.env.READYBOT_VERBOSE = '1'

async function main() {
  console.log('[ReadyBot] Starting scan (verbose terminal logging on; READYBOT_VERBOSE=0 to silence)\n')
  const { scanIncompleteCandidates } = await import('../trigger/scanIncompleteCandidates')
  const result = await scanIncompleteCandidates()
  console.log('\n[ReadyBot] Scan complete:', JSON.stringify(result, null, 2))
  if (result.errors.length) {
    console.error('\n[ReadyBot] Errors:')
    for (const line of result.errors) console.error(`  - ${line}`)
    process.exitCode = 1
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
