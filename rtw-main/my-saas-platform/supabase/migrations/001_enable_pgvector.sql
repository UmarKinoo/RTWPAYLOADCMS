-- Enable pgvector extension
-- Run this in Supabase SQL Editor or via migration
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector columns to skills table
-- Note: This will be NULL for existing rows until backfill is run
ALTER TABLE skills 
  ADD COLUMN IF NOT EXISTS name_embedding_vec vector(1536);

-- Add vector columns to candidates table (optional, for future use)
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS bio_embedding_vec vector(1536);

-- Create HNSW indexes for cosine similarity search
-- HNSW is faster than IVFFlat for most use cases
CREATE INDEX IF NOT EXISTS skills_name_embedding_vec_hnsw
  ON skills 
  USING hnsw (name_embedding_vec vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for candidates (optional, for future use)
CREATE INDEX IF NOT EXISTS candidates_bio_embedding_vec_hnsw
  ON candidates 
  USING hnsw (bio_embedding_vec vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Safety notes:
-- 1. The vector columns will be NULL for existing rows until backfill completes
-- 2. The indexes will be built automatically after columns are populated
-- 3. For production: Consider running during low-traffic hours
-- 4. Monitor index build progress: SELECT * FROM pg_stat_progress_create_index;






