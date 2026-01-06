/**
 * Candidate Card Assets Utility
 * Maps billing classes to card asset colors
 */

import type { BillingClass } from '@/lib/billing'

export interface CandidateCardAssets {
  vector: string
  layer1: string
  layer2: string
  layer3: string
  profileMask: string
}

// Default assets (current ones - used as fallback)
const DEFAULT_ASSETS: CandidateCardAssets = {
  vector: '/assets/2b2ca666fdce1524e5659a70cf4e087a81bfff05.svg',
  layer1: '/assets/a7a6577a6e8f7ac7c9f5b2f297869418ec6c25a8.svg',
  layer2: '/assets/dd8a7a001109c2610d05f06cc36f25d190c796e3.svg',
  layer3: '/assets/2c1d0ff68c44608b5625f8ecb9c38cf7e116885a.svg',
  profileMask: '/assets/e223af9be935490b430d9d6b758a27ceb15c14ec.svg',
}

// Class-specific assets from Figma design
// Colors: A=Purple (#4644B8), B=Teal (#13BF92), C=Yellow/Lime (#D8E530), D=Light Blue (#97B9FF), S=Saudi Green (#006C35)
const CLASS_ASSETS: Record<BillingClass, CandidateCardAssets> = {
  A: {
    // Class A (Essential) - Purple theme
    vector: '/assets/2b2ca666fdce1524e5659a70cf4e087a81bfff05.svg', // Purple vector border
    layer1: '/assets/a7a6577a6e8f7ac7c9f5b2f297869418ec6c25a8.svg', // White background layer
    layer2: '/assets/dd8a7a001109c2610d05f06cc36f25d190c796e3.svg', // Purple decorative layer
    layer3: '/assets/2c1d0ff68c44608b5625f8ecb9c38cf7e116885a.svg', // Purple decorative layer
    profileMask: '/assets/e223af9be935490b430d9d6b758a27ceb15c14ec.svg', // Same for all classes
  },
  B: {
    // Class B (Skilled) - Teal/Green theme
    vector: '/assets/e401c4eec7023e8a29b21b2d8a54041988683440.svg', // Teal vector border
    layer1: '/assets/a7a6577a6e8f7ac7c9f5b2f297869418ec6c25a8.svg', // White background layer
    layer2: '/assets/49b478431404bfb040bba8822a1d4dbc70893a88.svg', // Teal decorative layer
    layer3: '/assets/b56bcc91ec04d089e0e1b52e21e87c72d7d5b09d.svg', // Teal decorative layer (alternative)
    profileMask: '/assets/e223af9be935490b430d9d6b758a27ceb15c14ec.svg', // Same for all classes
  },
  C: {
    // Class C (Specialty) - Yellow/Lime theme
    vector: '/assets/a759c01bc72c0ed6d5c67571fb43ca1de0b56398.svg', // Yellow vector border
    layer1: '/assets/a7a6577a6e8f7ac7c9f5b2f297869418ec6c25a8.svg', // White background layer
    layer2: '/assets/5e7337b419c08d7ed26eccbebe736cc5dcb0459f.svg', // Yellow decorative layer
    layer3: '/assets/5e7337b419c08d7ed26eccbebe736cc5dcb0459f.svg', // Yellow decorative layer (reuse layer2 pattern)
    profileMask: '/assets/e223af9be935490b430d9d6b758a27ceb15c14ec.svg', // Same for all classes
  },
  D: {
    // Class D (Elite Specialty) - Light Blue theme
    vector: '/assets/candidate-card-class-d-vector.svg', // Light Blue vector border
    layer1: '/assets/a7a6577a6e8f7ac7c9f5b2f297869418ec6c25a8.svg', // White background layer
    layer2: '/assets/candidate-card-class-d-layer2.svg', // Light Blue decorative layer
    layer3: '/assets/candidate-card-class-d-layer3.svg', // Light Blue decorative layer
    profileMask: '/assets/e223af9be935490b430d9d6b758a27ceb15c14ec.svg', // Same for all classes
  },
  S: {
    // Class S (Saudi Nationals) - Saudi Green flag color theme
    vector: '/assets/candidate-card-class-s-vector.svg', // Saudi Green vector border
    layer1: '/assets/a7a6577a6e8f7ac7c9f5b2f297869418ec6c25a8.svg', // White background layer
    layer2: '/assets/candidate-card-class-s-layer2.svg', // Saudi Green decorative layer
    layer3: '/assets/candidate-card-class-s-layer3.svg', // Saudi Green decorative layer
    profileMask: '/assets/e223af9be935490b430d9d6b758a27ceb15c14ec.svg', // Same for all classes
  },
}

/**
 * Get candidate card assets based on billing class
 * @param billingClass - The billing class (A, B, C, D, S) or null/undefined
 * @returns CandidateCardAssets object with asset paths
 */
export function getCandidateCardAssets(
  billingClass: BillingClass | string | null | undefined,
): CandidateCardAssets {
  if (!billingClass) {
    return DEFAULT_ASSETS
  }

  const normalized = String(billingClass).toUpperCase().trim() as BillingClass

  if (normalized in CLASS_ASSETS) {
    return CLASS_ASSETS[normalized]
  }

  return DEFAULT_ASSETS
}

