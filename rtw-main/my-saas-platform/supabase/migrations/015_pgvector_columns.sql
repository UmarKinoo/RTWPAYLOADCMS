-- Vector columns + HNSW indexes (run after Payload has created skills/candidates tables).
-- Safe on db:migrate; skipped automatically if tables do not exist yet.

DO $outer$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'skills'
  ) THEN
    ALTER TABLE skills
      ADD COLUMN IF NOT EXISTS name_embedding_vec vector(1536);

    CREATE INDEX IF NOT EXISTS skills_name_embedding_vec_hnsw
      ON skills
      USING hnsw (name_embedding_vec vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'candidates'
  ) THEN
    ALTER TABLE candidates
      ADD COLUMN IF NOT EXISTS bio_embedding_vec vector(1536);

    CREATE INDEX IF NOT EXISTS candidates_bio_embedding_vec_hnsw
      ON candidates
      USING hnsw (bio_embedding_vec vector_cosine_ops)
      WITH (m = 16, ef_construction = 64);
  END IF;
END
$outer$;
