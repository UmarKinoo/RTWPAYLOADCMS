# Database Pattern Analysis - Historical Review

This document answers 7 questions about how database work was done historically in this project, before proposing any changes.

---

## 1️⃣ How Skills Were Originally Seeded

### Script Used
- **File**: `src/scripts/seed-skills.ts`
- **Command**: `pnpm seed:skills` (defined in `package.json`)

### Data Source
- **Format**: CSV/Excel file (`.csv` or `.xlsx`)
- **Location**: Multiple possible paths checked:
  - `skills_clean_final_strict_v4.csv`
  - `skills_FINAL_industry_standard.csv`
  - `Job Master Skills List.csv`
  - `src/scripts/skills_clean_final_strict_v4.csv`
  - `src/scripts/skills_FINAL_industry_standard.csv`
- **Parsing**: Uses `XLSX` library to read Excel/CSV files
- **Structure**: Columns include:
  - `Major Discipline` (required)
  - `Category` (optional, defaults to Discipline if missing)
  - `Subcategory` / `Subcategory / Job` (optional, defaults to Category if missing)
  - `Skill` (optional, defaults to Subcategory/Category/Discipline if missing)
  - `Class` (required: A, B, C, or D)

### Method Used
- **Payload APIs**: Uses `payload.create()` and `payload.find()` exclusively
- **No direct SQL**: All operations go through Payload CMS API
- **Hooks Enabled**: Explicitly does NOT use `disableHooks: true` because it needs the `beforeChange` hook to generate embeddings

### Duplicate Prevention
1. **Hard Reset First**: Script performs a complete deletion of all existing data before seeding:
   - Deletes in order: Candidates → Skills → SubCategories → Categories → Disciplines
   - Uses `payload.find()` with high limit (10000) and `pagination: false`
   - Deletes each document individually with `payload.delete()`

2. **In-Memory Maps**: During seeding, uses Map objects to track created entities:
   - `disciplineMap`: Maps discipline name → ID
   - `categoryMap`: Maps `"disciplineId:categoryName"` → ID
   - `subCategoryMap`: Maps `"categoryId:subCategoryName"` → ID

3. **Lookup Before Create**: For each entity, checks if it exists using `payload.find()` before creating:
   ```typescript
   const existing = await payload.find({
     collection: 'disciplines',
     where: { name: { equals: safeDisciplineName } },
     limit: 1,
   })
   ```

### Safe to Re-run?
- **Yes, but destructive**: The script performs a hard reset, deleting ALL existing data first
- **Not idempotent**: It doesn't check if data already exists and update it; it deletes everything and recreates
- **Embedding Regeneration**: The hard reset ensures embeddings are regenerated with the latest `group_text` logic

---

## 2️⃣ Source of Truth for Database Schema

### Pattern: Payload Collections Drive Schema

**Primary Source of Truth**: Payload CMS Collection Definitions

- **Location**: `src/collections/*.ts` files
- **How it works**:
  - Payload CMS uses `@payloadcms/db-postgres` adapter
  - On first run, Payload automatically creates database tables based on collection definitions
  - Schema is defined in TypeScript collection configs (fields, types, relationships)
  - Payload handles migrations automatically when collection definitions change

### Evidence
1. **No Supabase Migrations Before pgvector**: 
   - Only one migration file exists: `supabase/migrations/001_enable_pgvector.sql`
   - This was added specifically for pgvector (PostgreSQL extension + custom vector columns)

2. **Collection Definitions Drive Schema**:
   - All tables are defined in `src/collections/` (Skills, Candidates, Employers, etc.)
   - Payload adapter (`postgresAdapter`) reads these and creates/manages tables
   - No manual SQL schema files for core collections

3. **Supabase CLI Not Used for Schema**:
   - `supabase/config.toml` exists but is for local development
   - No evidence of `supabase db push` or migration commands being used
   - Supabase is used as the database host, but schema is managed by Payload

### Conclusion
- **Schema Source**: Payload Collections (`src/collections/*.ts`)
- **Database Host**: Supabase (PostgreSQL)
- **Schema Management**: Payload auto-creates tables from collections
- **Manual SQL**: Only used for PostgreSQL extensions (pgvector) that Payload doesn't support

---

## 3️⃣ How Previous DB Changes Were Applied

### Method 1: Payload Auto-Creation (Primary Method)
- **When**: Initial setup and when new collections are added
- **How**: Payload automatically creates tables when collections are defined in `payload.config.ts`
- **Why**: This is Payload's default behavior - it reads collection configs and creates corresponding database tables
- **Examples**: All core collections (Skills, Candidates, Employers, Plans, etc.)

