import type { CollectionAfterChangeHook } from 'payload'
import type { Candidate } from '../../../payload-types'
import { query as dbQuery } from '../../../lib/db'

const AUTH_FIELDS = [
  'password', 'passwordResetToken', 'passwordResetExpires', 'hash', 'salt',
  'emailVerificationToken', 'emailVerificationExpires', 'emailVerified', 'phoneVerified',
]

function shouldSkipVectorUpdate(
  req: { context?: { skipVectorUpdate?: boolean }; data?: Record<string, unknown> },
  operation: string,
  doc: Candidate,
  previousDoc: Candidate | null,
): boolean {
  if (req.context?.skipVectorUpdate) return true
  if (operation !== 'update') return false
  const data = req.data as Record<string, unknown> | undefined
  if (data) {
    const keys = Object.keys(data).filter((k) => data[k] !== undefined)
    if (keys.length === 0) return false
    if ('bio_embedding' in data) return false
    const hasAuth = keys.some((k) => AUTH_FIELDS.includes(k))
    const onlyAuth = keys.every((k) => AUTH_FIELDS.includes(k) || k === 'updatedAt')
    if (hasAuth || onlyAuth) return true
  }
  if (!previousDoc) return false
  if (JSON.stringify(doc.bio_embedding) !== JSON.stringify(previousDoc.bio_embedding)) return false
  return (
    doc.passwordResetToken !== previousDoc.passwordResetToken ||
    doc.passwordResetExpires !== previousDoc.passwordResetExpires ||
    doc.emailVerificationToken !== previousDoc.emailVerificationToken ||
    doc.emailVerified !== previousDoc.emailVerified ||
    doc.phoneVerified !== previousDoc.phoneVerified
  )
}

async function writeVectorToDb(docId: string, embedding: number[]): Promise<void> {
  const literal = '[' + embedding.join(',') + ']'
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Vector update timeout after 5 seconds')), 5000),
  )
  await Promise.race([
    dbQuery(`UPDATE candidates SET bio_embedding_vec = $1::vector(1536) WHERE id = $2`, [literal, docId]),
    timeout,
  ])
}

export const updateBioEmbeddingVector: CollectionAfterChangeHook<Candidate> = async ({
  doc,
  req,
  operation,
  previousDoc,
}) => {
  if (shouldSkipVectorUpdate(req, operation, doc, previousDoc ?? null)) {
    req.payload.logger.info(`Skipping bio_embedding_vec update for candidate ${doc.id}`)
    return doc
  }
  if (!doc.bio_embedding || !Array.isArray(doc.bio_embedding) || doc.bio_embedding.length !== 1536) {
    return doc
  }
  try {
    await writeVectorToDb(String(doc.id), doc.bio_embedding as number[])
    if (operation === 'create') {
      req.payload.logger.info(`Updated bio_embedding_vec for new candidate ${doc.id}`)
    }
  } catch (err) {
    req.payload.logger.warn(
      `Error updating bio_embedding_vec for candidate ${doc.id}: ${err instanceof Error ? err.message : String(err)}`,
    )
  }
  return doc
}

