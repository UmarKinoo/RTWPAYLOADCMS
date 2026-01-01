// Supported collections for authentication
export const AUTH_COLLECTIONS = ['users', 'employers', 'candidates'] as const
export type AuthCollection = typeof AUTH_COLLECTIONS[number]

/**
 * Get the cookie name for a specific collection
 * Uses collection-specific cookie names to allow multiple simultaneous sessions
 * @param collection - The collection slug (e.g., 'users', 'employers', 'candidates')
 * @returns The cookie name for that collection
 */
export function getAuthCookieName(collection: string): string {
  // For backward compatibility, 'users' collection uses 'payload-token'
  // Other collections use 'payload-token-{collection}'
  if (collection === 'users') {
    return 'payload-token'
  }
  return `payload-token-${collection}`
}

/**
 * Get all possible auth cookie names
 * @returns Array of all possible cookie names
 */
export function getAllAuthCookieNames(): string[] {
  return AUTH_COLLECTIONS.map(getAuthCookieName)
}

