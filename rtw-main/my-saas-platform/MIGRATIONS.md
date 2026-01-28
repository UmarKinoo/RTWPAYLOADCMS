# Migrations (Payload + Postgres / Supabase)

Enterprise-style migration workflow: **local** uses Payload push for fast dev and can generate migrations; **production** uses migrations only (no push, no Supabase UI). Custom SQL and Payload migrations are applied in order; drift is detected via a deterministic schema snapshot.

## Scripts

| Script | Description |
|--------|-------------|
| `pnpm db:migrate` | Run custom SQL (`supabase/migrations/*.sql`) then Payload migrations. Safe to run multiple times. |
| `pnpm db:status` | Show custom SQL applied + Payload migration status. |
| `pnpm db:diff` | Compare current DB schema to `.schema-snapshot.txt`; exit 1 if drift. |
| `pnpm db:diff:write` | Write current schema to `.schema-snapshot.txt` (update baseline). |
| `pnpm migrate:create` | Create a new Payload migration (wraps `payload migrate:create`). |
| `pnpm db:reset` | **Local only.** Fresh DB: Payload migrate:fresh, drop `app_migrations`, then run `db:migrate`. |
| `pnpm ci` | Run `db:migrate` then `build` (for deploy pipelines). |

All DB scripts use `DATABASE_URI` or `DATABASE_URL` from `.env`.

---

## Daily development workflow

1. **Develop locally**  
   Use Payload’s default **push** in dev for fast iteration (schema changes apply immediately).

2. **When you’re ready to lock in schema changes**  
   - Run `pnpm migrate:create` and name the migration (e.g. “add_foo_field”).  
   - Run `pnpm db:migrate` locally so the new Payload migration is applied.  
   - Commit the new migration file(s) under `src/payload/migrations/` (and any new custom SQL under `supabase/migrations/`).

3. **Optional: refresh baseline for drift**  
   After a clean apply, run `pnpm db:diff:write` and commit `.schema-snapshot.txt` so CI drift check uses the new baseline.

---

## From push-based dev to a migration commit

1. Run `pnpm migrate:create` (e.g. “sync_schema_YYYYMMDD”).  
2. Run `pnpm db:migrate` locally.  
3. Commit the generated Payload migration file.  
4. From then on, rely on `db:migrate` in CI and production; avoid schema changes via push in production.

---

## Creating Payload migrations

- **Command:** `pnpm migrate:create`  
- **Result:** A new file under `src/payload/migrations/` (or your Payload migrations dir).  
- **Then:** Run `pnpm db:migrate` locally to apply it. Commit the new file.

---

## Adding custom SQL migrations

1. Add a new file in `supabase/migrations/` with a **sorted-by-name** prefix so order is deterministic, e.g. `015_add_my_feature.sql`.  
2. Run `pnpm db:migrate` locally.  
3. The runner applies only files not yet in `app_migrations`; each file runs in a transaction and is recorded after success.  
4. Commit the new `.sql` file.

Do **not** modify or remove a custom migration that has already been applied in any environment; add a new one if you need to change behaviour.

---

## Production deploy

- **Do:** Run `pnpm db:migrate` (or `pnpm ci`) **before** starting the new build/app.  
- **Do not:** Use Payload push or apply schema changes via Supabase UI in production.  
- Use the same `DATABASE_URI` / `DATABASE_URL` as your production Postgres (e.g. Supabase). The runner applies custom SQL in filename order, then Payload migrations.

---

## Schema drift and CI

- **Baseline:** `.schema-snapshot.txt` is a deterministic dump of the public schema (tables, columns, indexes). **Commit it** so CI can compare against it.  
- **CI (PR):** The example workflow runs migrations on a fresh Postgres, then runs `pnpm db:diff`. If the current schema differs from `.schema-snapshot.txt`, the job fails (drift).  
- **Updating the baseline:** After intentional schema changes and a successful `pnpm db:migrate`, run `pnpm db:diff:write` and commit the updated `.schema-snapshot.txt`.

---

## Troubleshooting drift

1. **CI fails with “schema drift”**  
   - Ensure all new migrations (Payload + custom SQL) are committed and that CI runs `pnpm db:migrate` before `pnpm db:diff`.  
   - If the new schema is correct, run `pnpm db:diff:write` locally and commit `.schema-snapshot.txt`.

2. **Local DB out of sync**  
   - Run `pnpm db:status` to see pending custom SQL and Payload migrations.  
   - Run `pnpm db:migrate` to apply them.  
   - If you prefer a clean slate (local only): `pnpm db:reset`, then `pnpm db:diff:write` if you want to refresh the baseline.

3. **Re-run migrations on a copy**  
   - For a DB copy (e.g. staging restored from prod), run `pnpm db:migrate`. Custom SQL is skipped for files already in `app_migrations`; Payload migrations run as usual.  
   - To re-apply all custom SQL on that copy, you would need to clear `app_migrations` (not recommended for production).

---

## Summary

- **Local:** Push for speed; create and run migrations when locking in changes; use `db:reset` only for local DB.  
- **Production:** Migrations only; run `pnpm db:migrate` before build; no push, no Supabase UI schema edits.  
- **CI:** Run migrations, then `pnpm db:diff`; fail on drift; keep `.schema-snapshot.txt` committed and update it after intentional schema changes.
