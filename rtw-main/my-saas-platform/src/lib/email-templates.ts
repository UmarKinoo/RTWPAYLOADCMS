/**
 * Branded Email Templates for Ready to Work
 * 
 * All templates use brand colors and styling:
 * - Primary: #4644b8 (purple)
 * - Text: #16252d (dark)
 * - Background: #ffffff (white)
 * - Accent: #ecf2ff (light purple)
 */

import { getServerSideURL } from '@/utilities/getURL'
import { defaultLocale } from '@/i18n/config'

// Logo URL - adjust path as needed
const logoUrl = 'https://readytowork.sa/assets/03bdd9d6f0fa9e8b68944b910c59a8474fc37999.svg'
const supportEmail = process.env.SUPPORT_EMAIL || 'support@readytowork.sa'

/**
 * Get the base app URL for email links
 * Uses getServerSideURL() to ensure correct production URLs
 * Validates that we're not using localhost in production
 */
function getAppUrl(): string {
  const url = getServerSideURL()
  
  // Warn if using localhost in production (but don't break in development)
  if (process.env.NODE_ENV === 'production' && url.includes('localhost')) {
    console.warn(
      '⚠️ WARNING: Email templates are using localhost URL in production!',
      'Please set APP_URL, NEXT_PUBLIC_SERVER_URL, or NEXT_PUBLIC_APP_URL environment variable.'
    )
  }
  
  return url
}

/**
 * Base email template wrapper with branding
 */
function baseEmailTemplate(content: string, title: string): string {
  const appUrl = getAppUrl()
  
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${title}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #16252d;
      background-color: #f5f5f5;
      padding: 20px;
    }
    .email-container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .email-header {
      background: linear-gradient(135deg, #4644b8 0%, #3a3aa0 100%);
      padding: 32px 24px;
      text-align: center;
    }
    .logo {
      max-width: 200px;
      height: auto;
      margin-bottom: 16px;
    }
    .email-body {
      padding: 40px 32px;
    }
    .email-title {
      font-size: 24px;
      font-weight: 700;
      color: #16252d;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .email-content {
      font-size: 16px;
      color: #16252d;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background-color: #4644b8;
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 24px 0;
      text-align: center;
      transition: background-color 0.2s;
    }
    .button:hover {
      background-color: #3a3aa0;
    }
    .button-secondary {
      background-color: #ecf2ff;
      color: #4644b8 !important;
    }
    .button-secondary:hover {
      background-color: #dce8ff;
    }
    .link {
      color: #4644b8;
      text-decoration: underline;
      word-break: break-all;
    }
    .divider {
      height: 1px;
      background-color: #e5e5e5;
      margin: 32px 0;
    }
    .footer {
      background-color: #f9f9f9;
      padding: 24px 32px;
      text-align: center;
      font-size: 14px;
      color: #757575;
      border-top: 1px solid #e5e5e5;
    }
    .footer-links {
      margin-top: 16px;
    }
    .footer-links a {
      color: #4644b8;
      text-decoration: none;
      margin: 0 8px;
    }
    .alert {
      background-color: #fff3cd;
      border-left: 4px solid #ffc107;
      padding: 16px;
      border-radius: 4px;
      margin: 24px 0;
    }
    .alert-info {
      background-color: #e7f3ff;
      border-left-color: #4644b8;
    }
    .alert-success {
      background-color: #d4edda;
      border-left-color: #28a745;
    }
    @media only screen and (max-width: 600px) {
      .email-body {
        padding: 24px 20px;
      }
      .email-title {
        font-size: 20px;
      }
      .button {
        display: block;
        width: 100%;
      }
    }
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="${logoUrl}" alt="Ready to Work" class="logo" />
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} Ready to Work. All rights reserved.</p>
      <div class="footer-links">
        <a href="${appUrl}/${defaultLocale}/about">About Us</a> |
        <a href="${appUrl}/${defaultLocale}/contact">Contact</a> |
        <a href="${appUrl}/${defaultLocale}/privacy-policy">Privacy Policy</a>
      </div>
      <p style="margin-top: 12px; font-size: 12px;">
        If you have any questions, contact us at <a href="mailto:${supportEmail}" style="color: #4644b8;">${supportEmail}</a>
      </p>
    </div>
  </div>
