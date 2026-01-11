# Apply Production Database Migrations

## ⚠️ Required Migrations for Production

The following database changes need to be applied to your production database:

### 1. **Migration 008: Make Employers Phone Optional** ✅ NEW
**File:** `supabase/migrations/008_make_employers_phone_optional.sql`

**What it does:**
- Makes the `phone` column nullable in the `employers` table
- Allows existing records without phone numbers
- Required for OTP phone verification feature

### 2. **PhoneVerifications Collection** ✅ NEW
**Collection:** `src/collections/PhoneVerifications.ts`

**What it does:**
- Creates a new `phone_verifications` table
- Stores OTP verification data
- Required for phone verification during registration

**Note:** Payload will auto-create this table when it connects, but you can also create it manually.

### 3. **Other Migrations** (Check if already applied)
- `001_enable_pgvector.sql` - pgvector extension
- `002_add_disciplines_localized_names.sql` - Localized discipline names
- `003_add_plans_localized_titles.sql` - Localized plan titles
- `004_add_pages_localized_titles.sql` - Localized page titles
- `005_add_disciplines_missing_fields.sql` - Additional discipline fields
- `006_add_employers_missing_fields.sql` - Additional employer fields
- `007_add_candidates_password_reset_fields.sql` - Password reset fields

## How to Apply Migrations

### Option 1: Via Supabase SQL Editor (Recommended)

1. **Go to Supabase Dashboard:**
   - Navigate to: SQL Editor → New Query

2. **Apply Migration 008:**
   ```sql
   -- Make employers.phone optional (nullable) to support existing records
   ALTER TABLE employers ALTER COLUMN phone DROP NOT NULL;
   ```

3. **Create PhoneVerifications Table:**
   Payload will auto-create this when it connects, but if you want to create it manually:
   ```sql
   CREATE TABLE IF NOT EXISTS phone_verifications (
     id serial PRIMARY KEY,
     phone text NOT NULL,
     user_id text,
     user_collection text,
     otp_hash text NOT NULL,
     otp_salt text NOT NULL,
     expires_at timestamp with time zone NOT NULL,
     attempts integer DEFAULT 0,
     verified_at timestamp with time zone,
     last_sent_at timestamp with time zone,
     request_ip text,
     user_agent text,
     created_at timestamp with time zone DEFAULT now(),
     updated_at timestamp with time zone DEFAULT now()
   );
   
   CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
   CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone_verified ON phone_verifications(phone, verified_at);
   ```

### Option 2: Via Migration Script

1. **Set Production DATABASE_URI:**
   ```bash
   # In your local .env (temporarily)
   DATABASE_URI=postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres?sslmode=require
   ```

2. **Run Migration Script:**
   ```bash
   pnpm tsx src/scripts/apply-migration-to-prod.ts supabase/migrations/008_make_employers_phone_optional.sql
   ```

3. **Remove DATABASE_URI from .env** (for security)

### Option 3: Let Payload Auto-Create (Easiest)

1. **Fix the password issue first** (so Payload can connect)
2. **Redeploy on Vercel**
3. **Payload will automatically:**
   - Create the `phone_verifications` table
   - Apply schema changes based on collections

**However**, Migration 008 (making phone optional) still needs to be applied manually via SQL Editor.

## Quick Checklist

- [ ] Fix DATABASE_URI password issue on Vercel
- [ ] Apply Migration 008 via Supabase SQL Editor
- [ ] Verify PhoneVerifications table exists (Payload will create it)
- [ ] Test phone verification flow
- [ ] Check other migrations are applied

## Verify Migrations Applied

Run this in Supabase SQL Editor to check:

```sql
-- Check if phone is nullable
SELECT column_name, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'employers' AND column_name = 'phone';

-- Check if phone_verifications table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_name = 'phone_verifications'
);
```



