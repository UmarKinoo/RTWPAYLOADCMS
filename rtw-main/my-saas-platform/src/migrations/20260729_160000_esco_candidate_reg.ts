import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Creates ESCO demo-cand-reg collections that were added via local schema push
 * but never shipped as a Payload migration. Production has push disabled, so
 * without this migration inserts into candidate_occupations (and related tables)
 * fail with: relation "candidate_occupations" does not exist.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_occupations_source" AS ENUM('candidate-declared', 'unmapped');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_occupations_verification_status" AS ENUM('unverified', 'verified', 'rejected');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_occupation_skills_skill_type" AS ENUM('essential', 'optional');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_occupation_skills_verification_status" AS ENUM('unverified', 'verified', 'rejected');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_qualification_templates_status" AS ENUM('active', 'disabled');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_qualification_templates_questions_category" AS ENUM('experience', 'tasks', 'equipment', 'licence', 'environment', 'verification', 'availability');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_qualification_templates_questions_type" AS ENUM('single_select', 'multi_select', 'yes_no', 'number_range', 'date', 'short_text');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_qualification_templates_questions_show_when_operator" AS ENUM('equals', 'includes', 'not_equals');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      CREATE TYPE "public"."enum_candidate_qualification_answers_status" AS ENUM('candidate-declared', 'verified', 'rejected');
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE TABLE IF NOT EXISTS "candidate_occupations" (
      "id" serial PRIMARY KEY NOT NULL,
      "session_id" varchar NOT NULL,
      "esco_uri" varchar,
      "preferred_label" varchar NOT NULL,
      "language" varchar DEFAULT 'en' NOT NULL,
      "original_wording" varchar,
      "source" "enum_candidate_occupations_source" DEFAULT 'candidate-declared' NOT NULL,
      "custom_title" varchar,
      "verification_status" "enum_candidate_occupations_verification_status" DEFAULT 'unverified' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "candidate_occupation_skills" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_occupation_id" integer NOT NULL,
      "esco_skill_uri" varchar NOT NULL,
      "skill_label" varchar NOT NULL,
      "skill_type" "enum_candidate_occupation_skills_skill_type" NOT NULL,
      "candidate_selected" boolean DEFAULT true NOT NULL,
      "verification_status" "enum_candidate_occupation_skills_verification_status" DEFAULT 'unverified' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "qualification_templates" (
      "id" serial PRIMARY KEY NOT NULL,
      "esco_uri" varchar NOT NULL,
      "occupation_label" varchar NOT NULL,
      "language" varchar DEFAULT 'en' NOT NULL,
      "prompt_version" varchar DEFAULT '1.0' NOT NULL,
      "schema_version" varchar DEFAULT '1' NOT NULL,
      "esco_checksum" varchar NOT NULL,
      "status" "enum_qualification_templates_status" DEFAULT 'active' NOT NULL,
      "generated_at" timestamp(3) with time zone NOT NULL,
      "last_used_at" timestamp(3) with time zone,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "qualification_templates_questions" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "question_id" varchar NOT NULL,
      "category" "enum_qualification_templates_questions_category" NOT NULL,
      "type" "enum_qualification_templates_questions_type" NOT NULL,
      "label" varchar NOT NULL,
      "required" boolean DEFAULT true,
      "order" numeric DEFAULT 0 NOT NULL,
      "show_when_question_id" varchar,
      "show_when_operator" "enum_qualification_templates_questions_show_when_operator",
      "show_when_value" varchar
    );

    CREATE TABLE IF NOT EXISTS "qualification_templates_questions_options" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "value" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "qualification_templates_questions_source_skill_uris" (
      "_order" integer NOT NULL,
      "_parent_id" varchar NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "uri" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "candidate_qualification_answers" (
      "id" serial PRIMARY KEY NOT NULL,
      "candidate_occupation_id" integer NOT NULL,
      "template_id" integer,
      "question_id" varchar NOT NULL,
      "answer" jsonb NOT NULL,
      "status" "enum_candidate_qualification_answers_status" DEFAULT 'candidate-declared' NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "esco_search_logs" (
      "id" serial PRIMARY KEY NOT NULL,
      "original_input" varchar NOT NULL,
      "detected_language" varchar,
      "ai_search_terms" jsonb,
      "esco_queries" jsonb,
      "result_count" numeric,
      "top_result_uris" jsonb,
      "selected_occupation_uri" varchar,
      "selected_occupation_label" varchar,
      "not_listed" boolean DEFAULT false,
      "custom_title" varchar,
      "duration_ms" numeric,
      "ai_failed" boolean DEFAULT false,
      "esco_failed" boolean DEFAULT false,
      "session_id" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "esco_query_cache" (
      "id" serial PRIMARY KEY NOT NULL,
      "input_hash" varchar NOT NULL,
      "input" varchar NOT NULL,
      "detected_language" varchar,
      "search_terms" jsonb NOT NULL,
      "expires_at" timestamp(3) with time zone NOT NULL,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "esco_aliases" (
      "id" serial PRIMARY KEY NOT NULL,
      "alias_term" varchar NOT NULL,
      "active" boolean DEFAULT true,
      "notes" varchar,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "esco_aliases_search_terms" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "term" varchar NOT NULL
    );

    CREATE TABLE IF NOT EXISTS "esco_aliases_pinned_occupation_uris" (
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL,
      "id" varchar PRIMARY KEY NOT NULL,
      "uri" varchar NOT NULL
    );

    -- Foreign keys (ignore if already present from local push)
    DO $$ BEGIN
      ALTER TABLE "candidate_occupation_skills"
        ADD CONSTRAINT "candidate_occupation_skills_candidate_occupation_id_candidate_o"
        FOREIGN KEY ("candidate_occupation_id") REFERENCES "public"."candidate_occupations"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "qualification_templates_questions"
        ADD CONSTRAINT "qualification_templates_questions_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."qualification_templates"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "qualification_templates_questions_options"
        ADD CONSTRAINT "qualification_templates_questions_options_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."qualification_templates_questions"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "qualification_templates_questions_source_skill_uris"
        ADD CONSTRAINT "qualification_templates_questions_source_skill_uris_parent_id_f"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."qualification_templates_questions"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_qualification_answers"
        ADD CONSTRAINT "candidate_qualification_answers_candidate_occupation_id_candida"
        FOREIGN KEY ("candidate_occupation_id") REFERENCES "public"."candidate_occupations"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "candidate_qualification_answers"
        ADD CONSTRAINT "candidate_qualification_answers_template_id_qualification_templ"
        FOREIGN KEY ("template_id") REFERENCES "public"."qualification_templates"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "esco_aliases_search_terms"
        ADD CONSTRAINT "esco_aliases_search_terms_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."esco_aliases"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    DO $$ BEGIN
      ALTER TABLE "esco_aliases_pinned_occupation_uris"
        ADD CONSTRAINT "esco_aliases_pinned_occupation_uris_parent_id_fk"
        FOREIGN KEY ("_parent_id") REFERENCES "public"."esco_aliases"("id")
        ON DELETE cascade ON UPDATE no action;
    EXCEPTION WHEN duplicate_object THEN null; END $$;

    CREATE INDEX IF NOT EXISTS "candidate_occupations_session_id_idx" ON "candidate_occupations" USING btree ("session_id");
    CREATE INDEX IF NOT EXISTS "candidate_occupations_esco_uri_idx" ON "candidate_occupations" USING btree ("esco_uri");
    CREATE INDEX IF NOT EXISTS "candidate_occupations_updated_at_idx" ON "candidate_occupations" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "candidate_occupations_created_at_idx" ON "candidate_occupations" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "candidate_occupation_skills_candidate_occupation_idx" ON "candidate_occupation_skills" USING btree ("candidate_occupation_id");
    CREATE INDEX IF NOT EXISTS "candidate_occupation_skills_esco_skill_uri_idx" ON "candidate_occupation_skills" USING btree ("esco_skill_uri");
    CREATE INDEX IF NOT EXISTS "candidate_occupation_skills_updated_at_idx" ON "candidate_occupation_skills" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "candidate_occupation_skills_created_at_idx" ON "candidate_occupation_skills" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "qualification_templates_esco_uri_idx" ON "qualification_templates" USING btree ("esco_uri");
    CREATE INDEX IF NOT EXISTS "qualification_templates_language_idx" ON "qualification_templates" USING btree ("language");
    CREATE INDEX IF NOT EXISTS "qualification_templates_updated_at_idx" ON "qualification_templates" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "qualification_templates_created_at_idx" ON "qualification_templates" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "qualification_templates_questions_order_idx" ON "qualification_templates_questions" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "qualification_templates_questions_parent_id_idx" ON "qualification_templates_questions" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "qualification_templates_questions_options_order_idx" ON "qualification_templates_questions_options" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "qualification_templates_questions_options_parent_id_idx" ON "qualification_templates_questions_options" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "qualification_templates_questions_source_skill_uris_order_idx" ON "qualification_templates_questions_source_skill_uris" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "qualification_templates_questions_source_skill_uris_parent_id_i" ON "qualification_templates_questions_source_skill_uris" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "candidate_qualification_answers_candidate_occupation_idx" ON "candidate_qualification_answers" USING btree ("candidate_occupation_id");
    CREATE INDEX IF NOT EXISTS "candidate_qualification_answers_template_idx" ON "candidate_qualification_answers" USING btree ("template_id");
    CREATE INDEX IF NOT EXISTS "candidate_qualification_answers_question_id_idx" ON "candidate_qualification_answers" USING btree ("question_id");
    CREATE INDEX IF NOT EXISTS "candidate_qualification_answers_updated_at_idx" ON "candidate_qualification_answers" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "candidate_qualification_answers_created_at_idx" ON "candidate_qualification_answers" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "esco_search_logs_updated_at_idx" ON "esco_search_logs" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "esco_search_logs_created_at_idx" ON "esco_search_logs" USING btree ("created_at");

    CREATE UNIQUE INDEX IF NOT EXISTS "esco_query_cache_input_hash_idx" ON "esco_query_cache" USING btree ("input_hash");
    CREATE INDEX IF NOT EXISTS "esco_query_cache_updated_at_idx" ON "esco_query_cache" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "esco_query_cache_created_at_idx" ON "esco_query_cache" USING btree ("created_at");

    CREATE UNIQUE INDEX IF NOT EXISTS "esco_aliases_alias_term_idx" ON "esco_aliases" USING btree ("alias_term");
    CREATE INDEX IF NOT EXISTS "esco_aliases_updated_at_idx" ON "esco_aliases" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "esco_aliases_created_at_idx" ON "esco_aliases" USING btree ("created_at");

    CREATE INDEX IF NOT EXISTS "esco_aliases_search_terms_order_idx" ON "esco_aliases_search_terms" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "esco_aliases_search_terms_parent_id_idx" ON "esco_aliases_search_terms" USING btree ("_parent_id");

    CREATE INDEX IF NOT EXISTS "esco_aliases_pinned_occupation_uris_order_idx" ON "esco_aliases_pinned_occupation_uris" USING btree ("_order");
    CREATE INDEX IF NOT EXISTS "esco_aliases_pinned_occupation_uris_parent_id_idx" ON "esco_aliases_pinned_occupation_uris" USING btree ("_parent_id");
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TABLE IF EXISTS "esco_aliases_pinned_occupation_uris" CASCADE;
    DROP TABLE IF EXISTS "esco_aliases_search_terms" CASCADE;
    DROP TABLE IF EXISTS "esco_aliases" CASCADE;
    DROP TABLE IF EXISTS "esco_query_cache" CASCADE;
    DROP TABLE IF EXISTS "esco_search_logs" CASCADE;
    DROP TABLE IF EXISTS "candidate_qualification_answers" CASCADE;
    DROP TABLE IF EXISTS "qualification_templates_questions_source_skill_uris" CASCADE;
    DROP TABLE IF EXISTS "qualification_templates_questions_options" CASCADE;
    DROP TABLE IF EXISTS "qualification_templates_questions" CASCADE;
    DROP TABLE IF EXISTS "qualification_templates" CASCADE;
    DROP TABLE IF EXISTS "candidate_occupation_skills" CASCADE;
    DROP TABLE IF EXISTS "candidate_occupations" CASCADE;

    DROP TYPE IF EXISTS "public"."enum_candidate_qualification_answers_status";
    DROP TYPE IF EXISTS "public"."enum_qualification_templates_questions_show_when_operator";
    DROP TYPE IF EXISTS "public"."enum_qualification_templates_questions_type";
    DROP TYPE IF EXISTS "public"."enum_qualification_templates_questions_category";
    DROP TYPE IF EXISTS "public"."enum_qualification_templates_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_occupation_skills_verification_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_occupation_skills_skill_type";
    DROP TYPE IF EXISTS "public"."enum_candidate_occupations_verification_status";
    DROP TYPE IF EXISTS "public"."enum_candidate_occupations_source";
  `)
}
