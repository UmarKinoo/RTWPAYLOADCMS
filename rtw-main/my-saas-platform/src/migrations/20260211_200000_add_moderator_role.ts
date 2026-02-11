/**
 * Add 'moderator' role to users enum (if missing).
 * Prod may have been created with an enum that only had admin/user/blog-editor;
 * moderator is required for createUserAndSendInvitation and staff login.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'moderator';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL does not support removing enum values.
}
