/**
 * Track when a candidate accepts an interview so we persist a real update and can hide accept/reject UI.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "interviews" ADD COLUMN IF NOT EXISTS "candidate_accepted_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "interviews" DROP COLUMN IF EXISTS "candidate_accepted_at";
  `)
}
