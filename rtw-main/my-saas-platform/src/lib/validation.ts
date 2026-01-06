/**
 * Validation utilities for form inputs
 * Returns translation keys that can be resolved using next-intl
 */

// Password validation
const PASSWORD_MIN_LENGTH = 8

export const validatePassword = (password: string): { valid: boolean; errorKey?: string; errorParams?: Record<string, any> } => {
  if (!password) return { valid: false, errorKey: 'validation.passwordRequired' }
  if (password.length < PASSWORD_MIN_LENGTH) {
    return {
      valid: false,
      errorKey: 'validation.passwordMinLength',
      errorParams: { minLength: PASSWORD_MIN_LENGTH },
    }
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, errorKey: 'validation.passwordUppercase' }
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, errorKey: 'validation.passwordLowercase' }
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, errorKey: 'validation.passwordNumber' }
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    return { valid: false, errorKey: 'validation.passwordSpecialChar' }
  }
  return { valid: true }
}

// Email validation
export const validateEmail = (email: string): { valid: boolean; errorKey?: string } => {
  if (!email) return { valid: false, errorKey: 'validation.required' }
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email)) {
    return { valid: false, errorKey: 'validation.invalidEmail' }
  }
  return { valid: true }
}

// Helper to get translated validation message
// This should be used in components that have access to translations
export function getValidationMessage(
  errorKey?: string,
  errorParams?: Record<string, any>,
  t?: (key: string, params?: Record<string, any>) => string
): string | undefined {
  if (!errorKey || !t) return undefined
  return t(errorKey, errorParams)
}