### Method 2: Seeding Scripts (Data Only)
- **Scripts**:
  - `src/scripts/seed-skills.ts` - Seeds skills from CSV
  - `src/scripts/seed-plans.ts` - Seeds plans from inline data
  - `src/scripts/seed-disciplines.ts` - Updates existing disciplines with new fields
- **When**: 
  - Initial data population
  - Data updates (seed-disciplines updates existing records)
- **How**: Uses Payload APIs (`payload.create()`, `payload.update()`, `payload.find()`)
- **Why**: To populate initial data or update existing records
- **Schema Changes**: None - scripts only modify data, not schema

### Method 3: One-Off SQL Scripts (Extensions Only)
- **Script**: `supabase/migrations/001_enable_pgvector.sql`
- **When**: When pgvector support was needed
- **How**: Direct SQL executed via custom script (`src/scripts/run-migration.ts`)
- **Why**: Payload doesn't support PostgreSQL extensions or custom column types like `vector(1536)`
- **What it does**: 
  - Enables `vector` extension
  - Adds `name_embedding_vec vector(1536)` column (not in Payload collection)
  - Creates HNSW indexes

### Method 4: Backfill Scripts (Data Migration)
- **Script**: `src/scripts/backfill-pgvector.ts`
- **When**: After adding pgvector columns
- **How**: Uses direct SQL via `src/lib/db.ts` (bypasses Payload)
- **Why**: Need to migrate existing JSONB embeddings to vector columns
- **What it does**: Reads `name_embedding` (JSONB), converts to vector format, updates `name_embedding_vec`

### Summary Table

| Method | Purpose | Tool | Schema Changes? | Data Changes? |
|--------|---------|------|----------------|---------------|
| Payload Auto-Creation | Initial schema | Payload CMS | ✅ Yes | ❌ No |
| Seeding Scripts | Initial data | Payload APIs | ❌ No | ✅ Yes |
| SQL Migrations | Extensions | Direct SQL | ✅ Yes (extensions only) | ❌ No |
| Backfill Scripts | Data migration | Direct SQL | ❌ No | ✅ Yes |

---

## 4️⃣ How Seeding & Backfills Were Expected to Work

### Seeding Scripts Assumptions

#### `seed-skills.ts`
- **Assumes**: Tables already exist (created by Payload)
- **Relies on**: Payload hooks (`beforeChange` hook generates embeddings)
- **Modifies**: Only data (creates records via Payload APIs)
- **Schema**: Does not modify schema

#### `seed-plans.ts`
- **Assumes**: `plans` table exists
- **Relies on**: Payload APIs only
- **Modifies**: Only data (creates/updates plans)
- **Schema**: Does not modify schema

#### `seed-disciplines.ts`
- **Assumes**: `disciplines` table exists
- **Relies on**: Payload APIs only
- **Modifies**: Only data (updates existing disciplines with new fields)
- **Schema**: Does not modify schema (assumes fields like `slug`, `displayOrder` already exist in collection)

### Backfill Script Assumptions

#### `backfill-pgvector.ts`
- **Assumes**: 
  - `name_embedding_vec` column already exists (added via SQL migration)
  - `name_embedding` (JSONB) column exists and has data
- **Relies on**: Direct SQL (bypasses Payload)
- **Modifies**: Only data (migrates JSONB → vector)
- **Schema**: Does not modify schema

### Intended Boundary

