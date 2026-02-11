/**
 * Add 'blog-editor' role to users enum.
 * Blog editors can log in to Payload admin and access only Posts, Categories, and Media.
 */
import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    ALTER TYPE "public"."enum_users_role" ADD VALUE IF NOT EXISTS 'blog-editor';
  `)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  // PostgreSQL does not support removing enum values. The new value will remain
  // in the schema but won't be used. Existing users with blog-editor role would
  // need to be updated manually before downgrading.
}
