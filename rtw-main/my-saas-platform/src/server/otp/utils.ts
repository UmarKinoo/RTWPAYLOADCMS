/**
 * OTP Utility Functions
 * Server-only module for OTP generation and verification
 */

import { createHash, randomBytes } from 'crypto'

if (typeof window !== 'undefined') {
  throw new Error('otp/utils.ts cannot be imported in client-side code')
}

/**
 * Generate a 6-digit numeric OTP
 */
export function generateOTP(): string {
  // Generate random number between 100000 and 999999
  const otp = Math.floor(100000 + Math.random() * 900000).toString()
  return otp
}

/**
 * Generate a random salt for OTP hashing
 */
export function generateSalt(): string {
  return randomBytes(16).toString('hex')
}

/**
 * Hash OTP with salt using SHA256
 */
export function hashOTP(otp: string, salt: string): string {
  const hash = createHash('sha256')
  hash.update(otp + salt)
  return hash.digest('hex')
}

/**
 * Verify OTP against stored hash and salt
 */
export function verifyOTP(otp: string, storedHash: string, salt: string): boolean {
  const computedHash = hashOTP(otp, salt)
  return computedHash === storedHash
}

/**
 * Get OTP TTL in minutes (default 3)
 */
export function getOTPTTL(): number {
  return parseInt(process.env.OTP_TTL_MINUTES || '3', 10)
}

/**
 * Get max OTP attempts (default 5)
 */
export function getOTPMaxAttempts(): number {
  return parseInt(process.env.OTP_MAX_ATTEMPTS || '5', 10)
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiresAt: Date | string): boolean {
  const expiry = typeof expiresAt === 'string' ? new Date(expiresAt) : expiresAt
  return new Date() > expiry
}

/**
 * Get resend throttle time in seconds (default 60)
 */
export function getResendThrottleSeconds(): number {
  return parseInt(process.env.OTP_RESEND_THROTTLE_SECONDS || '60', 10)
}

/**
 * Check if resend is allowed (throttle check)
 */
export function canResendOTP(lastSentAt: Date | string | null | undefined): boolean {
  if (!lastSentAt) {
    return true
  }

  const lastSent = typeof lastSentAt === 'string' ? new Date(lastSentAt) : lastSentAt
  const throttleSeconds = getResendThrottleSeconds()
  const now = new Date()
  const diffSeconds = (now.getTime() - lastSent.getTime()) / 1000

  return diffSeconds >= throttleSeconds
}

