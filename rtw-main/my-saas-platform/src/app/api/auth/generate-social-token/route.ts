/**
 * Generate Social Login Token
 * 
 * Server-side endpoint to generate short-lived JWT token
 * signed with PAYLOAD_SECRET for Pattern A endpoint.
 * 
 * SECURITY: This must be server-side only to protect PAYLOAD_SECRET
 */

import { NextRequest, NextResponse } from 'next/server'
import { SignJWT } from 'jose'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const secret = process.env.PAYLOAD_SECRET

    if (!secret) {
      console.error('PAYLOAD_SECRET is not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    if (secret.length < 32) {
      console.error('PAYLOAD_SECRET must be at least 32 characters')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Convert secret to Uint8Array for jose
    const secretKey = new TextEncoder().encode(secret)

    // Generate short-lived token (2-5 minutes)
    const token = await new SignJWT({
      userId: String(userId),
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('5m') // 5 minutes
      .sign(secretKey)

    return NextResponse.json({ token })
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Generate social token error:', errorMessage)
    return NextResponse.json(
      { error: 'Failed to generate token' },
      { status: 500 }
    )
  }
}





