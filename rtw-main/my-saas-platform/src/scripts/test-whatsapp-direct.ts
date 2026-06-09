/**
 * Send a WhatsApp template directly without running a scan.
 * Usage: pnpm tsx src/scripts/test-whatsapp-direct.ts
 */
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.resolve(__dirname, '../../.env') })

const PHONE = '23057494627'
const TEMPLATE = process.env.READYBOT_WHATSAPP_TEMPLATE_NAME || 'hello_world'
const TOKEN = process.env.WHATSAPP_ACCESS_TOKEN!
const PHONE_ID = process.env.WHATSAPP_PHONE_NUMBER_ID!

if (!TOKEN || !PHONE_ID) {
  console.error('Missing WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID in .env')
  process.exit(1)
}

console.log(`\n[Outbound → +${PHONE}] Sending template: ${TEMPLATE}`)
console.log(`  Phone ID: ${PHONE_ID}`)
console.log(`  Token:    ${TOKEN.slice(0, 20)}...\n`)

const res = await fetch(`https://graph.facebook.com/v21.0/${PHONE_ID}/messages`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${TOKEN}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    messaging_product: 'whatsapp',
    to: PHONE,
    type: 'template',
    template: {
      name: TEMPLATE,
      language: { code: 'en_US' },
      components: [
        {
          type: 'body',
          parameters: [{ type: 'text', text: 'Umar' }],
        },
      ],
    },
  }),
})

const json = await res.json() as Record<string, unknown>

if (!res.ok) {
  console.error('[Outbound FAILED]', JSON.stringify(json, null, 2))
  process.exit(1)
}

const msgId = (json.messages as { id: string }[])?.[0]?.id
console.log(`[Outbound ✓] Message sent! ID: ${msgId}`)
console.log(`\nCheck your WhatsApp on +${PHONE} 📱\n`)
