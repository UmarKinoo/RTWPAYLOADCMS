-- Tracking table for custom SQL migrations (supabase/migrations/*.sql)
-- Created by db:migrate runner if not exists
CREATE TABLE IF NOT EXISTS app_migrations (
  name TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
