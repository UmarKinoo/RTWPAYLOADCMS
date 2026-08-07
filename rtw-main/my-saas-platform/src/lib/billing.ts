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

/** Short package labels for career-pathway UI (D = Elite, not Elite Specialty). */
export const PACKAGE_LABELS: Record<BillingClass, string> = {
  A: 'Essential',
  B: 'Skilled',
  C: 'Specialty',
  D: 'Elite',
  S: 'Saudi Nationals',
}

/** next-intl keys under `candidateDetail` for package labels. */
export const PACKAGE_LABEL_I18N_KEYS: Record<BillingClass, string> = {
  A: 'packageEssential',
  B: 'packageSkilled',
  C: 'packageSpecialty',
  D: 'packageElite',
  S: 'packageSaudiNationals',
}

/**
 * Short English package label for career-pathway tag (or null if invalid/missing).
 */
export function getPackageLabel(billingClass: BillingClass | string | null | undefined): string | null {
  if (!isValidBillingClass(billingClass)) return null
  return PACKAGE_LABELS[billingClass.toUpperCase().trim() as BillingClass]
}

/**
 * i18n message key for package label under `candidateDetail` (or null if invalid/missing).
 */
export function getPackageLabelKey(
  billingClass: BillingClass | string | null | undefined,
): string | null {
  if (!isValidBillingClass(billingClass)) return null
  return PACKAGE_LABEL_I18N_KEYS[billingClass.toUpperCase().trim() as BillingClass]
}






