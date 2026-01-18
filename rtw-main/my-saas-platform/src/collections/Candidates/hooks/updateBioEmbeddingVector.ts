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
  // If this is an update and only password/auth fields changed, skip
  if (operation === 'update') {
    // Check what fields were actually updated
    const updateData = req.data
    if (updateData) {
      const updatedFields = Object.keys(updateData).filter(key => updateData[key] !== undefined)
      const isPasswordOnlyUpdate = 
        updatedFields.length > 0 &&
        updatedFields.every(field => 
          ['password', 'passwordResetToken', 'passwordResetExpires', 'hash', 'salt', 
           'emailVerificationToken', 'emailVerificationExpires', 'emailVerified', 'phoneVerified'].includes(field)
        )
      
      if (isPasswordOnlyUpdate) {
        // Skip vector update for password/auth-only changes to prevent timeouts
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

