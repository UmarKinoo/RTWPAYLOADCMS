import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds currentlyInKSA (Payload maps to currently_in_k_s_a) on candidates.
 * Required after the field was added to the Candidates collection.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidates"
      ADD COLUMN IF NOT EXISTS "currently_in_k_s_a" boolean DEFAULT true;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "currently_in_k_s_a";
  `)
}
