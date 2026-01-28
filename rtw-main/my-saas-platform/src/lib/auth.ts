'use server'

import { cookies, headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import type { Payload } from 'payload'
import config from '@payload-config'
import configPromise from '@payload-config'
import { redirect } from 'next/navigation'
import type { User, Employer, Candidate } from '@/payload-types'
import { validateEmail, validatePassword } from './validation'
import {
  sendEmail,
  verificationEmailTemplate,
  passwordResetEmailTemplate,
  passwordChangedEmailTemplate,
} from './email'
import { randomBytes } from 'crypto'

// Auth Types

type LoginParams = {
  email: string
  password: string
  rememberMe?: boolean
  collection?: string // Collection slug to authenticate against (defaults to 'users')
}

type RegisterParams = {
  email: string
  password: string
}

export type LoginResponse = {
  success: boolean
  error?: string
  errorCode?: string
}

export type Result = {
  exp?: number
  token?: string
  user?: User
}

export type RegisterResponse = {
  success: boolean
  error?: string
  errorCode?: string
}

export type ForgotPasswordResponse = {
  success: boolean
  error?: string
  errorCode?: string
}

export type ResetPasswordResponse = {
  success: boolean
  error?: string
  errorCode?: string
}

// Helpers (reduce cognitive complexity of exported functions)
async function attemptLogin(
  payload: Payload,
  collection: 'users' | 'candidates' | 'employers',
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<LoginResponse> {
  try {
    const result = await payload.login({ collection, data: { email, password } })
    if (!result.token) {
      return { success: false, error: 'Invalid email or password', errorCode: 'INVALID_CREDENTIALS' }
    }
    // Single-session: bump lastLoginAt so other devices' tokens become stale
    try {
      await payload.update({
        collection,
        id: result.user.id,
        data: { lastLoginAt: new Date() },
        overrideAccess: true,
      })
    } catch (updateErr) {
      // Log but don't fail login if lastLoginAt update fails (e.g. column not yet migrated)
      console.warn('[auth] lastLoginAt update failed:', updateErr instanceof Error ? updateErr.message : updateErr)
    }
    const cookieStore = await cookies()
    const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000
    cookieStore.set('payload-token', result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      path: '/',
      expires: new Date(Date.now() + expiresIn),
    })
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error'
    console.error('Login attempt failed:', msg)
    if (err instanceof Error && err.message.includes('credentials')) {
      return { success: false, error: 'The email or password you entered is incorrect', errorCode: 'INVALID_CREDENTIALS' }
    }
    return { success: false, error: 'Authentication failed. Please try again later.', errorCode: 'AUTH_ERROR' }
  }
}

async function findUserByEmail(
  payload: Payload,
  email: string,
): Promise<{ user: User | Candidate | Employer; collection: 'users' | 'candidates' | 'employers'; userType: 'candidate' | 'employer' } | null> {
  for (const coll of ['employers', 'candidates', 'users'] as const) {
    try {
      const res = await payload.find({
        collection: coll,
        where: { email: { equals: email } },
        limit: 1,
      })
      if (res.docs.length > 0) {
        const user = res.docs[0]
        const userType = coll === 'employers' ? 'employer' : 'candidate'
        return { user, collection: coll, userType }
      }
    } catch {
      /* not in this collection */
    }
  }
  return null
}

// Auth Actions

/**
 * Get the currently authenticated user
 * @returns The authenticated user or null if not authenticated
 */
export async function getUser(): Promise<User | null> {
  try {
    const headers = await getHeaders()
    const payload: Payload = await getPayload({ config: await configPromise })

    const { user } = await payload.auth({ headers })
    // Return the authenticated user (could be from users, candidates, or employers collection)
    // The caller (getCurrentUserType) will determine the actual type
    if (user) {
      // Check if it's a User type by checking for 'role' property (only Users have this)
      if ('role' in user) {
        return user as User
      }
      // If it's not a User type, return null - getCurrentCandidate/getCurrentEmployer will handle it
      return null
    }
    return null
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error getting user:', errorMessage)
    return null
  }
}

/**
 * Authenticate a user with email and password
 * @param params Login parameters including email, password, optional rememberMe flag, and collection slug
 * @returns Login response with success status and error message if applicable
 */
export async function loginUser({
  email,
  password,
  rememberMe = false,
  collection = 'users',
}: LoginParams): Promise<LoginResponse> {
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return { success: false, error: 'Invalid email address', errorCode: 'INVALID_EMAIL' }
  }
  if (!password) {
    return { success: false, error: 'Password is required', errorCode: 'MISSING_PASSWORD' }
  }
  try {
    const payload = await getPayload({ config })
    return attemptLogin(payload, collection as 'users' | 'candidates' | 'employers', email, password, rememberMe)
  } catch (error) {
    console.error('Login system error:', error instanceof Error ? error.message : 'Unknown error')
    return { success: false, error: 'We encountered a system error. Please try again later.', errorCode: 'SYSTEM_ERROR' }
  }
}

