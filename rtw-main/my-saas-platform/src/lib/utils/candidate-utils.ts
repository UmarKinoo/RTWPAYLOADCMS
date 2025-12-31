/**
 * Utility functions for candidate data formatting
 * These are client-safe and don't import any server-only code
 */

/**
 * Format experience years for display
 */
export function formatExperience(years: number): string {
  if (years >= 10) return '10+ years'
  if (years >= 5) return '5-10 years'
  if (years >= 3) return '3-5 years'
  if (years >= 1) return '1-3 years'
  return 'Less than 1 year'
}

/**
 * Get nationality flag image path
 */
const FLAG_MAP: Record<string, string> = {
  saudi: '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp',
  'saudi arabia': '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp',
  indonesian: '/assets/fa6133738c9e4e6c76dae9dd948bfefb2b561f82.png',
  indonesia: '/assets/fa6133738c9e4e6c76dae9dd948bfefb2b561f82.png',
  indian: '/assets/6ca05019a8f7dc09e04799c584de66d7569e1cc6.png',
  india: '/assets/6ca05019a8f7dc09e04799c584de66d7569e1cc6.png',
  pakistani: '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp',
  pakistan: '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp',
  filipino: '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp',
  philippines: '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp',
}

const DEFAULT_FLAG = '/assets/6bfc87a7895d9ede7eec660bd3a5265b0ed88762.webp'

export function getNationalityFlag(nationality: string): string {
  return FLAG_MAP[nationality.toLowerCase()] || DEFAULT_FLAG
}

