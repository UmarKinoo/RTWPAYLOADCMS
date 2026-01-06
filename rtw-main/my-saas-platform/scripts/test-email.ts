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

const resendApiKey = process.env.RESEND_API_KEY
const testEmail = process.env.TEST_EMAIL || 'test@example.com'

if (!resendApiKey) {
  console.error('❌ RESEND_API_KEY is not set in environment variables')
  process.exit(1)
}

const resend = new Resend(resendApiKey)
const emailFrom = process.env.EMAIL_FROM || 'noreply@readytowork.sa'

async function testEmail() {
  console.log('📧 Testing email sending...\n')
  console.log(`From: ${emailFrom}`)
  console.log(`To: ${testEmail}\n`)

  // Test 1: Verification Email
  console.log('1️⃣ Testing verification email...')
  try {
    const verificationHtml = verificationEmailTemplate(testEmail, 'test-token-123', 'candidate')
    const result1 = await resend.emails.send({
      from: emailFrom,
      to: testEmail,
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
    const resetHtml = passwordResetEmailTemplate(testEmail, 'test-reset-token-456', 'employer')
    const result2 = await resend.emails.send({
      from: emailFrom,
      to: testEmail,
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
    const welcomeHtml = welcomeEmailTemplate(testEmail, 'candidate')
    const result3 = await resend.emails.send({
      from: emailFrom,
      to: testEmail,
      subject: 'Test: Welcome to Ready to Work',
      html: welcomeHtml,
    })
    console.log('✅ Welcome email sent:', result3.data?.id || 'Success')
  } catch (error) {
    console.error('❌ Welcome email failed:', error)
  }

  console.log('\n✅ Email testing complete!')
  console.log(`Check your inbox at ${testEmail}`)
}

testEmail().catch(console.error)