/**
 * Log out the current user by removing their authentication token (Server Action)
 */
export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    // Delete the auth cookie
    cookieStore.delete('payload-token')

    // Clear any other auth-related cookies if they exist
    cookieStore.delete('user-session')

    redirect('/')
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Logout error:', errorMessage)
    redirect('/')
  }
}

/**
 * Clear authentication cookies without redirect (for client components)
 * Also clears NextAuth session cookies
 */
export async function clearAuthCookies(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies()
    // Delete the Payload auth cookie
    cookieStore.delete('payload-token')

    // Clear any other auth-related cookies if they exist
    cookieStore.delete('user-session')

    // NextAuth cookies (commented out - NextAuth not in use, Google login disabled)
    // cookieStore.delete('next-auth.session-token')
    // cookieStore.delete('__Secure-next-auth.session-token')

    return { success: true }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Clear cookies error:', errorMessage)
    return { success: false }
  }
}

/**
 * Register a new user with email and password
 * @param params Registration parameters including email and password
 * @returns Registration response with success status and error message if applicable
 */
export async function registerUser({ email, password }: RegisterParams): Promise<RegisterResponse> {
  // Validate email
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return { success: false, error: 'Invalid email address', errorCode: 'INVALID_EMAIL' }
  }

  // Validate password
  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return { success: false, error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character', errorCode: 'INVALID_PASSWORD' }
  }

  try {
    const payload = await getPayload({ config })

    try {
      // Generate email verification token
      const verificationToken = randomBytes(32).toString('hex')
      const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

      // Create the user
      await payload.create({
        collection: 'users',
        data: {
          email,
          password,
          role: 'user',
          emailVerified: false,
          emailVerificationToken: verificationToken,
          emailVerificationExpires: verificationExpires.toISOString(),
        },
      })

      // Send verification email
      await sendEmail({
        to: email,
        subject: 'Verify your email address - Ready to Work',
        html: verificationEmailTemplate(email, verificationToken, 'candidate'),
      })

      // Log the user in (they can use the app but with limited access until verified)
      const loginResponse = await loginUser({ email, password })

      if (loginResponse.success) {
        return { success: true }
      }

      return {
        success: false,
        error:
          'Account created but unable to log in automatically. Please try logging in manually.',
        errorCode: 'LOGIN_AFTER_REGISTER_FAILED',
      }
    } catch (error) {
      // SECURITY: Never log passwords or sensitive data
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Registration attempt failed:', errorMessage)

      // Provide specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('duplicate key error')) {
          return {
            success: false,
            error:
              'An account with this email already exists. Please log in or use a different email.',
            errorCode: 'EMAIL_EXISTS',
          }
        }

        if (error.message.includes('validation')) {
          return {
            success: false,
            error: 'Please check your information and try again.',
            errorCode: 'VALIDATION_ERROR',
          }
        }
      }

      return {
        success: false,
        error: "We couldn't create your account. Please try again later.",
        errorCode: 'REGISTRATION_FAILED',
      }
    }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Registration system error:', errorMessage)
    return {
      success: false,
      error: 'We encountered a system error. Please try again later.',
      errorCode: 'SYSTEM_ERROR',
    }
  }
}

/**
 * Send password reset email
 * @param email Email address to send reset link to
 * @returns Response indicating success or failure
 */
