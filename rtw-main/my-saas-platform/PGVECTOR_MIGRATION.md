# pgvector Migration Guide

This document provides step-by-step instructions for migrating SkillSearch from JavaScript cosine similarity to pgvector similarity search in Supabase.

## Overview

The migration replaces in-memory cosine similarity calculations with PostgreSQL pgvector operations, improving performance and scalability.

## Prerequisites

- Supabase Postgres database (local or cloud)
- `pgvector` extension available in your database
- Existing skills with `name_embedding` (JSONB) populated

## Step 1: Install Dependencies

Add the `pg` package for direct PostgreSQL access:

```bash
pnpm add pg
pnpm add -D @types/pg
```

## Step 2: Run SQL Migration

Execute the SQL migration in Supabase SQL Editor:

**File**: `supabase/migrations/001_enable_pgvector.sql`

```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add vector columns to skills table
ALTER TABLE skills 
  ADD COLUMN IF NOT EXISTS name_embedding_vec vector(1536);

-- Add vector columns to candidates table (optional, for future use)
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS bio_embedding_vec vector(1536);

-- Create HNSW indexes for cosine similarity search
CREATE INDEX IF NOT EXISTS skills_name_embedding_vec_hnsw
  ON skills 
  USING hnsw (name_embedding_vec vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Index for candidates (optional, for future use)
CREATE INDEX IF NOT EXISTS candidates_bio_embedding_vec_hnsw
  ON candidates 
  USING hnsw (bio_embedding_vec vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);
```

**How to run:**
1. Open Supabase Dashboard → SQL Editor
2. Copy and paste the SQL above
3. Click "Run" or press Ctrl+Enter
4. Verify no errors occurred

## Step 3: Backfill Existing Embeddings

Run the backfill script to migrate JSONB embeddings to vector columns:

```bash
pnpm tsx src/scripts/backfill-pgvector.ts
```

The script will:
- Find all skills with `name_embedding` (JSONB) but NULL `name_embedding_vec`
- Convert JSON arrays to pgvector format
- Update the `name_embedding_vec` column
- Provide progress and verification statistics

**Note**: The script is idempotent and safe to re-run.

## Step 4: Verify Migration

### SQL Verification Queries

Run these queries in Supabase SQL Editor to verify the setup:

#### 1. Check pgvector extension is installed:
```sql
SELECT * FROM pg_extension WHERE extname = 'vector';
```

Expected: Should return one row with `extname = 'vector'`

#### 2. Check vector columns exist:
```sql
SELECT 
  column_name, 
  data_type, 
  udt_name
FROM information_schema.columns 
WHERE table_name = 'skills' 
  AND column_name LIKE '%embedding%';
```

Expected: Should show both `name_embedding` (jsonb) and `name_embedding_vec` (USER-DEFINED/vector)

#### 3. Check indexes exist:
```sql
SELECT 
  indexname, 
  indexdef
FROM pg_indexes 
WHERE tablename = 'skills' 
  AND indexname LIKE '%embedding%';
```

Expected: Should show `skills_name_embedding_vec_hnsw` index

#### 4. Check data population:
```sql
SELECT 
  COUNT(*) as total_skills,
  COUNT(name_embedding) as with_jsonb_embedding,
  COUNT(name_embedding_vec) as with_vector_embedding,
  COUNT(*) FILTER (WHERE name_embedding IS NOT NULL AND name_embedding_vec IS NULL) as needs_backfill
FROM skills;
```

Expected: `needs_backfill` should be 0 after backfill completes

#### 5. Test vector similarity query:
```sql
-- Get a sample embedding from an existing skill
SELECT name_embedding_vec 
FROM skills 
WHERE name_embedding_vec IS NOT NULL 
LIMIT 1;

-- Use that vector to test similarity search (replace with actual vector from above)
-- Example (use actual vector from previous query):
SELECT 
  id,
  name,
  name_embedding_vec <=> '[0.1,0.2,...]'::vector(1536) as distance
FROM skills
WHERE name_embedding_vec IS NOT NULL
ORDER BY distance
LIMIT 5;
```

