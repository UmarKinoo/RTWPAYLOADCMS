/**
 * Add last_login_at to auth collections (single-session: only one device logged in at a time).
 * Safe to run on existing DBs: uses ADD COLUMN IF NOT EXISTS.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp(3) with time zone;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp(3) with time zone;
    ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "last_login_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "last_login_at";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "last_login_at";
    ALTER TABLE "employers" DROP COLUMN IF EXISTS "last_login_at";
  `)
}
