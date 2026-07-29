import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Adds Payload document-lock relationship columns for the new ESCO collections.
 * The previous ESCO migration created the collection tables but not these
 * internal join columns, which breaks /admin (missing esco_aliases_id, etc.).
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "esco_aliases_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "esco_query_cache_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "esco_search_logs_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_occupations_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_occupation_skills_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "qualification_templates_id" integer;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "candidate_qualification_answers_id" integer;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_esco_aliases_fk"
        FOREIGN KEY ("esco_aliases_id") REFERENCES "public"."esco_aliases"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_esco_query_cache_fk"
        FOREIGN KEY ("esco_query_cache_id") REFERENCES "public"."esco_query_cache"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_esco_search_logs_fk"
        FOREIGN KEY ("esco_search_logs_id") REFERENCES "public"."esco_search_logs"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_candidate_occupations_fk"
        FOREIGN KEY ("candidate_occupations_id") REFERENCES "public"."candidate_occupations"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_candidate_occupation_skills_fk"
        FOREIGN KEY ("candidate_occupation_skills_id") REFERENCES "public"."candidate_occupation_skills"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_qualification_templates_fk"
        FOREIGN KEY ("qualification_templates_id") REFERENCES "public"."qualification_templates"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "payload_locked_documents_rels"
        ADD CONSTRAINT "payload_locked_documents_rels_candidate_qualification_ans_fk"
        FOREIGN KEY ("candidate_qualification_answers_id") REFERENCES "public"."candidate_qualification_answers"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_esco_aliases_id_idx"
      ON "payload_locked_documents_rels" USING btree ("esco_aliases_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_esco_query_cache_id_idx"
      ON "payload_locked_documents_rels" USING btree ("esco_query_cache_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_esco_search_logs_id_idx"
      ON "payload_locked_documents_rels" USING btree ("esco_search_logs_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_occupations_id_idx"
      ON "payload_locked_documents_rels" USING btree ("candidate_occupations_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_occupation_skill_idx"
      ON "payload_locked_documents_rels" USING btree ("candidate_occupation_skills_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_qualification_templates_id_idx"
      ON "payload_locked_documents_rels" USING btree ("qualification_templates_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_candidate_qualification_an_idx"
      ON "payload_locked_documents_rels" USING btree ("candidate_qualification_answers_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_esco_aliases_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_esco_query_cache_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_esco_search_logs_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_candidate_occupations_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_candidate_occupation_skills_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_qualification_templates_fk";
    ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT IF EXISTS "payload_locked_documents_rels_candidate_qualification_ans_fk";

    DROP INDEX IF EXISTS "payload_locked_documents_rels_esco_aliases_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_esco_query_cache_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_esco_search_logs_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_candidate_occupations_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_candidate_occupation_skill_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_qualification_templates_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_candidate_qualification_an_idx";

    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "esco_aliases_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "esco_query_cache_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "esco_search_logs_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "candidate_occupations_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "candidate_occupation_skills_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "qualification_templates_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "candidate_qualification_answers_id";
  `)
}
