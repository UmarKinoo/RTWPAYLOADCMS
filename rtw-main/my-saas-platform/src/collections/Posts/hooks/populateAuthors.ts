import type { CollectionAfterReadHook } from 'payload'
import type { User } from '@/payload-types'

function authorNameForPublic(user: User): string {
  const display = user.displayName?.trim()
  if (display) return display
  const email = user.email?.trim() || ''
  if (!email) return 'Author'
  const local = email.split('@')[0] || email
  const withoutTrailingDigits = local.replace(/\d+$/, '')
  const words = withoutTrailingDigits.split(/[._-]+/).filter(Boolean)
  if (words.length > 0) {
    return words.map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
  }
  return email
}

// The `user` collection has access control locked so that users are not publicly accessible
// This means that we need to populate the authors manually here to protect user privacy
// GraphQL will not return mutated user data that differs from the underlying schema
// So we use an alternative `populatedAuthors` field to populate the user data, hidden from the admin UI
export const populateAuthors: CollectionAfterReadHook = async ({ doc, req, req: { payload } }) => {
  if (doc?.authors && doc?.authors?.length > 0) {
    const authorDocs: User[] = []

    for (const author of doc.authors) {
      try {
        const authorDoc = await payload.findByID({
          id: typeof author === 'object' ? author?.id : author,
          collection: 'users',
          depth: 0,
        })

        if (authorDoc) {
          authorDocs.push(authorDoc)
        }

        if (authorDocs.length > 0) {
          doc.populatedAuthors = authorDocs.map((authorDoc) => ({
            id: authorDoc.id,
            name: authorNameForPublic(authorDoc),
          }))
        }
      } catch {
        // swallow error
      }
    }
  }

  return doc
}