## Step 5: Manual Testing Checklist

### Test 1: Search with OpenAI Key Enabled

1. Ensure `OPENAI_API_KEY` is set in `.env`
2. Start the development server: `pnpm dev`
3. Navigate to candidate registration (Job Role step)
4. Type a search query (e.g., "JavaScript", "React", "Python")
5. Verify:
   - ✅ Results appear quickly
   - ✅ Results are semantically relevant
   - ✅ Response format matches expected shape:
     ```json
     {
       "skills": [
         {
           "id": "123",
           "name": "JavaScript",
           "billingClass": "A",
           "subCategory": "Frontend",
           "category": "Web Development",
           "discipline": "Software Engineering",
           "fullPath": "Software Engineering > Web Development > Frontend > JavaScript"
         }
       ]
     }
     ```

### Test 2: Search with OpenAI Key Missing

1. Temporarily remove or rename `OPENAI_API_KEY` in `.env`
2. Restart the development server
3. Navigate to candidate registration (Job Role step)
4. Type a search query
5. Verify:
   - ✅ Falls back to text search (contains query on name/group_text)
   - ✅ Results still appear
   - ✅ Response format unchanged

### Test 3: Verify No Client-Side Changes

1. Check browser console for errors
2. Verify SkillSearch component works as before
3. Verify AbortController still works (rapid typing should cancel previous requests)

## Troubleshooting

### Issue: "extension 'vector' does not exist"

**Solution**: Run `CREATE EXTENSION vector;` in Supabase SQL Editor

### Issue: "column 'name_embedding_vec' does not exist"

**Solution**: Run the ALTER TABLE statements from Step 2

### Issue: "operator does not exist: vector <=> vector"

**Solution**: Ensure pgvector extension is installed and vector columns are type `vector(1536)`

### Issue: Backfill script fails with "Invalid embedding length"

**Solution**: 
- Check that embeddings are 1536 dimensions (text-embedding-3-small)
- Verify JSONB data is valid: `SELECT name_embedding FROM skills WHERE id = '...'`

### Issue: Search returns no results

**Solution**:
- Verify backfill completed: `SELECT COUNT(*) FROM skills WHERE name_embedding_vec IS NOT NULL`
- Check that query embedding generation succeeds (check server logs)
- Verify vector column is populated: `SELECT name_embedding_vec IS NOT NULL FROM skills LIMIT 1`

### Issue: Performance is slow

**Solution**:
- Verify HNSW index exists: `SELECT * FROM pg_indexes WHERE indexname LIKE '%hnsw%'`
- Check index is being used: `EXPLAIN ANALYZE SELECT ... ORDER BY name_embedding_vec <=> ...`
- Consider increasing index parameters (m, ef_construction) for larger datasets

## Files Changed/Added

### New Files:
1. `supabase/migrations/001_enable_pgvector.sql` - SQL migration
2. `src/lib/db.ts` - Server-side database client utility
3. `src/scripts/backfill-pgvector.ts` - Backfill script
4. `PGVECTOR_MIGRATION.md` - This documentation

### Modified Files:
1. `src/app/api/skills/search/route.ts` - Updated to use pgvector instead of JS cosine similarity

### Dependencies Added:
- `pg` - PostgreSQL client for Node.js
- `@types/pg` - TypeScript types for pg

## Performance Benefits

- **Before**: Loaded all skills (1000+) into memory, computed cosine similarity in JS
- **After**: Database performs similarity search using optimized HNSW index
- **Result**: Faster queries, lower memory usage, better scalability

## Next Steps (Optional)

1. Migrate candidate `bio_embedding` to `bio_embedding_vec` (similar process)
2. Add vector similarity search for candidate matching
3. Monitor query performance and adjust index parameters if needed