**Schema Changes**:
- ✅ Payload Collections (automatic table creation)
- ✅ SQL Migrations (for extensions/custom types Payload doesn't support)

**Data Changes**:
- ✅ Payload APIs (seeding scripts)
- ✅ Direct SQL (backfills when Payload APIs insufficient)

**Key Principle**: 
- Schema = Payload Collections (with SQL exceptions for extensions)
- Data = Payload APIs (with SQL exceptions for bulk migrations)

---

## 5️⃣ Implicit Consistency Rule

### The Pattern: "Schema via Payload, Data via Payload, SQL for Extensions Only"

Based on all existing scripts and migrations:

1. **Schema Definition**: Payload Collections (`src/collections/*.ts`)
   - Payload auto-creates tables from collection definitions
   - This is the primary and expected way to define schema

2. **Data Operations**: Payload APIs
   - Seeding uses `payload.create()`, `payload.update()`, `payload.find()`
   - Hooks are relied upon (e.g., embedding generation in `beforeChange`)

3. **SQL Exceptions**: Only for things Payload cannot do
   - PostgreSQL extensions (pgvector)
   - Custom column types (`vector(1536)`)
   - Indexes that Payload doesn't create automatically (HNSW indexes)

4. **Direct SQL for Data**: Only when necessary
   - Backfill scripts use direct SQL because they need to:
     - Read JSONB columns that Payload doesn't expose well
     - Write to vector columns that Payload doesn't know about
     - Perform bulk operations more efficiently

### Implicit Rule Summary

> **"Use Payload for everything it can do. Use direct SQL only when Payload cannot handle the requirement (extensions, custom types, bulk data migrations)."**

---

## 6️⃣ How pgvector Work Compares to Old Pattern

### What is Consistent

1. **SQL for Extensions**: 
   - ✅ Consistent: Using SQL migration for PostgreSQL extension (pgvector) is the same pattern as would be used for any extension Payload doesn't support

2. **Direct SQL for Bulk Operations**:
   - ✅ Consistent: Using direct SQL for backfill is similar to how bulk data operations might be done (though no previous examples existed)

### What is Different

1. **Schema Column Not in Payload Collection**:
   - ❌ **BREAKS PATTERN**: `name_embedding_vec vector(1536)` column was added via SQL but is NOT defined in `src/collections/Skills.ts`
   - **Old Pattern**: All columns were defined in Payload collections
   - **New Pattern**: Column exists in database but Payload doesn't know about it

2. **Dual Storage**:
   - ❌ **NEW**: Now storing embeddings in TWO places:
     - `name_embedding` (JSONB) - defined in Payload, managed by hooks
     - `name_embedding_vec` (vector) - added via SQL, not in Payload collection
   - **Old Pattern**: Single source of truth for each field

3. **Backfill Script Uses Direct SQL**:
   - ⚠️ **NEW APPROACH**: First time a script uses direct SQL for data migration
   - **Old Pattern**: All data operations used Payload APIs

### Which Part Caused the Conflict

**The Conflict**: 
- `name_embedding_vec` column exists in database but is NOT in Payload collection definition
- This creates a mismatch: database has a column Payload doesn't know about
- Future schema changes via Payload might not account for this column
- Payload's auto-migration might try to "fix" the schema by removing unknown columns (though this is unlikely, it's a risk)

**Root Cause**:
- Payload doesn't support `vector(1536)` as a field type
- So the column was added via SQL migration
- But it wasn't added to the Payload collection as a hidden/read-only field
- This breaks the "Payload is source of truth" pattern

---

## 7️⃣ Pattern to Lock Going Forward

### Recommended Pattern (Based on Historical Analysis)

**"Payload-First with SQL Extensions"**

1. **Schema Definition**:
   - ✅ **Primary**: Payload Collections (`src/collections/*.ts`)
   - ✅ **Exception**: SQL migrations for PostgreSQL extensions and custom types Payload doesn't support
   - ✅ **Requirement**: When adding SQL-only columns, also add them to Payload collection as hidden/read-only fields (for schema documentation)

2. **Data Operations**:
   - ✅ **Primary**: Payload APIs (`payload.create()`, `payload.update()`, etc.)
   - ✅ **Exception**: Direct SQL for bulk migrations or operations Payload APIs can't handle efficiently
   - ✅ **Requirement**: Document why direct SQL was used instead of Payload APIs

3. **Seeding Scripts**:
   - ✅ Use Payload APIs
   - ✅ Rely on hooks for computed fields (embeddings, etc.)
   - ✅ Can be destructive (hard reset) or idempotent (check before create)

4. **Migrations**:
   - ✅ SQL migrations in `supabase/migrations/` for:
     - PostgreSQL extensions
     - Custom column types (vector, etc.)
     - Indexes Payload doesn't create
   - ✅ Run via `src/scripts/run-migration.ts` (or Supabase SQL Editor)

5. **Backfills**:
   - ✅ Use direct SQL when needed for bulk data migration
   - ✅ Document why Payload APIs weren't used
   - ✅ Make scripts idempotent when possible

### Explicit Statement

> **"We will continue using Payload Collections as the source of truth for schema, with SQL migrations only for PostgreSQL extensions and custom types. When SQL-only columns are added, we will also add them to Payload collections as hidden/read-only fields to maintain schema documentation. Data operations will use Payload APIs by default, with direct SQL only for bulk migrations or operations Payload cannot handle efficiently."**

---

## Summary

### Historical Pattern
- **Schema**: Payload Collections (auto-created tables)
- **Data**: Payload APIs (seeding scripts)
- **Exceptions**: SQL for extensions (pgvector)

### Current State
- ✅ Skills seeding: Payload APIs (consistent)
- ✅ Plans seeding: Payload APIs (consistent)
- ✅ Disciplines seeding: Payload APIs (consistent)
- ⚠️ pgvector migration: SQL (consistent with extension pattern)
- ❌ **ISSUE**: `name_embedding_vec` column not in Payload collection (breaks pattern)

### Recommended Fix
- Add `name_embedding_vec` to `Skills` collection as a hidden, read-only field
- This documents the column in Payload even though Payload doesn't manage it
- Maintains "Payload as source of truth" pattern while acknowledging SQL-only columns

