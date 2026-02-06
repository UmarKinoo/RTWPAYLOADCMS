/**
 * Purchases: add paymentGatewayId, status options (pending, failed), source (myfatoorah).
 * Required for MyFatoorah payment gateway integration.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "purchases" ADD COLUMN IF NOT EXISTS "payment_gateway_id" text;
  `)
  await db.execute(sql`ALTER TYPE "enum_purchases_status" ADD VALUE 'pending'`)
  await db.execute(sql`ALTER TYPE "enum_purchases_status" ADD VALUE 'failed'`)
  await db.execute(sql`ALTER TYPE "enum_purchases_source" ADD VALUE 'myfatoorah'`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    ALTER TABLE "purchases" DROP COLUMN IF EXISTS "payment_gateway_id";
  `)
  // Postgres does not support removing enum values easily; leaving enum values in place.
}
