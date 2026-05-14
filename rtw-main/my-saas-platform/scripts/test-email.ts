/**
 * Test Email Sending Script
 * 
 * This script tests email sending functionality with Resend.
 * Run with: npx tsx scripts/test-email.ts
 * 
 * Make sure RESEND_API_KEY is set in your .env file
 */

import { Resend } from 'resend'
import { verificationEmailTemplate, passwordResetEmailTemplate, welcomeEmailTemplate } from '../src/lib/email-templates'
import { getResendFromHeader } from '../src/lib/email-from'

const resendApiKey = process.env.RESEND_API_KEY
const recipientEmail = process.env.TEST_EMAIL || 'test@example.com'

if (!resendApiKey) {
  console.error('❌ RESEND_API_KEY is not set in environment variables')
  process.exit(1)
}

const resend = new Resend(resendApiKey)
const emailFrom = getResendFromHeader()

async function testEmail() {
  console.log('📧 Testing email sending...\n')
  console.log(`From: ${emailFrom}`)
  console.log(`To: ${recipientEmail}\n`)

  // Test 1: Verification Email
  console.log('1️⃣ Testing verification email...')
  try {
    const verificationHtml = verificationEmailTemplate(recipientEmail, 'test-token-123', 'candidate')
    const result1 = await resend.emails.send({
      from: emailFrom,
      to: recipientEmail,
      subject: 'Test: Verify Your Email - Ready to Work',
      html: verificationHtml,
    })
    console.log('✅ Verification email sent:', result1.data?.id || 'Success')
  } catch (error) {
    console.error('❌ Verification email failed:', error)
  }

  console.log('\n')

  // Test 2: Password Reset Email
  console.log('2️⃣ Testing password reset email...')
  try {
    const resetHtml = passwordResetEmailTemplate(recipientEmail, 'test-reset-token-456', 'employer')
    const result2 = await resend.emails.send({
      from: emailFrom,
      to: recipientEmail,
      subject: 'Test: Reset Your Password - Ready to Work',
      html: resetHtml,
    })
    console.log('✅ Password reset email sent:', result2.data?.id || 'Success')
  } catch (error) {
    console.error('❌ Password reset email failed:', error)
  }

  console.log('\n')

  // Test 3: Welcome Email
  console.log('3️⃣ Testing welcome email...')
  try {
    const welcomeHtml = welcomeEmailTemplate(recipientEmail, 'candidate')
    const result3 = await resend.emails.send({
      from: emailFrom,
      to: recipientEmail,
      subject: 'Test: Welcome to Ready to Work',
      html: welcomeHtml,
    })
    console.log('✅ Welcome email sent:', result3.data?.id || 'Success')
  } catch (error) {
    console.error('❌ Welcome email failed:', error)
  }

  console.log('\n✅ Email testing complete!')
  console.log(`Check your inbox at ${recipientEmail}`)
}

testEmail().catch(console.error)


