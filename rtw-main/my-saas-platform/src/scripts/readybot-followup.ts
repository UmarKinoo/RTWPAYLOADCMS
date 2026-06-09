import dotenv from 'dotenv'
import path from 'node:path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

async function main() {
  const { runFollowUpWorkflow } = await import('../readybot/workflows/followUpWorkflow')
  console.log(await runFollowUpWorkflow())
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
