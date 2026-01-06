/**
 * Billing Class Utilities
 * Maps billing classes (A, B, C, D, S) to pricing tiers and provides helper functions
 */

export type BillingClass = 'A' | 'B' | 'C' | 'D' | 'S'

export interface BillingClassInfo {
  class: BillingClass
  name: string
  subtitle: string
  price: string
  description: string
}

/**
 * Mapping of billing classes to pricing tiers
 */
export const BILLING_CLASSES: Record<BillingClass, BillingClassInfo> = {
  A: {
    class: 'A',
    name: 'Essential',
    subtitle: 'General Staff',
    price: 'SAR 150',
    description: 'Essential (Aamel) - General Staff',
  },
  B: {
    class: 'B',
    name: 'Skilled',
    subtitle: 'Skilled Workers',
    price: 'SAR 350',
    description: 'Skilled (Maher) - Skilled Workers',
  },
  C: {
    class: 'C',
    name: 'Specialty',
    subtitle: 'Certified Technical',
    price: 'SAR 450',
    description: 'Specialty (Teqani) - Certified Technical',
  },
  D: {
    class: 'D',
    name: 'Elite Specialty',
    subtitle: 'Expert Licensed staff',
    price: 'SAR 600',
    description: 'Elite Specialty (Khibra) - Expert Licensed staff',
  },
  S: {
    class: 'S',
    name: 'Saudi Nationals',
    subtitle: 'N/A',
    price: 'SAR 700',
    description: 'Saudi Nationals',
  },
}

/**
 * Get billing class info from billing class letter
 */
export function getBillingClassInfo(billingClass: BillingClass | string | null | undefined): BillingClassInfo | null {
  if (!billingClass) return null
  
  const normalized = String(billingClass).toUpperCase().trim() as BillingClass
  if (normalized in BILLING_CLASSES) {
    return BILLING_CLASSES[normalized]
  }
  return null
}

/**
 * Get billing class name from billing class letter
 */
export function getBillingClassName(billingClass: BillingClass | string | null | undefined): string {
  const info = getBillingClassInfo(billingClass)
  return info?.name || 'Unknown'
}

/**
 * Get billing class price from billing class letter
 */
export function getBillingClassPrice(billingClass: BillingClass | string | null | undefined): string {
  const info = getBillingClassInfo(billingClass)
  return info?.price || 'N/A'
}

/**
 * Check if a billing class is valid
 */
export function isValidBillingClass(billingClass: string | null | undefined): billingClass is BillingClass {
  if (!billingClass) return false
  return ['A', 'B', 'C', 'D', 'S'].includes(billingClass.toUpperCase().trim())
}