</body>
</html>
  `
}

/**
 * Email verification template for new registrations
 */
export function verificationEmailTemplate(email: string, token: string, userType: 'candidate' | 'employer' = 'candidate'): string {
  const appUrl = getAppUrl()
  const verificationUrl = `${appUrl}/api/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}&type=${userType}`
  const userTypeLabel = userType === 'employer' ? 'employer' : 'candidate'
  
  const content = `
    <h1 class="email-title">Verify Your Email Address</h1>
    <p class="email-content">
      Welcome to Ready to Work! We're excited to have you join our platform.
    </p>
    <p class="email-content">
      To complete your ${userTypeLabel} account registration, please verify your email address by clicking the button below:
    </p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>
    <div class="divider"></div>
    <p class="email-content" style="font-size: 14px; color: #757575;">
      Or copy and paste this link into your browser:
    </p>
    <p class="email-content" style="font-size: 14px;">
      <a href="${verificationUrl}" class="link">${verificationUrl}</a>
    </p>
    <div class="alert alert-info">
      <strong>⏰ This verification link will expire in 24 hours.</strong>
      <p style="margin-top: 8px; font-size: 14px;">If you didn't create an account, you can safely ignore this email.</p>
    </div>
  `
  
  return baseEmailTemplate(content, 'Verify Your Email - Ready to Work')
}

/**
 * Welcome email template (sent after email verification)
 */
export function welcomeEmailTemplate(email: string, userType: 'candidate' | 'employer' = 'candidate'): string {
  const appUrl = getAppUrl()
  // Use default locale for dashboard URLs to ensure proper routing
  const dashboardUrl = userType === 'employer' 
    ? `${appUrl}/${defaultLocale}/employer/dashboard`
    : `${appUrl}/${defaultLocale}/dashboard`
  const userTypeLabel = userType === 'employer' ? 'employer' : 'candidate'
  
  const content = `
    <h1 class="email-title">Welcome to Ready to Work! 🎉</h1>
    <p class="email-content">
      Hi there,
    </p>
    <p class="email-content">
      Your email has been successfully verified! Your ${userTypeLabel} account is now fully activated and ready to use.
    </p>
    <div class="alert alert-success">
      <strong>✅ Account Verified</strong>
      <p style="margin-top: 8px; font-size: 14px;">You can now access all features of your account.</p>
    </div>
    <div style="text-align: center;">
      <a href="${dashboardUrl}" class="button">Go to Dashboard</a>
    </div>
    <div class="divider"></div>
    <p class="email-content">
      <strong>What's next?</strong>
    </p>
    <ul style="color: #16252d; line-height: 1.8; margin-left: 20px;">
      ${userType === 'employer' 
        ? '<li>Browse and search qualified candidates</li><li>Schedule interviews with top talent</li><li>Access candidate contact details</li>'
        : '<li>Complete your profile to increase visibility</li><li>Browse available job opportunities</li><li>Get matched with employers</li>'
      }
    </ul>
    <p class="email-content">
      If you have any questions, our support team is here to help!
    </p>
  `
  
  return baseEmailTemplate(content, 'Welcome to Ready to Work')
}

/**
 * Password reset email template
 */
export function passwordResetEmailTemplate(email: string, token: string, userType: 'candidate' | 'employer' = 'candidate'): string {
  const appUrl = getAppUrl()
  // Use default locale from config for proper routing (supports en/ar locales)
  const resetUrl = `${appUrl}/${defaultLocale}/reset-password?token=${token}&email=${encodeURIComponent(email)}&type=${userType}`
  
  const content = `
    <h1 class="email-title">Reset Your Password</h1>
    <p class="email-content">
      We received a request to reset your password for your Ready to Work account.
    </p>
    <p class="email-content">
      Click the button below to create a new password:
    </p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <div class="divider"></div>
    <p class="email-content" style="font-size: 14px; color: #757575;">
      Or copy and paste this link into your browser:
    </p>
    <p class="email-content" style="font-size: 14px;">
      <a href="${resetUrl}" class="link">${resetUrl}</a>
    </p>
    <div class="alert">
      <strong>⏰ This link will expire in 1 hour.</strong>
      <p style="margin-top: 8px; font-size: 14px;">
        If you didn't request a password reset, you can safely ignore this email. Your password won't be changed until you create a new one.
      </p>
    </div>
    <p class="email-content" style="font-size: 14px; color: #757575;">
      For security reasons, if you didn't make this request, please contact our support team immediately.
    </p>
  `
  
  return baseEmailTemplate(content, 'Reset Your Password - Ready to Work')
}

/**
 * Password changed confirmation email
 */
export function passwordChangedEmailTemplate(): string {
  const appUrl = getAppUrl()
  
  const content = `
    <h1 class="email-title">Password Successfully Changed</h1>
    <p class="email-content">
      This is a confirmation that your password was successfully changed.
    </p>
    <div class="alert alert-success">
      <strong>✅ Password Updated</strong>
      <p style="margin-top: 8px; font-size: 14px;">Your account is now secured with your new password.</p>
    </div>
    <div class="alert">
      <strong>🔒 Security Notice</strong>
      <p style="margin-top: 8px; font-size: 14px;">
        <strong>Didn't make this change?</strong><br/>
        If you didn't change your password, please contact our support team immediately as your account may be compromised.
      </p>
    </div>
    <p class="email-content">
      For security reasons, you may need to sign in again on your devices.
    </p>
    <div style="text-align: center; margin-top: 32px;">
      <a href="${appUrl}/${defaultLocale}/login" class="button button-secondary">Sign In</a>
    </div>
  `
  
  return baseEmailTemplate(content, 'Password Changed - Ready to Work')
}

/**
 * Employer-specific welcome email
 */
export function employerWelcomeEmailTemplate(companyName: string, responsiblePerson: string): string {
  const appUrl = getAppUrl()
  
  const content = `
    <h1 class="email-title">Welcome to Ready to Work, ${responsiblePerson}! 🎉</h1>
    <p class="email-content">
      Thank you for registering <strong>${companyName}</strong> on Ready to Work.
    </p>
    <p class="email-content">
      Your employer account is now active and ready to help you find the best talent for your team.
    </p>
    <div class="alert alert-success">
      <strong>✅ Account Ready</strong>
      <p style="margin-top: 8px; font-size: 14px;">Start exploring our pool of qualified candidates today.</p>
    </div>
    <div style="text-align: center;">
      <a href="${appUrl}/${defaultLocale}/employer/dashboard" class="button">Go to Employer Dashboard</a>
    </div>
    <div class="divider"></div>
    <p class="email-content">
      <strong>What you can do:</strong>
    </p>
    <ul style="color: #16252d; line-height: 1.8; margin-left: 20px;">
      <li>Browse thousands of qualified candidates</li>
      <li>Use advanced filters to find the perfect match</li>
      <li>Schedule interviews directly through the platform</li>
      <li>Access candidate contact details after interviews</li>
      <li>Manage your subscription and credits</li>
    </ul>
    <p class="email-content">
      Need help getting started? Check out our <a href="${appUrl}/${defaultLocale}/pricing" class="link">pricing plans</a> or contact our support team.
    </p>
  `
  
  return baseEmailTemplate(content, 'Welcome to Ready to Work')
}

export interface InterviewInvitationEmailParams {
  candidateFirstName: string
  employerName: string
  scheduledAt: string
  jobPosition?: string
  jobLocation?: string
  salary?: string
  accommodationIncluded?: boolean
  transportation?: boolean
}

/**
 * Interview invitation email sent to candidate when an interview request is approved
 */
export function interviewInvitationEmailTemplate(params: InterviewInvitationEmailParams): string {
  const appUrl = getAppUrl()
  const interviewsUrl = `${appUrl}/${defaultLocale}/dashboard/interviews`

  const scheduledDate = new Date(params.scheduledAt)
  const formattedDate = scheduledDate.toLocaleDateString('en-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
  const formattedTime = scheduledDate.toLocaleTimeString('en-SA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })

  const details: string[] = []
  if (params.jobPosition) details.push(`<strong>Position:</strong> ${params.jobPosition}`)
  if (params.jobLocation) details.push(`<strong>Location:</strong> ${params.jobLocation}`)
  if (params.salary) details.push(`<strong>Salary:</strong> ${params.salary}`)
  if (params.accommodationIncluded !== undefined) {
    details.push(`<strong>Accommodation:</strong> ${params.accommodationIncluded ? 'Included' : 'Not included'}`)
  }
  if (params.transportation !== undefined) {
    details.push(`<strong>Transportation:</strong> ${params.transportation ? 'Provided' : 'Not provided'}`)
  }
  const detailsHtml = details.length > 0
    ? `<div class="alert alert-info" style="margin: 20px 0;"><p style="margin: 0; font-size: 14px;">${details.join(' &middot; ')}</p></div>`
    : ''

  const content = `
    <h1 class="email-title">New Interview Invitation</h1>
    <p class="email-content">
      Hi ${params.candidateFirstName},
    </p>
    <p class="email-content">
      <strong>${params.employerName}</strong> has invited you to an interview via Ready to Work.
    </p>
    <div class="alert alert-success">
      <strong>📅 ${formattedDate}</strong><br/>
      <strong>🕐 ${formattedTime}</strong>
    </div>
    ${detailsHtml}
    <p class="email-content">
      Log in to your dashboard to view full details, accept or decline, and manage your interviews.
    </p>
    <div style="text-align: center;">
      <a href="${interviewsUrl}" class="button">View interview in dashboard</a>
    </div>
    <div class="divider"></div>
    <p class="email-content" style="font-size: 14px; color: #757575;">
      You're also receiving an in-app notification. If you have any questions, contact our support team.
    </p>
  `

  return baseEmailTemplate(content, 'New Interview Invitation - Ready to Work')
}
