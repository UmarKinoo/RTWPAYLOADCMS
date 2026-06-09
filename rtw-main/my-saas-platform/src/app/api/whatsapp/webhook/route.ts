import { NextRequest, NextResponse } from 'next/server'
import { getReadyBotPayload } from '@/readybot/lib/getReadyBotPayload'
import {
  findCandidateByWhatsAppNumber,
  saveCandidateMessage,
  type ReadyBotPayloadContext,
} from '@/readybot/tools/payloadTool'
import { runInboundReplyWorkflow } from '@/readybot/workflows/inboundReplyWorkflow'
import { isReadyBotEnabled } from '@/lib/readybot/isReadyBotEnabled'

export async function GET(request: NextRequest) {
  if (!isReadyBotEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }
  const mode = request.nextUrl.searchParams.get('hub.mode')
  const token = request.nextUrl.searchParams.get('hub.verify_token')
  const challenge = request.nextUrl.searchParams.get('hub.challenge')
  const verifyToken = process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN

  if (mode === 'subscribe' && token && verifyToken && token === verifyToken && challenge) {
    return new NextResponse(challenge, { status: 200 })
  }
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

type WaMessage = {
  from: string
  id: string
  type: string
  text?: { body: string }
  image?: { id: string; mime_type?: string }
  document?: { id: string; mime_type?: string; filename?: string }
}

async function extractTextFromWhatsAppMedia(mediaId: string): Promise<string | null> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const openaiKey = process.env.READYBOT_LLM_API_KEY || process.env.OPENAI_API_KEY
  if (!token || !openaiKey) return null

  // Step 1: get media URL from Meta
  const metaRes = await fetch(`https://graph.facebook.com/v25.0/${mediaId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!metaRes.ok) return null
  const { url } = await metaRes.json() as { url: string }

  // Step 2: download the image
  const imgRes = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
  if (!imgRes.ok) return null
  const buffer = await imgRes.arrayBuffer()
  const base64 = Buffer.from(buffer).toString('base64')
  const mimeType = imgRes.headers.get('content-type') || 'image/jpeg'

  // Step 3: send to GPT-4o Vision
  const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openaiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64}` } },
            { type: 'text', text: 'Extract all text from this image. If there is no text, describe what you see briefly.' },
          ],
        },
      ],
      max_tokens: 500,
    }),
  })
  if (!openaiRes.ok) return null
  const openaiData = await openaiRes.json() as { choices?: { message?: { content?: string } }[] }
  return openaiData.choices?.[0]?.message?.content ?? null
}

async function sendWhatsAppReply(to: string, body: string): Promise<void> {
  const token = process.env.WHATSAPP_ACCESS_TOKEN
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID
  if (!token || !phoneId) return
  await fetch(`https://graph.facebook.com/v25.0/${phoneId}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: body.slice(0, 4096) },
    }),
  })
}

function extractInboundMessages(body: unknown): WaMessage[] {
  const messages: WaMessage[] = []
  const entries = (body as { entry?: unknown[] })?.entry ?? []
  for (const entry of entries) {
    const changes = (entry as { changes?: unknown[] })?.changes ?? []
    for (const change of changes) {
      const value = (change as { value?: { messages?: WaMessage[] } })?.value
      if (value?.messages) messages.push(...value.messages)
    }
  }
  return messages
}

export async function POST(request: NextRequest) {
  if (!isReadyBotEnabled()) {
    return NextResponse.json({ received: true }, { status: 200 })
  }
  try {
    const body = await request.json()
    const payload = await getReadyBotPayload()
    const ctx: ReadyBotPayloadContext = { payload }

    const inbound = extractInboundMessages(body)
    for (const msg of inbound) {
      // Image / document — extract text and reply (test feature)
      if (msg.type === 'image' || msg.type === 'document') {
        const mediaId = msg.image?.id ?? msg.document?.id
        if (mediaId) {
          void (async () => {
            const extracted = await extractTextFromWhatsAppMedia(mediaId)
            if (extracted) {
              await sendWhatsAppReply(msg.from, `📄 Extracted:\n\n${extracted}`)
            } else {
              await sendWhatsAppReply(msg.from, '⚠️ Could not extract text from that image.')
            }
          })()
        }
        continue
      }

      if (msg.type !== 'text' || !msg.text?.body) continue
      const from = msg.from
      const candidate = await findCandidateByWhatsAppNumber(ctx, from)
      if (!candidate) {
        console.warn('[ReadyBot] Inbound from unknown number:', from)
        continue
      }

      void runInboundReplyWorkflow({
        candidateId: candidate.id,
        replyText: msg.text.body,
        externalMessageId: msg.id,
        fromPhone: from,
        rawPayload: body,
      }).catch((err) => console.error('[ReadyBot inbound]', err))
    }

    return NextResponse.json({ received: true }, { status: 200 })
  } catch (e) {
    console.error('[ReadyBot webhook]', e)
    return NextResponse.json({ received: true }, { status: 200 })
  }
}
