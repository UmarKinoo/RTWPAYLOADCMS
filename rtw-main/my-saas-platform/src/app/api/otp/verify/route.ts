/**
 * POST /api/otp/verify
 * Verify OTP and mark phone as verified
 */

import { NextRequest, NextResponse } from 'next/server'
import { getPayload } from 'payload'
import config from '@payload-config'
import { verifyOTP, isOTPExpired, getOTPMaxAttempts } from '@/server/otp/utils'
import { normalizePhone } from '@/server/sms/taqnyat'
import { notifyModeratorsForCandidate } from '@/lib/admin/candidate-moderation-notify'
import type { Payload } from 'payload'

async function resolveCandidateIdForOtp(
  payload: Payload,
  verification: { userId?: unknown; userCollection?: string | null },
  normalizedPhone: string,
): Promise<number | null> {
  if (verification.userCollection === 'employers') {
    return null
  }

  if (verification.userCollection === 'candidates' && verification.userId != null) {
    const id = Number(verification.userId)
    return Number.isFinite(id) ? id : null
  }

  const found = await payload.find({
    collection: 'candidates',
    where: { phone: { equals: normalizedPhone } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  const id = found.docs[0]?.id
  return id != null ? Number(id) : null
}

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

    // Mark candidate/employer phone verified and notify moderators for new candidates
    let userEmail: string | null = null
    const collection = verification.userCollection as 'users' | 'candidates' | 'employers' | null

    if (collection === 'users') {
      console.log('[OTP Verify] Skipping phoneVerified update for Users collection')
    } else {
      try {
        const candidateId = await resolveCandidateIdForOtp(payload, verification, normalizedPhone)

        if (candidateId != null) {
          const updatedCandidate = await payload.update({
            collection: 'candidates',
            id: candidateId,
            data: { phoneVerified: true },
            overrideAccess: true,
          })
          console.log('[OTP Verify] Updated phoneVerified for candidate', candidateId)

          const notifyResult = await notifyModeratorsForCandidate(payload, updatedCandidate.id)
          console.log('[OTP Verify] Moderator profile-review notify:', notifyResult)

          if (updatedCandidate.email) {
            userEmail = updatedCandidate.email
          }
        } else if (collection === 'employers' && verification.userId) {
          const updatedEmployer = await payload.update({
            collection: 'employers',
            id: verification.userId as string,
            data: { phoneVerified: true },
            overrideAccess: true,
          })
          console.log('[OTP Verify] Updated phoneVerified for employer', verification.userId)
          if (updatedEmployer.email) {
            userEmail = updatedEmployer.email
          }
        } else {
          console.warn(
            '[OTP Verify] OTP verified but no candidate/employer linked for phone',
            normalizedPhone,
          )
        }
      } catch (error) {
        console.error('[OTP Verify] Failed to update phoneVerified / notify moderators:', error)
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

