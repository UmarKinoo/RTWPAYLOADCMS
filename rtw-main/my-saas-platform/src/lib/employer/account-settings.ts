'use server'

import { getPayload } from 'payload'
import config from '@payload-config'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { validateEmail, validatePassword } from '../validation'
import { sendEmail, passwordChangedEmailTemplate, verificationEmailTemplate } from '../email'
import { randomBytes } from 'crypto'
import type { Employer } from '@/payload-types'

export interface ChangePasswordResponse {
  success: boolean
  error?: string
  errorCode?: string
}

export interface ChangeEmailResponse {
  success: boolean
  error?: string
  errorCode?: string
}

export interface UpdatePhoneResponse {
  success: boolean
  error?: string
}

export interface DeleteAccountResponse {
  success: boolean
  error?: string
}

/**
 * Change password with current password verification
 */
export async function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return {
        success: false,
        error: 'Not authenticated as employer',
        errorCode: 'NOT_AUTHENTICATED',
      }
    }

    // Verify current password by attempting login
    try {
      await payload.login({
        collection: 'employers',
        data: {
          email: user.email,
          password: currentPassword,
        },
      })
    } catch (error) {
      return {
        success: false,
        error: 'Current password is incorrect',
        errorCode: 'INVALID_CURRENT_PASSWORD',
      }
    }

    // Validate new password
    const passwordValidation = validatePassword(newPassword)
    if (!passwordValidation.valid) {
      return {
        success: false,
        error: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        errorCode: 'INVALID_PASSWORD',
      }
    }

    // Update password
    await payload.update({
      collection: 'employers',
      id: user.id,
      data: {
        password: newPassword,
      },
    })

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Your password was changed',
        html: passwordChangedEmailTemplate(),
      })
    } catch (emailError) {
      // Don't fail password change if email fails
      console.error('Failed to send password changed email:', emailError)
    }

    revalidatePath('/employer/dashboard', 'page')

    return { success: true }
  } catch (error: any) {
    console.error('Error changing password:', error)
    return {
      success: false,
      error: error?.message || 'Failed to change password',
      errorCode: 'SYSTEM_ERROR',
    }
  }
}

/**
 * Change email address (requires verification)
 */
export async function changeEmail(newEmail: string): Promise<ChangeEmailResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return {
        success: false,
        error: 'Not authenticated as employer',
        errorCode: 'NOT_AUTHENTICATED',
      }
    }

    // Validate email
    const emailValidation = validateEmail(newEmail)
    if (!emailValidation.valid) {
      return {
        success: false,
        error: 'Invalid email address',
        errorCode: 'INVALID_EMAIL',
      }
    }

    // Check if email is already in use
    const existingEmployers = await payload.find({
      collection: 'employers',
      where: {
        email: { equals: newEmail },
      },
      limit: 1,
    })

    if (existingEmployers.docs.length > 0 && existingEmployers.docs[0].id !== user.id) {
      return {
        success: false,
        error: 'This email is already in use',
        errorCode: 'EMAIL_ALREADY_EXISTS',
      }
    }

    // Generate verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Update employer with new email (unverified) and verification token
    await payload.update({
      collection: 'employers',
      id: user.id,
      data: {
        email: newEmail,
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires.toISOString(),
        emailVerified: false,
      },
    })

    // Send verification email
    try {
      await sendEmail({
        to: newEmail,
        subject: 'Verify your new email address',
        html: verificationEmailTemplate(newEmail, verificationToken, 'employer'),
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return {
        success: false,
        error: 'Failed to send verification email',
        errorCode: 'EMAIL_SEND_FAILED',
      }
    }

    revalidatePath('/employer/dashboard', 'page')

    return { success: true }
  } catch (error: any) {
    console.error('Error changing email:', error)
    return {
      success: false,
      error: error?.message || 'Failed to change email',
      errorCode: 'SYSTEM_ERROR',
    }
  }
}

/**
 * Update phone number
 */
export async function updatePhone(phone: string): Promise<UpdatePhoneResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return {
        success: false,
        error: 'Not authenticated as employer',
      }
    }

    // Basic phone validation
    if (!phone || phone.trim().length === 0) {
      return {
        success: false,
        error: 'Phone number is required',
      }
    }

    // Update phone (will need to be verified via OTP)
    await payload.update({
      collection: 'employers',
      id: user.id,
      data: {
        phone: phone.trim(),
        phoneVerified: false, // Reset verification when phone changes
      },
    })

    revalidatePath('/employer/dashboard', 'page')

    return { success: true }
  } catch (error: any) {
    console.error('Error updating phone:', error)
    return {
      success: false,
      error: error?.message || 'Failed to update phone number',
    }
  }
}

/**
 * Resend email verification
 */
export async function resendEmailVerification(): Promise<ChangeEmailResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return {
        success: false,
        error: 'Not authenticated as employer',
      }
    }

    const employer = await payload.findByID({
      collection: 'employers',
      id: user.id,
    })

    if (employer.emailVerified) {
      return {
        success: false,
        error: 'Email is already verified',
      }
    }

    // Generate new verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    await payload.update({
      collection: 'employers',
      id: user.id,
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationExpires: verificationExpires.toISOString(),
      },
    })

    // Send verification email
    try {
      await sendEmail({
        to: employer.email,
        subject: 'Verify your email address',
        html: verificationEmailTemplate(employer.email, verificationToken, 'employer'),
      })
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      return {
        success: false,
        error: 'Failed to send verification email',
      }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error resending verification email:', error)
    return {
      success: false,
      error: error?.message || 'Failed to resend verification email',
    }
  }
}

/**
 * Delete employer account
 */
export async function deleteAccount(password: string): Promise<DeleteAccountResponse> {
  try {
    const payload = await getPayload({ config })
    const headersList = await headers()
    const { user } = await payload.auth({ headers: headersList })

    if (!user || user.collection !== 'employers') {
      return {
        success: false,
        error: 'Not authenticated as employer',
      }
    }

    // Verify password by attempting login
    try {
      await payload.login({
        collection: 'employers',
        data: {
          email: user.email,
          password: password,
        },
      })
    } catch (error) {
      return {
        success: false,
        error: 'Password is incorrect',
      }
    }

    // Delete employer account
    await payload.delete({
      collection: 'employers',
      id: user.id,
    })

    return { success: true }
  } catch (error: any) {
    console.error('Error deleting account:', error)
    return {
      success: false,
      error: error?.message || 'Failed to delete account',
    }
  }
}

