import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
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

    -- Grandfather existing candidates as approved (live on site)
    UPDATE "candidates"
    SET "profile_status" = 'approved'
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidates" DROP CONSTRAINT IF EXISTS "candidates_moderation_reviewed_by_id_users_id_fk";
    DROP INDEX IF EXISTS "candidates_profile_status_idx";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "moderation_moderator_notified_at";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "moderation_last_reminder_sent_at";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "moderation_moderator_notes";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "moderation_rejection_reason";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "moderation_reviewed_by_id";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "moderation_reviewed_at";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "moderation_submitted_at";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "profile_status";
    DROP TYPE IF EXISTS "public"."enum_candidates_profile_status";
  `)
}
