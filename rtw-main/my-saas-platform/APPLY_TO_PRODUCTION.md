# Apply Missing Column to Production

## Issue
The `phone_verified` column is missing from the `employers` table in production, causing the registration query to fail.

## Solution: Run This SQL in Supabase Dashboard

1. **Go to Supabase Dashboard:**
   - Navigate to: SQL Editor → New Query

2. **Copy and paste this SQL:**

```sql
-- Add phone_verified column to employers table
ALTER TABLE employers 
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT FALSE;

-- Update existing rows: set phone_verified to FALSE if NULL
UPDATE employers 
SET phone_verified = FALSE 
WHERE phone_verified IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN employers.phone_verified IS 'Has the employer verified their phone number via OTP';
```

3. **Click "Run" or press Ctrl+Enter**

4. **Verify it worked:**
   Run this query to check:
   ```sql
   SELECT column_name, data_type, is_nullable, column_default
   FROM information_schema.columns
   WHERE table_name = 'employers' AND column_name = 'phone_verified';
   ```

   You should see:
   - `column_name`: phone_verified
   - `data_type`: boolean
   - `is_nullable`: YES
   - `column_default`: false

## After Applying

Once the column is added, try registering an employer again. The error should be resolved.



