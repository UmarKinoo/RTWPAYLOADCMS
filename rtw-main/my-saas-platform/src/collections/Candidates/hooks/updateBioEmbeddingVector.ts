import type { CollectionAfterChangeHook } from 'payload'
import type { Candidate } from '../../../payload-types'
import { query as dbQuery } from '../../../lib/db'

/**
 * Update bio_embedding_vec column after candidate is created/updated
 * This handles the case where we generate the embedding in beforeChange
 * but need the candidate ID (which is only available in afterChange for creates)
 */
export const updateBioEmbeddingVector: CollectionAfterChangeHook<Candidate> = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  // Skip vector update for password/auth-only updates to prevent timeouts
  if (operation === 'update') {
    // Early return: Check if this is an auth-only update
    const updateData = req.data as Record<string, any> | undefined
    if (updateData) {
      const updatedFields = Object.keys(updateData).filter(key => updateData[key] !== undefined)
      
      // If bio_embedding was not in the update, and only auth fields were updated, skip immediately
      const bioEmbeddingWasUpdated = 'bio_embedding' in updateData
      const authFields = ['password', 'passwordResetToken', 'passwordResetExpires', 'hash', 'salt', 
                          'emailVerificationToken', 'emailVerificationExpires', 'emailVerified', 'phoneVerified']
      
      if (!bioEmbeddingWasUpdated && updatedFields.length > 0 && updatedFields.every(field => authFields.includes(field))) {
        // Skip vector update for password/auth-only changes to prevent timeouts
        req.payload.logger.info(`Skipping bio_embedding_vec update for candidate ${doc.id} (auth-only update: ${updatedFields.join(', ')})`)
        return doc
      }
    }
    
    // Also check if bio_embedding was unchanged (compare with previousDoc)
    // This is a safety check in case req.data doesn't contain all the info we need
    if (previousDoc && doc.bio_embedding && previousDoc.bio_embedding) {
      const currentBio = Array.isArray(doc.bio_embedding) ? doc.bio_embedding : []
      const previousBio = Array.isArray(previousDoc.bio_embedding) ? previousDoc.bio_embedding : []
      
      // If bio_embedding arrays are the same, skip update
      if (currentBio.length === previousBio.length && 
          currentBio.every((val, idx) => val === previousBio[idx])) {
        req.payload.logger.info(`Skipping bio_embedding_vec update for candidate ${doc.id} (bio_embedding unchanged)`)
        return doc
      }
    }
  }

  // Only update if we have bio_embedding (JSONB) and the vector column might be NULL
  if (!doc.bio_embedding || !Array.isArray(doc.bio_embedding)) {
    return doc
  }

  try {
    const embedding = doc.bio_embedding
    if (embedding.length !== 1536) {
      console.warn(`Candidate ${doc.id}: Invalid embedding length (expected 1536, got ${embedding.length})`)
      return doc
    }

    // Convert to pgvector literal format
    const vectorLiteral = '[' + embedding.join(',') + ']'

    // Update the vector column
    await dbQuery(
      `UPDATE candidates SET bio_embedding_vec = $1::vector(1536) WHERE id = $2`,
      [vectorLiteral, doc.id]
    )

    if (operation === 'create') {
      req.payload.logger.info(`Updated bio_embedding_vec for new candidate ${doc.id}`)
    }
  } catch (error) {
    // Don't fail the operation if vector update fails
    console.error(`Error updating bio_embedding_vec for candidate ${doc.id}:`, error)
  }

  return doc
}

