/**
 * POST /api/otp/start
 * Generate OTP and send SMS
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { generateOTP, generateSalt, hashOTP, getOTPTTL, getResendThrottleSeconds, canResendOTP } from '@/server/otp/utils'
import { sendSMS, normalizePhone } from '@/server/sms/taqnyat'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, userId, userCollection } = body

    // Validate phone
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    // Normalize phone number
    let normalizedPhone: string
    try {
      normalizedPhone = normalizePhone(phone)
    } catch (error: any) {
      return NextResponse.json(
        { ok: false, error: error.message || 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })

    // Check for existing verification record
    const existingVerifications = await payload.find({
      collection: 'phone-verifications',
      where: {
        and: [
          { phone: { equals: normalizedPhone } },
          { verifiedAt: { exists: false } }, // Not yet verified
        ],
      },
      limit: 1,
      sort: '-createdAt',
    })

    let verificationRecord = existingVerifications.docs[0] || null

    // Check throttle (resend rate limiting)
    if (verificationRecord?.lastSentAt) {
      if (!canResendOTP(verificationRecord.lastSentAt)) {
        const throttleSeconds = getResendThrottleSeconds()
        return NextResponse.json(
          { ok: false, error: `Please wait ${throttleSeconds} seconds before requesting a new code` },
          { status: 429 }
        )
      }
    }

    // Generate OTP
    const otp = generateOTP()
    const salt = generateSalt()
    const otpHash = hashOTP(otp, salt)

    // Calculate expiry
    const ttlMinutes = getOTPTTL()
    const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000)

    // Get request metadata
    const requestIp = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'

    // Create or update verification record
    if (verificationRecord) {
      await payload.update({
        collection: 'phone-verifications',
        id: verificationRecord.id,
        data: {
          otpHash,
          otpSalt: salt,
          expiresAt: expiresAt.toISOString(),
          attempts: 0, // Reset attempts
          verifiedAt: null, // Clear if previously set
          lastSentAt: new Date().toISOString(),
          requestIp,
          userAgent,
          userId: userId || verificationRecord.userId,
          userCollection: userCollection || verificationRecord.userCollection,
        },
      })
    } else {
      await payload.create({
        collection: 'phone-verifications',
        data: {
          phone: normalizedPhone,
          userId: userId || null,
          userCollection: userCollection || null,
          otpHash,
          otpSalt: salt,
          expiresAt: expiresAt.toISOString(),
          attempts: 0,
          lastSentAt: new Date().toISOString(),
          requestIp,
          userAgent,
        },
      })
    }

    // Send SMS
    const smsMessage = `Your ReadyToWork verification code is: ${otp}`
    const smsResult = await sendSMS({
      phone: normalizedPhone,
      message: smsMessage,
    })

    if (!smsResult.success) {
      console.error('[OTP Start] Failed to send SMS:', smsResult.error)
      return NextResponse.json(
        { ok: false, error: 'Failed to send verification code. Please try again.' },
        { status: 500 }
      )
    }

    // Dev bypass: Log OTP in development only (NEVER in production)
    const isDevMode = process.env.NODE_ENV === 'development' && process.env.OTP_DEV_BYPASS === 'true'
    
    if (isDevMode) {
      console.log('')
      console.log('═══════════════════════════════════════════════════════════')
      console.log('[OTP Start] 🧪 DEV MODE - OTP LOGGED (NEVER IN PRODUCTION)')
      console.log('Phone:', normalizedPhone)
      console.log('OTP Code:', otp)
      console.log('Expires at:', expiresAt.toISOString())
      console.log('NODE_ENV:', process.env.NODE_ENV)
      console.log('OTP_DEV_BYPASS:', process.env.OTP_DEV_BYPASS)
      console.log('═══════════════════════════════════════════════════════════')
      console.log('')
      
      // Return OTP in response for testing (development only)
      console.log('[OTP Start] Returning OTP in response for dev mode:', otp)
      return NextResponse.json({ 
        ok: true, 
        devMode: true,
        otp: otp // Only returned in dev mode with OTP_DEV_BYPASS=true
      })
    }

    console.log('[OTP Start] Production mode - OTP not returned. NODE_ENV:', process.env.NODE_ENV, 'OTP_DEV_BYPASS:', process.env.OTP_DEV_BYPASS)
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    console.error('[OTP Start] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

