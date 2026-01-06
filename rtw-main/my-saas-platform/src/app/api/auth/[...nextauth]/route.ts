/**
 * NextAuth (Auth.js) Route Handler
 * 
 * Handles OAuth authentication with Google.
 * Bridges OAuth to Payload Auth by creating/linking users and generating
 * short-lived tokens for Pattern A endpoint.
 */

import NextAuth from 'next-auth'
// import Google from 'next-auth/providers/google'
import { getPayload } from 'payload'
import config from '@payload-config'
import { randomBytes } from 'crypto'
import type { User, Candidate, Employer } from '@/payload-types'

const { handlers } = NextAuth({
  providers: [
    // Google login temporarily commented out - will be re-enabled later
    // Google({
    //   clientId: process.env.GOOGLE_CLIENT_ID!,
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    //   authorization: {
    //     params: {
    //       scope: 'openid email profile',
    //     },
    //   },
    // }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Extract verified email from provider
      const email = user.email || profile?.email

      if (!email) {
        console.error('Social login: No email provided by OAuth provider')
        return false // Block login if no email
      }

      try {
        const payload = await getPayload({ config })

        // Check if provider account is already linked to a different user
        if (account?.providerAccountId) {
          // This is a simplified check - in production you might want to store
          // provider account IDs in a separate table for better tracking
          // For now, we rely on email matching
        }

        // Find existing user by email across all collections
        let existingUser: User | Candidate | Employer | null = null
        let userCollection: 'users' | 'candidates' | 'employers' = 'users'

        // Try users collection first
        try {
          const users = await payload.find({
            collection: 'users',
            where: {
              email: {
                equals: email,
              },
            },
            limit: 1,
          })
          if (users.docs.length > 0) {
            existingUser = users.docs[0] as User
            userCollection = 'users'
          }
        } catch {
          // Not found in users
        }

        // Try candidates collection
        if (!existingUser) {
          try {
            const candidates = await payload.find({
              collection: 'candidates',
              where: {
                email: {
                  equals: email,
                },
              },
              limit: 1,
            })
            if (candidates.docs.length > 0) {
              existingUser = candidates.docs[0] as Candidate
              userCollection = 'candidates'
            }
          } catch {
            // Not found in candidates
          }
        }

        // Try employers collection
        if (!existingUser) {
          try {
            const employers = await payload.find({
              collection: 'employers',
              where: {
                email: {
                  equals: email,
                },
              },
              limit: 1,
            })
            if (employers.docs.length > 0) {
              existingUser = employers.docs[0] as Employer
              userCollection = 'employers'
            }
          } catch {
            // Not found in employers
          }
        }

        // If user exists, link provider (no password update needed for social login)
        if (existingUser) {
          // User already exists - allow sign in
          // Store user ID for JWT callback
          user.id = String(existingUser.id)
          // Note: We don't store provider tokens or account IDs in Payload
          // The email is the link between OAuth and Payload user
          return true
        }

        // User doesn't exist - create new user in 'users' collection
        // Generate a random secure password (user will never need it - social login only)
        const randomPassword = randomBytes(32).toString('hex')
        const newUser = await payload.create({
          collection: 'users',
          data: {
            email,
            password: randomPassword, // Random password - user will use social login only
            role: 'user', // Default role (can be updated during onboarding)
            emailVerified: true, // OAuth emails are pre-verified
            // Note: onboardingComplete field doesn't exist in Users collection
            // We'll handle onboarding check in the callback page
          },
        })

        // Store user ID for JWT callback
        user.id = String(newUser.id)

        return true
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error'
        console.error('Social login: Error in signIn callback', errorMessage)
        return false
      }
    },
    async jwt({ token, user, account, profile }) {
      // Store user email and ID in token for later use
      if (user) {
        token.email = user.email
        token.userId = user.id
      }
      return token
    },
    async session({ session, token }) {
      // Add user ID to session for Pattern A token generation
      if (session.user && token.userId) {
        session.user.id = token.userId as string
        session.user.email = token.email as string
      }
      return session
    },
  },
  pages: {
    signIn: '/login', // Custom sign-in page
    error: '/login', // Error page
  },
  session: {
    strategy: 'jwt', // Use JWT strategy (no database sessions)
    maxAge: 5 * 60, // 5 minutes - short-lived, just for OAuth flow
  },
  secret: process.env.NEXTAUTH_SECRET,
})

// Only export handlers for Next.js route - other exports cause TypeScript errors in Next.js 16
export const { GET, POST } = handlers

