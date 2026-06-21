import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidates"
      ADD COLUMN IF NOT EXISTS "industry_experience" varchar;

    ALTER TABLE "candidates"
      ADD COLUMN IF NOT EXISTS "secondary_skill_id" integer;

    ALTER TABLE "candidates"
      ADD COLUMN IF NOT EXISTS "tertiary_skill_id" integer;

    DO $$ BEGIN
      ALTER TABLE "candidates"
        ADD CONSTRAINT "candidates_secondary_skill_id_skills_id_fk"
        FOREIGN KEY ("secondary_skill_id")
        REFERENCES "public"."skills"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    DO $$ BEGIN
      ALTER TABLE "candidates"
        ADD CONSTRAINT "candidates_tertiary_skill_id_skills_id_fk"
        FOREIGN KEY ("tertiary_skill_id")
        REFERENCES "public"."skills"("id")
        ON DELETE set null ON UPDATE no action;
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidates" DROP CONSTRAINT IF EXISTS "candidates_tertiary_skill_id_skills_id_fk";
    ALTER TABLE "candidates" DROP CONSTRAINT IF EXISTS "candidates_secondary_skill_id_skills_id_fk";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "tertiary_skill_id";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "secondary_skill_id";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "industry_experience";
  `)
}