export async function forgotPassword(email: string): Promise<ForgotPasswordResponse> {
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return { success: false, error: 'Invalid email address', errorCode: 'INVALID_EMAIL' }
  }
  try {
    const payload = await getPayload({ config: await configPromise })
    const found = await findUserByEmail(payload, email)
    if (!found) {
      return { success: true }
    }
    const { user, collection, userType } = found

    console.log('[FORGOT_PASSWORD] User found:', { collection, id: user.id, userType })

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour
    console.log('[FORGOT_PASSWORD] Generated reset token, expires at:', resetExpires.toISOString())

    // Update user with reset token
    // The hooks will skip embedding generation for password/auth-only updates
    // Use overrideAccess to bypass access checks and document locking
    // Set context to skip vector updates
    console.log('[FORGOT_PASSWORD] Attempting to update user with reset token...')
    try {
      const updateStartTime = Date.now()
      await payload.update({
        collection,
        id: user.id,
        data: {
          passwordResetToken: resetToken,
          passwordResetExpires: resetExpires.toISOString(),
        },
        overrideAccess: true, // Bypass access checks and document locking
        context: {
          skipVectorUpdate: true, // Flag to skip vector updates in hooks
        },
      })
      const updateDuration = Date.now() - updateStartTime
      console.log('[FORGOT_PASSWORD] ✅ User updated successfully in', updateDuration, 'ms')
    } catch (updateError) {
      // Log the specific error for debugging
      const errorMessage = updateError instanceof Error ? updateError.message : String(updateError)
      const errorStack = updateError instanceof Error ? updateError.stack : undefined
      console.error('[FORGOT_PASSWORD] ❌ Failed to update password reset token:')
      console.error('[FORGOT_PASSWORD] Error message:', errorMessage)
      if (errorStack) {
        console.error('[FORGOT_PASSWORD] Error stack:', errorStack)
      }
      if (updateError instanceof Error && 'code' in updateError) {
        console.error('[FORGOT_PASSWORD] Error code:', (updateError as any).code)
      }
      
      // If update fails, still return success to prevent email enumeration
      // The user won't be able to reset, but we don't reveal that the email exists
      console.log('[FORGOT_PASSWORD] Returning success despite update failure (security: prevent email enumeration)')
      return { success: true }
    }

    // Send reset email with appropriate user type
    console.log('[FORGOT_PASSWORD] Sending password reset email...')
    const emailStartTime = Date.now()
    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset your password - Ready to Work',
      html: passwordResetEmailTemplate(email, resetToken, userType),
    })
    const emailDuration = Date.now() - emailStartTime
    console.log('[FORGOT_PASSWORD] Email send result:', { success: emailResult.success, duration: emailDuration + 'ms' })

    // Check if email was sent successfully
    if (!emailResult.success) {
      console.error('[FORGOT_PASSWORD] ❌ Failed to send password reset email:', emailResult.error)
      // Still return success to prevent email enumeration, but log the error
      // In production, you might want to handle this differently
      console.log('[FORGOT_PASSWORD] Returning success despite email failure (security: prevent email enumeration)')
      return { success: true }
    }

    console.log('[FORGOT_PASSWORD] ✅ Password reset flow completed successfully')
    return { success: true }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorStack = error instanceof Error ? error.stack : undefined
    console.error('[FORGOT_PASSWORD] ❌ Fatal error in forgot password flow:')
    console.error('[FORGOT_PASSWORD] Error message:', errorMessage)
    if (errorStack) {
      console.error('[FORGOT_PASSWORD] Error stack:', errorStack)
    }
    if (error instanceof Error && 'code' in error) {
      console.error('[FORGOT_PASSWORD] Error code:', (error as any).code)
    }
    return {
      success: false,
      error: 'We encountered an error. Please try again later.',
      errorCode: 'SYSTEM_ERROR',
    }
  }
}

/**
 * Reset password using token
 * @param token Reset token from email
 * @param email User's email address
 * @param newPassword New password to set
 * @returns Response indicating success or failure
 */
