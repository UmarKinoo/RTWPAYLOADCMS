import type { EmailAdapter } from 'payload'
import { Resend } from 'resend'

const resendApiKey = process.env.RESEND_API_KEY
const emailFrom = process.env.EMAIL_FROM || 'noreply@readytowork.sa'

// Log email adapter initialization
if (resendApiKey) {
  console.log('[Payload Email] Resend email adapter initialized successfully')
} else {
  console.warn('[Payload Email] WARNING: RESEND_API_KEY not set. Email functionality will not work.')
}

/**
 * Custom email adapter for Payload CMS using Resend
 * This allows Payload's built-in forgot password feature to work
 * 
 * NOTE: This file is currently not used - we're using @payloadcms/email-resend directly
 * Keeping this file for reference or future use if needed
 */
export const resendEmailAdapter: EmailAdapter = {
  defaultFromAddress: emailFrom,
  defaultFromName: 'Ready to Work',
  
  async sendEmail(email) {
    // If Resend is not configured, log and return early
    // Payload will handle the "not configured" message
    if (!resendApiKey) {
      console.warn('[Payload Email] Resend API key not configured. Set RESEND_API_KEY environment variable.')
      console.warn('[Payload Email] Email details:', { to: email.to, subject: email.subject })
      // Return a minimal response to indicate the email was "attempted" but not sent
      return { id: 'not-configured' }
    }

    const resend = new Resend(resendApiKey)

    try {
      // Helper function to extract email address from various formats
      const extractEmail = (addr: string | { address: string; name?: string }): string => {
        if (typeof addr === 'string') {
          return addr
        }
        return addr.address
      }

      // Extract 'to' addresses - can be string, object, or array
      let toAddresses: string[]
      if (Array.isArray(email.to)) {
        toAddresses = email.to.map(extractEmail)
      } else {
        toAddresses = [extractEmail(email.to)]
      }

      // Extract 'from' address
      const fromAddress = email.from 
        ? (typeof email.from === 'string' ? email.from : email.from.address)
        : emailFrom

      // Extract subject and body
      const subject = email.subject || ''
      const html = email.html || email.text || ''
      const text = email.text || ''

      const { data, error } = await resend.emails.send({
        from: fromAddress,
        to: toAddresses,
        subject,
        html: html || undefined,
        text: text || undefined,
      })

      if (error) {
        console.error('[Payload Email] Resend API error:', error)
        throw new Error(typeof error === 'string' ? error : error.message || 'Failed to send email')
      }

      return {
        id: data?.id || 'unknown',
      }
    } catch (error) {
      console.error('[Payload Email] Failed to send email:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      throw new Error(`Failed to send email: ${errorMessage}`)
    }
  },
}

