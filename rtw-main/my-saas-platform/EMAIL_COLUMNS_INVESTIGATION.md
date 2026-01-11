# Email Columns Investigation

## ✅ Findings

The email columns **DO exist** in both the `candidates` and `employers` tables in your database.

### Verification Results:
- ✅ `candidates.email` column exists
- ✅ `employers.email` column exists
- ✅ All 10 candidates have email addresses
- ✅ All 19 employers have email addresses

### Sample Data:
**Candidates:**
- umar.k@constancehospitality.com
- test@live.com
- testingone@live.com
- candidatetestuploadcv@live.com
- candidate@readytowork.com

**Employers:**
- employer@gmail.com
- qwert@live.com
- umar.k@constancehospitality.com
- em@live.com
- testing@john.com

## Why You Might Not See Emails in Your Database Viewer

### 1. **Different Database Connection**
   - You might be looking at a **local database** while Payload CMS is connected to **production**
   - Check your `DATABASE_URI` environment variable
   - Verify you're querying the same database that Payload CMS uses

### 2. **Database Viewer Issues**
   - Some database viewers hide certain columns by default
   - Try refreshing your database viewer
   - Make sure you're viewing all columns, not just a subset

### 3. **Query Issues**
   - If you're writing SQL queries, make sure you're selecting the `email` column:
     ```sql
     SELECT id, email, first_name, last_name FROM candidates;
     SELECT id, email, company_name FROM employers;
     ```

### 4. **Table Name Case Sensitivity**
   - PostgreSQL table names are case-insensitive, but column names might need quotes in some cases
   - Try: `SELECT "email" FROM candidates;` if regular queries don't work

### 5. **Permissions**
   - Make sure your database user has SELECT permissions on the email column
   - Check if there are any row-level security policies blocking email visibility

## How to Verify in Your Database

Run this SQL query in your database (Supabase SQL Editor or pgAdmin):

```sql
-- Check candidates table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'candidates' 
  AND column_name = 'email';

-- Check employers table
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'employers' 
  AND column_name = 'email';

-- View actual email data
SELECT id, email, first_name, last_name 
FROM candidates 
LIMIT 10;

SELECT id, email, company_name 
FROM employers 
LIMIT 10;
```

## Technical Details

### How Payload CMS Handles Email with `auth: true`

When a Payload CMS collection has `auth: true`:
1. Payload automatically adds `email` and `password` fields
2. The `email` field is stored as a `text` column in PostgreSQL
3. The `email` field has a UNIQUE constraint
4. The email is visible in the Payload admin panel because it queries the database directly

### Collection Configuration

Both collections have `auth: true`:
- `src/collections/Candidates.ts` - line 98: `auth: true`
- `src/collections/Employers.ts` - line 9: `auth: true`

The comment in Employers.ts (line 33) confirms:
> "Note: email and password are automatically added by Payload when auth: true"

## Next Steps

1. **Verify Database Connection**: Make sure you're looking at the same database that Payload CMS uses
2. **Check Your Database Viewer**: Try a different tool or refresh your current one
3. **Run the Verification Script**: 
   ```bash
   npx tsx src/scripts/check-email-columns.ts
   ```
4. **Query Directly**: Use the SQL queries above to verify email data exists

## Script Created

A verification script has been created at:
`src/scripts/check-email-columns.ts`

This script:
- Checks if email columns exist
- Counts records with emails
- Shows sample data
- Can add email columns if they're missing (though they already exist)

