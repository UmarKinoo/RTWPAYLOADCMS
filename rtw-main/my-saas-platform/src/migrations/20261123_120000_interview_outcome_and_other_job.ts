import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Interview outcome tracking (who rejected) + candidate customOtherJob for signup MVP.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_interviews_rejected_by" AS ENUM('candidate', 'moderator', 'employer');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_interviews_outcome_history_actor" AS ENUM('candidate', 'moderator', 'employer', 'system');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_interviews_outcome_history_action" AS ENUM('approved', 'rejected', 'cancelled', 'accepted', 'completed');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    ALTER TABLE "interviews"
      ADD COLUMN IF NOT EXISTS "rejected_by" "public"."enum_interviews_rejected_by",
      ADD COLUMN IF NOT EXISTS "rejected_at" timestamp(3) with time zone;
  `)

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS "interviews_outcome_history" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "at" timestamp(3) with time zone,
      "actor" "public"."enum_interviews_outcome_history_actor",
      "action" "public"."enum_interviews_outcome_history_action",
      "reason" varchar,
      "note" varchar
    );
  `)

  await db.execute(sql`
    DO $$ BEGIN
      ALTER TABLE "interviews_outcome_history"
        ADD CONSTRAINT "interviews_outcome_history_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."interviews"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS "interviews_outcome_history_order_idx"
      ON "interviews_outcome_history" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "interviews_outcome_history_parent_id_idx"
      ON "interviews_outcome_history" USING btree ("_parent_id");
  `)

  await db.execute(sql`
    ALTER TABLE "candidates"
      ADD COLUMN IF NOT EXISTS "custom_other_job" varchar;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "custom_other_job";
  `)
  await db.execute(sql`
    DROP TABLE IF EXISTS "interviews_outcome_history";
  `)
  await db.execute(sql`
    ALTER TABLE "interviews"
      DROP COLUMN IF EXISTS "rejected_by",
      DROP COLUMN IF EXISTS "rejected_at";
  `)
  await db.execute(sql`
    DROP TYPE IF EXISTS "public"."enum_interviews_outcome_history_action";
    DROP TYPE IF EXISTS "public"."enum_interviews_outcome_history_actor";
    DROP TYPE IF EXISTS "public"."enum_interviews_rejected_by";
  `)
}
