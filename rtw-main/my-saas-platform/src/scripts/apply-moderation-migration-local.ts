import dotenv from 'dotenv'
import path from 'path'
import pg from 'pg'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const SQL = `
DO $$ BEGIN
  CREATE TYPE "public"."enum_candidates_profile_status" AS ENUM(
    'pending_review', 'approved', 'rejected', 'needs_changes'
  );
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "profile_status" "enum_candidates_profile_status" DEFAULT 'pending_review';

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "moderation_submitted_at" timestamp(3) with time zone;

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "moderation_reviewed_at" timestamp(3) with time zone;

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "moderation_reviewed_by_id" integer;

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "moderation_rejection_reason" varchar;

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "moderation_moderator_notes" varchar;

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "moderation_last_reminder_sent_at" timestamp(3) with time zone;

ALTER TABLE "candidates"
  ADD COLUMN IF NOT EXISTS "moderation_moderator_notified_at" timestamp(3) with time zone;

DO $$ BEGIN
  ALTER TABLE "candidates"
    ADD CONSTRAINT "candidates_moderation_reviewed_by_id_users_id_fk"
    FOREIGN KEY ("moderation_reviewed_by_id")
    REFERENCES "public"."users"("id")
    ON DELETE set null ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE INDEX IF NOT EXISTS "candidates_profile_status_idx"
  ON "candidates" USING btree ("profile_status");

UPDATE "candidates"
SET "profile_status" = 'approved';
`

async function main() {
  const connectionString =
    process.env.DATABASE_URI || process.env.DATABASE_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres'
  const pool = new pg.Pool({ connectionString })
  await pool.query(SQL)
  await pool.end()
  console.log('✅ Candidate profile moderation migration applied')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
