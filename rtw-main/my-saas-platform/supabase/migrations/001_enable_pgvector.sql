-- Enable pgvector extension only.
-- skills/candidates vector columns and indexes are added in 015_pgvector_columns.sql
-- (after Payload tables exist) or via Payload schema push + pnpm db:migrate.
CREATE EXTENSION IF NOT EXISTS vector;
