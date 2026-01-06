/**
 * Social Login Endpoint Handler
 * 
 * This endpoint bridges OAuth authentication to Payload Auth.
 * It accepts a server-signed JWT token (signed with PAYLOAD_SECRET) that contains
 * a userId, verifies it, and creates a Payload auth session without requiring a password.
 * 
 * SECURITY:
 * - Only accepts tokens signed with PAYLOAD_SECRET (server-side verification)
 * - Tokens should be short-lived (typically 5-15 minutes)
 * - No OAuth provider logic here - that's handled elsewhere
 * - No client-side secrets exposed
 */

import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getPayload } from 'payload'
import config from '@payload-config'
import { SignJWT, jwtVerify } from 'jose'
import type { User } from '@/payload-types'

interface SocialLoginRequestBody {
  token: string
}

interface SocialLoginTokenPayload {
  userId: string | number
  exp?: number
  iat?: number
}

/**
 * Verify a JWT token signed with PAYLOAD_SECRET
 * Returns the decoded payload if valid, throws if invalid
 */
async function verifySocialLoginToken(token: string): Promise<SocialLoginTokenPayload> {
  const secret = process.env.PAYLOAD_SECRET

  if (!secret) {
    throw new Error('PAYLOAD_SECRET is not configured')
  }

  if (secret.length < 32) {
    throw new Error('PAYLOAD_SECRET must be at least 32 characters')
  }

  // Convert secret to Uint8Array for jose
  const secretKey = new TextEncoder().encode(secret)

  try {
    const { payload } = await jwtVerify(token, secretKey, {
      algorithms: ['HS256'],
    })

    // Validate payload structure
    if (!payload.userId) {
      throw new Error('Token missing userId')
    }

    // Check expiration if present
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      throw new Error('Token has expired')
    }

    return payload as SocialLoginTokenPayload
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('expired')) {
        throw new Error('Token has expired')
      }
      if (error.message.includes('signature')) {
        throw new Error('Invalid token signature')
      }
    }
    throw new Error('Token verification failed')
  }
}

/**
 * Generate a Payload-compatible JWT token for the user
 * This creates a session token that Payload will recognize
 */
async function generatePayloadToken(user: User): Promise<string> {
  const secret = process.env.PAYLOAD_SECRET

  if (!secret) {
    throw new Error('PAYLOAD_SECRET is not configured')
  }

  const secretKey = new TextEncoder().encode(secret)

  // Payload JWT structure typically includes:
  // - id: user ID
  // - email: user email
  // - collection: collection slug
  // - exp: expiration (default 7 days for Payload)
  const token = await new SignJWT({
    id: String(user.id),
    email: user.email,
    collection: 'users',
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Match Payload's default token expiration
    .sign(secretKey)

  return token
}

/**
 * POST /api/users/social-login
 * 
 * Accepts a server-signed JWT token, verifies it, and creates a Payload auth session.
 * 
 * Request body:
 * {
 *   "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
 * }
 * 
 * Response:
 * - 200: Success, auth cookie set
 * - 400: Invalid request body
 * - 401: Invalid or expired token
 * - 404: User not found
 * - 500: Server error
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Parse request body
    let body: SocialLoginRequestBody
    try {
      body = await request.json()
    } catch (error) {
      console.error('Social login: Failed to parse request body', error)
      return NextResponse.json(
        { error: 'Invalid request body. Expected JSON with "token" field.' },
        { status: 400 }
      )
    }

    // Validate token presence
    if (!body.token || typeof body.token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required and must be a string' },
        { status: 400 }
      )
    }

    // Verify the token
    let tokenPayload: SocialLoginTokenPayload
    try {
      tokenPayload = await verifySocialLoginToken(body.token)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed'
      console.error('Social login: Token verification failed', errorMessage)
      
      if (errorMessage.includes('expired')) {
        return NextResponse.json(
          { error: 'Token has expired' },
          { status: 401 }
        )
      }
      
      return NextResponse.json(
        { error: 'Invalid or expired token' },
        { status: 401 }
      )
    }

    // Get Payload instance
    const payload = await getPayload({ config })

    // Fetch the user from Payload
    let user: User
    try {
      const userId = String(tokenPayload.userId)
      const result = await payload.findByID({
        collection: 'users',
        id: userId,
      })
      
      user = result as User
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Social login: User not found', { userId: tokenPayload.userId, error: errorMessage })
      
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Generate Payload-compatible JWT token
    let payloadToken: string
    try {
      payloadToken = await generatePayloadToken(user)
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Social login: Failed to generate Payload token', errorMessage)
      
      return NextResponse.json(
        { error: 'Failed to create session' },
        { status: 500 }
      )
    }

    // Set auth cookie (matching Payload's cookie configuration)
    const cookieStore = await cookies()
    const expiresDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days (matching token expiration)

    cookieStore.set('payload-token', payloadToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: expiresDate,
    })

    // Return success response (no sensitive data)
    return NextResponse.json(
      { 
        success: true,
        message: 'Authentication successful',
        // Optionally return user ID (not sensitive)
        userId: String(user.id),
      },
      { status: 200 }
    )

  } catch (error) {
    // Catch-all for unexpected errors
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Social login: Unexpected error', errorMessage)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}


