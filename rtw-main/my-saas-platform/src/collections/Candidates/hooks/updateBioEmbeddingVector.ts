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
  // Check if context flag is set to skip vector updates (e.g., for auth operations)
  if (req.context?.skipVectorUpdate) {
    req.payload.logger.info(`Skipping bio_embedding_vec update for candidate ${doc.id} (skipVectorUpdate flag set)`)
    return doc
  }
  
  // Skip vector update for password/auth-only updates to prevent timeouts
  // This is critical for auth operations like password reset
  if (operation === 'update') {
    // Define auth-only fields that should skip vector updates
    const authFields = [
      'password', 
      'passwordResetToken', 
      'passwordResetExpires', 
      'hash', 
      'salt', 
      'emailVerificationToken', 
      'emailVerificationExpires', 
      'emailVerified', 
      'phoneVerified',
    ]
    
    // First, check req.data - this is the most reliable source for what was actually updated
    const updateData = req.data as Record<string, any> | undefined
    if (updateData) {
      const updatedFields = Object.keys(updateData).filter(key => updateData[key] !== undefined)
      const bioEmbeddingWasUpdated = 'bio_embedding' in updateData
      
      // If bio_embedding was not updated AND we have auth fields in the update, skip
      if (!bioEmbeddingWasUpdated && updatedFields.length > 0) {
        const hasAuthFields = updatedFields.some(field => authFields.includes(field))
        const hasOnlyAuthFields = updatedFields.every(field => authFields.includes(field) || field === 'updatedAt')
        
        // If any auth field is present and bio_embedding wasn't updated, skip
        if (hasAuthFields || hasOnlyAuthFields) {
          req.payload.logger.info(`Skipping bio_embedding_vec update for candidate ${doc.id} (auth-only update: ${updatedFields.join(', ')})`)
          return doc
        }
      }
    }
    
    // Fallback: Compare previousDoc with doc to detect auth-only changes
    if (previousDoc) {
      // Check if bio_embedding changed
      const bioEmbeddingChanged = 
        JSON.stringify(doc.bio_embedding) !== JSON.stringify(previousDoc.bio_embedding)
      
      // If bio_embedding didn't change, check what did change
      if (!bioEmbeddingChanged) {
        // Quick check: if password reset fields changed, skip
        if (doc.passwordResetToken !== previousDoc.passwordResetToken ||
            doc.passwordResetExpires !== previousDoc.passwordResetExpires ||
            doc.emailVerificationToken !== previousDoc.emailVerificationToken ||
            doc.emailVerified !== previousDoc.emailVerified ||
            doc.phoneVerified !== previousDoc.phoneVerified) {
          req.payload.logger.info(`Skipping bio_embedding_vec update for candidate ${doc.id} (detected auth field changes)`)
          return doc
        }
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

    // Update the vector column with a timeout to prevent hanging
    // Use a promise race to add a 5-second timeout
    const updatePromise = dbQuery(
      `UPDATE candidates SET bio_embedding_vec = $1::vector(1536) WHERE id = $2`,
      [vectorLiteral, doc.id]
    )
    
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Vector update timeout after 5 seconds')), 5000)
    )
    
    try {
      await Promise.race([updatePromise, timeoutPromise])
      
      if (operation === 'create') {
        req.payload.logger.info(`Updated bio_embedding_vec for new candidate ${doc.id}`)
      }
    } catch (timeoutError) {
      // If timeout, log but don't fail the operation
      req.payload.logger.warn(`Timeout updating bio_embedding_vec for candidate ${doc.id}: ${timeoutError instanceof Error ? timeoutError.message : String(timeoutError)}`)
    }
  } catch (error) {
    // Don't fail the operation if vector update fails
    // This is a non-critical operation - the JSONB column still works
    req.payload.logger.warn(`Error updating bio_embedding_vec for candidate ${doc.id}: ${error instanceof Error ? error.message : String(error)}`)
  }

  return doc
}