export async function resetPassword(
  token: string,
  email: string,
  newPassword: string,
  userType?: 'candidate' | 'employer',
): Promise<ResetPasswordResponse> {
  // Validate inputs
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return { success: false, error: 'Invalid email address', errorCode: 'INVALID_EMAIL' }
  }

  const passwordValidation = validatePassword(newPassword)
  if (!passwordValidation.valid) {
    return { success: false, error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character', errorCode: 'INVALID_PASSWORD' }
  }

  if (!token) {
    return { success: false, error: 'Invalid reset token', errorCode: 'INVALID_TOKEN' }
  }

  try {
    const payload = await getPayload({ config: await configPromise })

    // Try to find user in collections based on userType hint, or search all
    let user: User | Candidate | Employer | null = null
    let collection: 'users' | 'candidates' | 'employers' = 'users'

    const collectionsToTry = userType === 'employer' 
      ? ['employers', 'candidates', 'users']
      : userType === 'candidate'
      ? ['candidates', 'users', 'employers']
      : ['employers', 'candidates', 'users'] // Default: try all

    for (const coll of collectionsToTry) {
      try {
        // First, try to find user by email only to debug
        const emailResults = await payload.find({
          collection: coll as 'users' | 'candidates' | 'employers',
          where: {
            email: { equals: email },
          },
          limit: 1,
        })

        if (emailResults.docs.length > 0) {
          const foundUser = emailResults.docs[0]
          console.log(`[Reset Password] Found user in ${coll}:`, {
            email: foundUser.email,
            hasPasswordResetToken: !!(foundUser as any).passwordResetToken,
            passwordResetToken: (foundUser as any).passwordResetToken ? 'SET' : 'NULL',
            passwordResetExpires: (foundUser as any).passwordResetExpires,
            tokenFromEmail: token.substring(0, 10) + '...',
          })

          // Now check if token matches
          const results = await payload.find({
            collection: coll as 'users' | 'candidates' | 'employers',
            where: {
              and: [
                { email: { equals: email } },
                { passwordResetToken: { equals: token } },
                { passwordResetExpires: { greater_than: new Date().toISOString() } },
              ],
            },
            limit: 1,
          })

          if (results.docs.length > 0) {
            user = results.docs[0]
            collection = coll as 'users' | 'candidates' | 'employers'
            console.log(`[Reset Password] Token validated successfully for ${coll}`)
            break
          } else {
            console.log(`[Reset Password] Token validation failed for ${coll} - token mismatch or expired`)
          }
        }
      } catch (error: any) {
        console.error(`[Reset Password] Error checking ${coll}:`, error.message)
        // Not found in this collection, continue
      }
    }

    if (!user) {
      return {
        success: false,
        error: 'Invalid or expired reset token',
        errorCode: 'INVALID_OR_EXPIRED_TOKEN',
      }
    }

    // Update password and clear reset token
    // The hooks will skip embedding generation for password/auth-only updates
    await payload.update({
      collection,
      id: user.id,
      data: {
        password: newPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    // Send confirmation email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Your password was changed',
      html: passwordChangedEmailTemplate(),
    })

    // Log if email failed to send (but don't fail the password reset)
    if (!emailResult.success) {
      console.error('Failed to send password changed confirmation email:', emailResult.error)
    }

    return { success: true }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Reset password error:', errorMessage)
    return {
      success: false,
      error: 'We encountered an error. Please try again later.',
      errorCode: 'SYSTEM_ERROR',
    }
  }
}

/**
 * Resend email verification
 * @param email Email address to resend verification to
 * @returns Response indicating success or failure
 */
export async function resendVerification(
  email: string,
): Promise<{ success: boolean; error?: string }> {
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return { success: false, error: 'Invalid email address' }
  }

  try {
    const payload = await getPayload({ config: await configPromise })

    // Try to find user in all collections (employers, candidates, users)
    let user: User | Candidate | Employer | null = null
    let collection: 'users' | 'candidates' | 'employers' = 'users'
    let userType: 'candidate' | 'employer' = 'candidate'

    // Try employers first
    try {
      const employers = await payload.find({
        collection: 'employers',
        where: {
          and: [
            { email: { equals: email } },
            { emailVerified: { equals: false } },
          ],
        },
        limit: 1,
      })
      if (employers.docs.length > 0) {
        user = employers.docs[0]
        collection = 'employers'
        userType = 'employer'
      }
    } catch {
      // Not found in employers
    }

    // Try candidates
    if (!user) {
      try {
        const candidates = await payload.find({
          collection: 'candidates',
          where: {
            and: [
              { email: { equals: email } },
              { emailVerified: { equals: false } },
            ],
          },
          limit: 1,
        })
        if (candidates.docs.length > 0) {
          user = candidates.docs[0]
          collection = 'candidates'
          userType = 'candidate'
        }
      } catch {
        // Not found in candidates
      }
    }

    // Try users
    if (!user) {
      try {
        const users = await payload.find({
          collection: 'users',
          where: {
            and: [
              { email: { equals: email } },
              { emailVerified: { equals: false } },
            ],
          },
          limit: 1,
        })
        if (users.docs.length > 0) {
          user = users.docs[0]
          collection = 'users'
          userType = 'candidate'
        }
      } catch {
        // Not found in users
      }
    }

    // Always return success to prevent email enumeration attacks
    // Even if user doesn't exist or is already verified, we say we sent an email
    if (!user) {
      return { success: true }
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await payload.update({
      collection,
      id: user.id,
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires.toISOString(),
      },
    })

    // Send verification email with appropriate user type
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify your email address',
      html: verificationEmailTemplate(email, verificationToken, userType),
    })

    // Check if email was sent successfully
    if (!emailResult.success) {
      console.error('Failed to send verification email:', emailResult.error)
      // Still return success to prevent email enumeration
      return { success: true }
    }

    return { success: true }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Resend verification error:', errorMessage)
    return { success: false, error: 'Failed to send verification email' }
  }
}
