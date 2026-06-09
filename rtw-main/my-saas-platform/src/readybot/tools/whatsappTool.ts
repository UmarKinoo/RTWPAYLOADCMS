/**
 * WhatsApp Cloud API (Meta Graph). Optional: Secreto31126/whatsapp-api-js as wrapper later.
 */

const GRAPH = 'https://graph.facebook.com/v21.0'

export type SendWhatsAppTemplateInput = {
  to: string
  templateName: string
  languageCode?: string
  components?: unknown[]
}

export type SendWhatsAppMessageInput = {
  to: string
  body: string
}

function normalizeE164(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  return digits
}

export function isWhatsAppConfigured(): boolean {
  return !!(
    process.env.WHATSAPP_ACCESS_TOKEN &&
    process.env.WHATSAPP_PHONE_NUMBER_ID
  )
}

async function postWhatsApp(body: Record<string, unknown>) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN!
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID!
  const res = await fetch(`${GRAPH}/${phoneId}/messages`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const json = (await res.json()) as {
    messages?: { id: string }[]
    error?: { message: string }
  }
  if (!res.ok) {
    return { success: false as const, error: json.error?.message || res.statusText }
  }
  return {
    success: true as const,
    externalMessageId: json.messages?.[0]?.id,
  }
}

export async function sendWhatsAppTemplate(input: SendWhatsAppTemplateInput): Promise<{
  success: boolean
  externalMessageId?: string
  error?: string
}> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp Cloud API not configured' }
  }
  return postWhatsApp({
    messaging_product: 'whatsapp',
    to: normalizeE164(input.to),
    type: 'template',
    template: {
      name: input.templateName,
      language: { code: input.languageCode || 'en' },
      components: input.components,
    },
  })
}

export async function sendWhatsAppMessage(input: SendWhatsAppMessageInput): Promise<{
  success: boolean
  externalMessageId?: string
  error?: string
}> {
  if (!isWhatsAppConfigured()) {
    return { success: false, error: 'WhatsApp Cloud API not configured' }
  }
  return postWhatsApp({
    messaging_product: 'whatsapp',
    to: normalizeE164(input.to),
    type: 'text',
    text: { body: input.body.slice(0, 4096) },
  })
}
