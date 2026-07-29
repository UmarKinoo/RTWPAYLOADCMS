import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Links candidate_occupations to the main candidates collection so the
 * demo-cand-reg flow can claim anonymous session data when the candidate
 * creates their account.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidate_occupations" ADD COLUMN IF NOT EXISTS "candidate_id" integer;

    DO $$ BEGIN
      ALTER TABLE "candidate_occupations"
        ADD CONSTRAINT "candidate_occupations_candidate_id_candidates_id_fk"
        FOREIGN KEY ("candidate_id") REFERENCES "public"."candidates"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "candidate_occupations_candidate_idx"
      ON "candidate_occupations" USING btree ("candidate_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidate_occupations" DROP CONSTRAINT IF EXISTS "candidate_occupations_candidate_id_candidates_id_fk";
    DROP INDEX IF EXISTS "candidate_occupations_candidate_idx";
    ALTER TABLE "candidate_occupations" DROP COLUMN IF EXISTS "candidate_id";
  `)
}
