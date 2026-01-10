/**
 * Taqnyat SMS Service
 * Server-only module for sending SMS via Taqnyat API
 */

if (typeof window !== 'undefined') {
  throw new Error('taqnyat.ts cannot be imported in client-side code')
}

const TAQNYAT_BEARER_TOKEN = process.env.TAQNYAT_BEARER_TOKEN
const TAQNYAT_SENDER = process.env.TAQNYAT_SENDER

export interface SendSMSOptions {
  phone: string
  message: string
}

export interface SendSMSResult {
  success: boolean
  error?: string
  messageId?: string
}

/**
 * Normalize phone number to E.164 format
 * Supports any country code (E.164 format)
 * For Saudi numbers without country code, assumes +966
 * 
 * Examples:
 * - "+23057494627" → "+23057494627" (Mauritius)
 * - "+966501234567" → "+966501234567" (Saudi Arabia)
 * - "966501234567" → "+966501234567" (Saudi Arabia)
 * - "0501234567" → "+966501234567" (Saudi Arabia, local format)
 * - "501234567" → "+966501234567" (Saudi Arabia, mobile)
 */
export function normalizePhone(phone: string): string {
  if (!phone) {
    throw new Error('Phone number is required')
  }

  // Remove all non-digit characters except +
  let cleaned = phone.replace(/[^\d+]/g, '')

  // If already in E.164 format (starts with +), validate and return
  if (cleaned.startsWith('+')) {
    // E.164 format: +[country code][number]
    // Country codes are 1-3 digits, total length should be 8-15 digits (excluding +)
    const digitsOnly = cleaned.substring(1) // Remove the +
    if (digitsOnly.length < 7 || digitsOnly.length > 15) {
      throw new Error(`Invalid phone number length: ${phone}. E.164 numbers should be 8-15 digits after the country code.`)
    }
    return cleaned
  }

  // If starts with country code without +, add +
  // Check for common country codes (1-3 digits)
  if (cleaned.match(/^(1|2[0-9]|3[0-9]|4[0-9]|5[0-9]|6[0-9]|7[0-9]|8[0-9]|9[0-9])/)) {
    // Has country code, add +
    if (cleaned.length >= 8 && cleaned.length <= 15) {
      return `+${cleaned}`
    }
  }

  // Saudi Arabia specific handling (for backward compatibility)
  // If starts with 966, add +
  if (cleaned.startsWith('966')) {
    if (cleaned.length >= 12 && cleaned.length <= 13) {
      return `+${cleaned}`
    }
  }

  // If starts with 0, assume Saudi local format, replace with +966
  if (cleaned.startsWith('0')) {
    const withoutZero = cleaned.substring(1)
    if (withoutZero.length >= 8 && withoutZero.length <= 9) {
      return `+966${withoutZero}`
    }
  }

  // If starts with 5 and 8-9 digits, assume Saudi mobile, add +966
  if (cleaned.startsWith('5') && cleaned.length >= 8 && cleaned.length <= 9) {
    return `+966${cleaned}`
  }

  // If 8-9 digits and no country code, assume Saudi and add +966 (for backward compatibility)
  if (cleaned.length >= 8 && cleaned.length <= 9) {
    return `+966${cleaned}`
  }

  throw new Error(`Invalid phone number format: ${phone}. Please use E.164 format (e.g., +23057494627 for Mauritius or +966501234567 for Saudi Arabia).`)
}

/**
 * Send SMS via Taqnyat API
 */
export async function sendSMS({ phone, message }: SendSMSOptions): Promise<SendSMSResult> {
  if (!TAQNYAT_BEARER_TOKEN) {
    console.error('TAQNYAT_BEARER_TOKEN is not set')
    return {
      success: false,
      error: 'SMS service not configured',
    }
  }

  if (!TAQNYAT_SENDER) {
    console.error('TAQNYAT_SENDER is not set')
    return {
      success: false,
      error: 'SMS sender not configured',
    }
  }

  try {
    const normalizedPhone = normalizePhone(phone)

    const response = await fetch('https://api.taqnyat.sa/v1/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${TAQNYAT_BEARER_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sender: TAQNYAT_SENDER,
        body: message,
        recipients: [normalizedPhone],
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Taqnyat API error: ${response.status} ${errorText}`)
    }

    const data = await response.json()

    console.log('[Taqnyat SMS] Sent successfully:', {
      phone: normalizedPhone,
      messageId: data.id || data.messageId,
    })

    return {
      success: true,
      messageId: data.id || data.messageId,
    }
  } catch (error: any) {
    console.error('[Taqnyat SMS] Error sending SMS:', {
      phone,
      error: error.message,
    })

    return {
      success: false,
      error: error.message || 'Failed to send SMS',
    }
  }
}

