import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Other-job signup stores customOtherJob without a skills-tree primarySkill.
 * Production still had NOT NULL on candidates.primary_skill_id — drop it.
 */
export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "candidates"
      ALTER COLUMN "primary_skill_id" DROP NOT NULL;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // Only re-impose NOT NULL if every row has a skill (otherwise down would fail).
  await db.execute(sql`
    DO $$ BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM "candidates" WHERE "primary_skill_id" IS NULL
      ) THEN
        ALTER TABLE "candidates"
          ALTER COLUMN "primary_skill_id" SET NOT NULL;
      END IF;
    END $$;
  `)
}
