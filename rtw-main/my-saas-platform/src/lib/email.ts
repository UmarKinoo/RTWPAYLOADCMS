import { Resend } from 'resend'
import {
  verificationEmailTemplate,
  welcomeEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
  employerWelcomeEmailTemplate,
} from './email-templates'

const resendApiKey = process.env.RESEND_API_KEY
const resend = resendApiKey ? new Resend(resendApiKey) : null

// Email configuration
const emailFrom = process.env.EMAIL_FROM || 'noreply@readytowork.sa'
const appUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  if (!resend) {
    console.warn('Resend API key not configured, skipping email send')
    return { success: false, error: 'Email service not configured' }
  }

  try {
    const { data, error } = await resend.emails.send({
      from: emailFrom,
      to,
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
  employerWelcomeEmailTemplate,
} from './email-templates'