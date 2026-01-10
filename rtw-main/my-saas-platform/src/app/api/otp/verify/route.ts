/**
 * POST /api/otp/verify
 * Verify OTP and mark phone as verified
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyOTP, isOTPExpired, getOTPMaxAttempts } from '@/server/otp/utils'
import { normalizePhone } from '@/server/sms/taqnyat'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { phone, code } = body

    // Validate inputs
    if (!phone || typeof phone !== 'string' || phone.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Phone number is required' },
        { status: 400 }
      )
    }

    if (!code || typeof code !== 'string' || code.trim().length === 0) {
      return NextResponse.json(
        { ok: false, error: 'Verification code is required' },
        { status: 400 }
      )
    }

    // Normalize phone number
    let normalizedPhone: string
    try {
      normalizedPhone = normalizePhone(phone)
    } catch (error: any) {
      return NextResponse.json(
        { ok: false, error: 'Invalid phone number format' },
        { status: 400 }
      )
    }

    const payload = await getPayload({ config: await config })

    // Find active verification record
    const verifications = await payload.find({
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

    const verification = verifications.docs[0]

    if (!verification) {
      // Generic error - don't leak information
      return NextResponse.json(
        { ok: false, error: 'Invalid code' },
        { status: 400 }
      )
    }

    // Check if expired
    if (isOTPExpired(verification.expiresAt)) {
      return NextResponse.json(
        { ok: false, error: 'Expired code' },
        { status: 400 }
      )
    }

    // Check max attempts
    const maxAttempts = getOTPMaxAttempts()
    if (verification.attempts >= maxAttempts) {
      return NextResponse.json(
        { ok: false, error: 'Too many attempts. Please request a new code.' },
        { status: 429 }
      )
    }

    // Verify OTP
    const isValid = verifyOTP(
      code,
      verification.otpHash as string,
      verification.otpSalt as string
    )

    if (!isValid) {
      // Increment attempts
      await payload.update({
        collection: 'phone-verifications',
        id: verification.id,
        data: {
          attempts: (verification.attempts || 0) + 1,
        },
      })

      // Generic error - don't leak which part is wrong
      return NextResponse.json(
        { ok: false, error: 'Invalid code' },
        { status: 400 }
      )
    }

    // OTP is valid - mark as verified
    // Note: We don't clear otpHash/otpSalt because they're required fields
    // The verifiedAt timestamp is sufficient to mark it as verified
    await payload.update({
      collection: 'phone-verifications',
      id: verification.id,
      data: {
        verifiedAt: new Date().toISOString(),
      },
    })

    // If user is linked, mark their phone as verified
    // Only update Employers and Candidates (not Users - admin users don't need phone verification)
    let userEmail: string | null = null
    if (verification.userId && verification.userCollection) {
      const collection = verification.userCollection as 'users' | 'candidates' | 'employers'
      
      // Skip Users collection (admin users don't need phone verification)
      if (collection === 'users') {
        console.log('[OTP Verify] Skipping phoneVerified update for Users collection')
      } else {
        try {
          const updatedUser = await payload.update({
            collection: collection as 'candidates' | 'employers',
            id: verification.userId as string,
            data: {
              phoneVerified: true,
            },
          })
          console.log('[OTP Verify] Updated phoneVerified for', collection, verification.userId)
          
          // Store email for potential auto-login
          if (updatedUser && 'email' in updatedUser && updatedUser.email) {
            userEmail = updatedUser.email as string
          }
        } catch (error) {
          // Log but don't fail - verification record is already updated
          console.error('[OTP Verify] Failed to update user phoneVerified:', error)
        }
      }
    }

    return NextResponse.json({
      ok: true,
      verified: true,
      userEmail: userEmail, // Email for potential auto-login (client will handle login)
      userCollection: verification.userCollection,
    })
  } catch (error: any) {
    console.error('[OTP Verify] Error:', error)
    return NextResponse.json(
      { ok: false, error: 'An error occurred. Please try again.' },
      { status: 500 }
    )
  }
}

