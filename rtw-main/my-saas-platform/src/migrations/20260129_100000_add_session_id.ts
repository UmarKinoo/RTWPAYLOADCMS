/**
 * Add session_id to auth collections (single-session: DB.sessionId === cookie rtw-sid).
 * Rotate on login → old browser's cookie no longer matches → instant logout on next request.
 * Safe to run on existing DBs: uses ADD COLUMN IF NOT EXISTS.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "session_id" text;
    ALTER TABLE "candidates" ADD COLUMN IF NOT EXISTS "session_id" text;
    ALTER TABLE "employers" ADD COLUMN IF NOT EXISTS "session_id" text;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "session_id";
    ALTER TABLE "candidates" DROP COLUMN IF EXISTS "session_id";
    ALTER TABLE "employers" DROP COLUMN IF EXISTS "session_id";
  `)
}
