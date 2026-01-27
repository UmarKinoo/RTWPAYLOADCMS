'use server'

import { getPayload } from 'payload'
import configPromise from '@payload-config'
import { headers } from 'next/headers'
import type { User, Candidate, Employer } from '@/payload-types'

export type CurrentUserType =
  | { kind: 'admin'; user: User }
  | { kind: 'moderator'; user: User }
  | { kind: 'candidate'; user: User; candidate: Candidate }
  | { kind: 'employer'; user: User; employer: Employer }
  | { kind: 'unknown'; user: User }

/**
 * Get the current user type by checking if user is admin, or has candidate/employer profile
 * @returns CurrentUserType or null if no user is authenticated
 */
export async function getCurrentUserType(): Promise<CurrentUserType | null> {
  try {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.log('[getCurrentUserType] Starting user type detection')
    }
    const payload = await getPayload({ config: await configPromise })
    const headersList = await headers()
    
    // Get authenticated user (could be from users, candidates, or employers collection)
    const { user } = await payload.auth({ headers: headersList })
    if (process.env.NODE_ENV === 'development') {
      console.log('[getCurrentUserType] Auth result:', user ? { id: user.id, email: user.email, collection: (user as any).collection } : 'no user')
    }

    if (!user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[getCurrentUserType] No authenticated user found')
      }
      return null
    }

    // Check if user is admin or moderator (from Users collection)
    // Only Users have a 'role' property; candidates/employers do not
    const userWithRole = user as { role?: string }
    if (userWithRole.role === 'admin') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[getCurrentUserType] User is admin')
      }
      return { kind: 'admin', user: user as User }
    }
    if (userWithRole.role === 'moderator') {
      if (process.env.NODE_ENV === 'development') {
        console.log('[getCurrentUserType] User is moderator')
      }
      return { kind: 'moderator', user: user as User }
    }

    // Try to find candidate or employer profile
    // First, try direct ID lookup (works for users from candidates/employers collections)
    // Then fall back to email search (works for users from users collection)
    
    const isFromUsersCollection = 'role' in user
    
    // Try candidate first
    let candidate: Candidate | null = null
    if (!isFromUsersCollection) {
      // User is from candidates or employers collection - try direct ID lookup
      try {
        candidate = await payload.findByID({
          collection: 'candidates',
          id: user.id,
          depth: 1,
        }) as Candidate | null
        if (candidate && candidate.email !== user.email) {
          candidate = null // Email mismatch, not the right candidate
        }
      } catch {
        // Not found by ID, will try email search below
      }
    }
    
    // If not found by ID, try email search (works for users from users collection)
    if (!candidate) {
      try {
        const candidates = await payload.find({
          collection: 'candidates',
          where: {
            email: {
              equals: user.email,
            },
          },
          limit: 1,
          depth: 1,
        })
        if (candidates.docs.length > 0) {
          candidate = candidates.docs[0] as Candidate
        }
      } catch {
        // Not found
      }
    }
    
    if (candidate) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[getCurrentUserType] User is candidate:', candidate.id, candidate.email)
      }
      const userObj: User = isFromUsersCollection
        ? (user as User)
        : ({
            id: user.id,
            email: user.email,
            role: 'user',
            updatedAt: (user as any).updatedAt || new Date().toISOString(),
            createdAt: (user as any).createdAt || new Date().toISOString(),
          } as User)
      return { kind: 'candidate', user: userObj, candidate }
    }
    
    // Try employer
    let employer: Employer | null = null
    if (!isFromUsersCollection) {
      // User is from candidates or employers collection - try direct ID lookup
      try {
        employer = await payload.findByID({
          collection: 'employers',
          id: user.id,
          depth: 1,
        }) as Employer | null
        if (employer && employer.email !== user.email) {
          employer = null // Email mismatch, not the right employer
        }
      } catch {
        // Not found by ID, will try email search below
      }
    }
    
    // If not found by ID, try email search (works for users from users collection)
    if (!employer) {
      try {
        const employers = await payload.find({
          collection: 'employers',
          where: {
            email: {
              equals: user.email,
            },
          },
          limit: 1,
          depth: 1,
        })
        if (employers.docs.length > 0) {
          employer = employers.docs[0] as Employer
        }
      } catch {
        // Not found
      }
    }
    
    if (employer) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[getCurrentUserType] User is employer:', employer.id, employer.email, employer.companyName)
      }
      const userObj: User = isFromUsersCollection
        ? (user as User)
        : ({
            id: user.id,
            email: user.email,
            role: 'user',
            updatedAt: (user as any).updatedAt || new Date().toISOString(),
            createdAt: (user as any).createdAt || new Date().toISOString(),
          } as User)
      return { kind: 'employer', user: userObj, employer }
    }

    // User exists but no matching profile found
    // If user is from users collection, use it directly
    if ('role' in user) {
      if (process.env.NODE_ENV === 'development') {
        console.log('[getCurrentUserType] User from users collection but no candidate/employer profile found, returning unknown')
      }
      return { kind: 'unknown', user: user as User }
    }
    
    // Otherwise create a minimal User object
    if (process.env.NODE_ENV === 'development') {
      console.log('[getCurrentUserType] User exists but no matching profile found, returning unknown')
    }
    const userObj: User = {
      id: user.id,
      email: user.email,
      role: 'user',
      updatedAt: (user as any).updatedAt || new Date().toISOString(),
      createdAt: (user as any).createdAt || new Date().toISOString(),
    } as User
    return { kind: 'unknown', user: userObj }
  } catch (error) {
    console.error('[getCurrentUserType] Error getting current user type:', error)
    return null
  }
}

