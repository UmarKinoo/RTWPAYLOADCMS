import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "plans"
      ADD COLUMN IF NOT EXISTS "entitlements_unlimited_interviews" boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS "entitlements_validity_days" numeric DEFAULT 30;

    ALTER TABLE "employers"
      ADD COLUMN IF NOT EXISTS "plan_expires_at" timestamp(3) with time zone;
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "plans"
      DROP COLUMN IF EXISTS "entitlements_unlimited_interviews",
      DROP COLUMN IF EXISTS "entitlements_validity_days";

    ALTER TABLE "employers"
      DROP COLUMN IF EXISTS "plan_expires_at";
  `)
}
