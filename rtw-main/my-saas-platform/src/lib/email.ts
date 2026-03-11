import { Resend } from 'resend'
import {
  verificationEmailTemplate,
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  invitationEmailTemplate,
  invitationEmailTemplatePayloadReset,
  invitationEmailTemplateAcceptInvitation,
  employerWelcomeEmailTemplate,
} from './email-templates'

export { invitationEmailTemplatePayloadReset, invitationEmailTemplateAcceptInvitation }

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Email configuration
const emailFrom = process.env.EMAIL_FROM || 'noreply@readytowork.sa'

export interface EmailOptions {
  /** Single email, comma-separated string, or array of addresses. */
  to: string | string[]
  subject: string
  html: string
}

/** Normalize to an array of trimmed email addresses (supports comma-separated string). */
function normalizeToAddresses(to: string | string[]): string[] {
  if (Array.isArray(to)) {
    return to.map((e) => String(e).trim()).filter(Boolean)
  }
  return String(to)
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send')
    return { success: false, error: 'Email service not configured' }
  }

  const toList = normalizeToAddresses(to)
  if (toList.length === 0) {
    console.warn('sendEmail: no valid recipient addresses')
    return { success: false, error: 'No valid recipient addresses' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to: toList,
      subject,
      html,
    })

    if (error) {
      console.error('Resend API error:', error)
      return { 
        success: false, 
        error: typeof error === 'string' ? error : error.message || 'Failed to send email' 
      }
    }

    return { success: true, data }
  } catch (error) {
    console.error('Failed to send email:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

// Re-export templates from email-templates.ts
export {
  verificationEmailTemplate,
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  invitationEmailTemplate,
  employerWelcomeEmailTemplate,
} from './email-templates'