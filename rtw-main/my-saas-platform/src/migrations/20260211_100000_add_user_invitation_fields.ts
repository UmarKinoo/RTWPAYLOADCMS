/**
 * Add invitation fields to users table for "send invitation" flow.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitation_token" text;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitation_expires" timestamp(3) with time zone;
    ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "invitation_sent_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "users" DROP COLUMN IF EXISTS "invitation_token";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "invitation_expires";
    ALTER TABLE "users" DROP COLUMN IF EXISTS "invitation_sent_at";
  `)
}
