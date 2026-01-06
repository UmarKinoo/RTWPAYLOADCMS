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
  collection = 'users', // Default to 'users' collection for backward compatibility
}: LoginParams): Promise<LoginResponse> {
  // Validate inputs first
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return { success: false, error: 'Invalid email address', errorCode: 'INVALID_EMAIL' }
  }

  if (!password) {
    return { success: false, error: 'Password is required', errorCode: 'MISSING_PASSWORD' }
  }

  try {
    const payload = await getPayload({ config })

    // Track login attempts (could be extended with rate limiting)
    try {
      // Type-safe collection login
      const result = await payload.login({
        collection: collection as 'users' | 'candidates' | 'employers',
        data: { email, password },
      })

      if (result.token) {
        const cookieStore = await cookies()

        // Calculate expiration date based on rememberMe flag
        const expiresIn = rememberMe ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000 // 30 days or 1 day in milliseconds
        const expiresDate = new Date(Date.now() + expiresIn)

        cookieStore.set('payload-token', result.token, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          path: '/',
          expires: expiresDate,
        })

        return { success: true }
      }

      return {
        success: false,
        error: 'Invalid email or password',
        errorCode: 'INVALID_CREDENTIALS',
      }
    } catch (error) {
      // SECURITY: Never log passwords or sensitive data
      // Only log error message, not the full error object which might contain request data
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      console.error('Login attempt failed:', errorMessage)

      // Provide more specific error messages based on error type
      if (error instanceof Error) {
        if (error.message.includes('credentials')) {
          return {
            success: false,
            error: 'The email or password you entered is incorrect',
            errorCode: 'INVALID_CREDENTIALS',
          }
        }
      }

      return {
        success: false,
        error: 'Authentication failed. Please try again later.',
        errorCode: 'AUTH_ERROR',
      }
    }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Login system error:', errorMessage)
    return {
      success: false,
      error: 'We encountered a system error. Please try again later.',
      errorCode: 'SYSTEM_ERROR',
    }
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

    // Clear NextAuth session cookies
    cookieStore.delete('next-auth.session-token')
    cookieStore.delete('__Secure-next-auth.session-token') // Production secure cookie

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
  // Validate email
  const emailValidation = validateEmail(email)
  if (!emailValidation.valid) {
    return { success: false, error: 'Invalid email address', errorCode: 'INVALID_EMAIL' }
  }

  try {
    const payload = await getPayload({ config: await configPromise })

    // Try to find user in all collections (users, candidates, employers)
    let user: User | Candidate | Employer | null = null
    let collection: 'users' | 'candidates' | 'employers' = 'users'
    let userType: 'candidate' | 'employer' = 'candidate'

    // Try employers first
    try {
      const employers = await payload.find({
        collection: 'employers',
        where: {
          email: { equals: email },
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
            email: { equals: email },
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
            email: { equals: email },
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
    // Even if user doesn't exist, we say we sent an email
    if (!user) {
      return { success: true }
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex')
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

    // Update user with reset token
    await payload.update({
      collection,
      id: user.id,
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires.toISOString(),
      },
    })

    // Send reset email with appropriate user type
    const emailResult = await sendEmail({
      to: email,
      subject: 'Reset your password - Ready to Work',
      html: passwordResetEmailTemplate(email, resetToken, userType),
    })

    // Check if email was sent successfully
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error)
      // Still return success to prevent email enumeration, but log the error
      // In production, you might want to handle this differently
      return { success: true }
    }

    return { success: true }
  } catch (error) {
    // SECURITY: Never log passwords or sensitive data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Forgot password error:', errorMessage)
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
          break
        }
      } catch {
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

    // Find user by email
    const users = await payload.find({
      collection: 'users',
      where: {
        and: [{ email: { equals: email } }, { emailVerified: { equals: false } }],
      },
    })

    if (users.docs.length === 0) {
      // Don't reveal if email exists or is already verified
      return { success: true }
    }

    const user = users.docs[0]

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update user with new token
    await payload.update({
      collection: 'users',
      id: user.id,
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires.toISOString(),
      },
    })

    // Send verification email
    const emailResult = await sendEmail({
      to: email,
      subject: 'Verify your email address',
      html: verificationEmailTemplate(email, verificationToken),
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
