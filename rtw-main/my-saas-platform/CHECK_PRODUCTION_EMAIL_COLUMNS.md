# Check Production Database Email Columns

## Overview

This document explains how to verify and ensure email columns exist in your production database.

## Background

When Payload CMS collections have `auth: true`, Payload automatically creates `email` and `password` columns. However, if tables were created manually or through migrations before Payload initialized, these columns might be missing.

## Verification

### Option 1: Run Production Check Script

```bash
# Set your production database URI temporarily
$env:PRODUCTION_DATABASE_URI="your-production-connection-string"

# Run the production check script
npx tsx src/scripts/check-email-columns-prod.ts
```

The script will:
- ✅ Verify email columns exist in `candidates` and `employers` tables
- ✅ Show sample data with emails
- ✅ Automatically add email columns if they're missing
- ✅ Display connection info (masked for security)

### Option 2: Manual SQL Check

Run these queries in your production database (Supabase SQL Editor):

```sql
-- Check if email column exists in candidates
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'candidates' 
  AND column_name = 'email';

-- Check if email column exists in employers
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'employers' 
  AND column_name = 'email';

-- View sample data
SELECT id, email, first_name, last_name 
FROM candidates 
LIMIT 5;

SELECT id, email, company_name 
FROM employers 
LIMIT 5;
```

### Option 3: Add Email Columns Manually (if missing)

If email columns are missing, run these SQL commands:

```sql
-- Add email column to candidates table
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS email text UNIQUE;

-- Add email column to employers table
ALTER TABLE employers 
ADD COLUMN IF NOT EXISTS email text UNIQUE;
```

## Important Notes

1. **Email columns should already exist** - Payload CMS with `auth: true` automatically creates them
2. **If columns are missing** - This usually means tables were created manually before Payload initialization
3. **The scripts are safe** - They use `ADD COLUMN IF NOT EXISTS` so they won't break existing data
4. **Never commit credentials** - Always set `PRODUCTION_DATABASE_URI` as an environment variable, never in code

## Security

- ✅ All scripts mask database credentials in output
- ✅ Scripts verify you're connecting to production (not local)
- ✅ Scripts warn if connection doesn't look like production
- ✅ `.env` files are properly ignored in `.gitignore`

## Related Files

- `src/scripts/check-email-columns.ts` - Check local database
- `src/scripts/check-email-columns-prod.ts` - Check production database
- `EMAIL_COLUMNS_INVESTIGATION.md` - Full investigation findings

