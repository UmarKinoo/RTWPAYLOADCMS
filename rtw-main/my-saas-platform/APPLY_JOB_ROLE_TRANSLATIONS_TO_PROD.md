# Apply Job Role Translations to Production Database

## Overview

The job role translation system in `RegistrationWizard.tsx` works by:
1. **Frontend**: `JobRoleStep` component uses `SkillSearch` which calls `/api/skills/search?locale=ar` or `locale=en`
2. **API**: Returns skills with localized names from `name_en` (English) and `name_ar` (Arabic) database columns
3. **Database**: Skills, categories, and subcategories have `name_en` and `name_ar` columns for translations

## Step 1: Apply Database Migration

The migration adds `name_en` and `name_ar` columns to:
- `skills` table
- `categories` table  
- `subcategories` table

### Option A: Using the Script (Recommended)

1. **Set production database URI** (temporarily):
   ```powershell
   $env:DATABASE_URI="postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres?sslmode=require"
   ```

2. **Run the migration script**:
   ```bash
   pnpm tsx src/scripts/apply-migration-014-prod.ts
   ```

3. **Remove DATABASE_URI from environment** (for security):
   ```powershell
   # Remove the variable
   Remove-Item Env:\DATABASE_URI
   
   # Or set it to $null
   $env:DATABASE_URI = $null
   
   # Verify it's removed
   $env:DATABASE_URI
   ```

### Option B: Via Supabase SQL Editor

1. Go to **Supabase Dashboard** → **SQL Editor** → **New Query**

2. Copy and paste the contents of:
   ```
   supabase/migrations/014_add_localized_names_to_skills_categories_subcategories.sql
   ```

3. Click **Run** to execute

## Step 2: Populate Arabic Translations

After the migration is applied, populate the `name_ar` columns with Arabic translations.

### Option A: Copy from Local/Dev Database (Recommended - Faster & Free)

If you already have translations in your local or dev database, copy them to production:

1. **Set environment variables**:
   ```powershell
   # Your local/dev database connection string
   $env:LOCAL_DATABASE_URI="postgresql://postgres:[PASSWORD]@localhost:54322/postgres"
   
   # Your production database connection string
   $env:PROD_DATABASE_URI="postgresql://postgres:[PASSWORD]@db.[project-ref].supabase.co:5432/postgres?sslmode=require"
   ```

2. **Run the copy script**:
   ```bash
   pnpm tsx src/scripts/copy-translations-to-prod.ts
   ```

3. **Remove environment variables** (for security):
   ```powershell
   # Remove the variables
   Remove-Item Env:\LOCAL_DATABASE_URI
   Remove-Item Env:\PROD_DATABASE_URI
   
   # Or set them to $null
   $env:LOCAL_DATABASE_URI = $null
   $env:PROD_DATABASE_URI = $null
   
   # Verify they're removed
   $env:LOCAL_DATABASE_URI
   $env:PROD_DATABASE_URI
   ```

   This script will:
   - Export `name_en` and `name_ar` from local/dev database
   - Import them to production database
   - Only update existing records (matches by ID)
   - Skip records that don't exist in production

3. **Expected output**:
   ```
   📋 Copying Skills translations...
   Found 500 skills with translations in local/dev
   Found 500 skills in production
   ✅ Updated Skills ID 1 (EN+AR)
   ...
   
   📊 Skills Summary:
      Updated: 500
      Skipped: 0
      Errors: 0
   ```

### Option B: Generate New Translations with OpenAI

If you don't have translations in local/dev, generate them using OpenAI:

1. **Ensure environment variables are set**:
   - `PAYLOAD_SECRET` - Your Payload CMS secret
   - `OPENAI_API_KEY` - Your OpenAI API key (for translation)
   - `DATABASE_URI` - Your production database connection string

2. **Run the translation script**:
   ```bash
   pnpm tsx src/scripts/translate-skills.ts
   ```

   This script will:
   - Translate all categories to Arabic
   - Translate all subcategories to Arabic
   - Translate all skills to Arabic
   - Use OpenAI GPT-4o for high-quality translations
   - Skip items that already have Arabic translations

3. **Expected output**:
   ```
   📋 Translating categories...
   Found 50 categories to translate
   
   🔄 Translating: "Engineering"...
   ✅ Translated: "Engineering" → "الهندسة"
   
   📊 Summary:
      Total: 50
      Translated: 45
      Skipped: 5 (already had translations)
      Errors: 0
   ```

## Step 3: Verify Translations

### Check via API

Test the API endpoint to verify translations are working:

```bash
# Test English locale
curl "https://your-domain.com/api/skills/search?q=engineer&locale=en&limit=5"

# Test Arabic locale  
curl "https://your-domain.com/api/skills/search?q=مهندس&locale=ar&limit=5"
```

### Check via Database

Query the database directly:

```sql
-- Check skills with translations
SELECT id, name, name_en, name_ar 
FROM skills 
WHERE name_ar IS NOT NULL 
LIMIT 10;

-- Check categories with translations
SELECT id, name, name_en, name_ar 
FROM categories 
WHERE name_ar IS NOT NULL 
LIMIT 10;

-- Check subcategories with translations
SELECT id, name, name_en, name_ar 
FROM subcategories 
WHERE name_ar IS NOT NULL 
LIMIT 10;
```

## How It Works in the Code

### RegistrationWizard Component
- **File**: `src/components/candidate/RegistrationWizard.tsx`
- Uses `JobRoleStep` component which renders `SkillSearch`

### SkillSearch Component  
- **File**: `src/components/candidate/SkillSearch.tsx`
- Calls `/api/skills/search?q={query}&locale={locale}`
- Displays localized skill names based on user's locale

### API Route
- **File**: `src/app/api/skills/search/route.ts`
- Queries database with `name_en` and `name_ar` columns
- Returns localized names using this logic:
  ```typescript
  const getLocalizedName = (name, name_en, name_ar) => {
    if (locale === 'ar' && name_ar) return name_ar
    if (locale === 'en' && name_en) return name_en
    if (name_ar) return name_ar // Fallback
    if (name_en) return name_en // Fallback
    return name || ''
  }
  ```

## Troubleshooting

### Error: "column name_en does not exist"
- **Solution**: Apply migration 014 first (Step 1)

### Translations not showing in Arabic
- **Check**: Verify `name_ar` columns have data (Step 2)
- **Check**: Verify API is receiving correct `locale` parameter
- **Check**: Check browser console for API errors

### Translation script fails
- **Check**: `OPENAI_API_KEY` is set and valid
- **Check**: `PAYLOAD_SECRET` is set correctly
- **Check**: Database connection is working
- **Check**: You have sufficient OpenAI API credits

## Files Involved

- **Migration**: `supabase/migrations/014_add_localized_names_to_skills_categories_subcategories.sql`
- **Apply Script**: `src/scripts/apply-migration-014-prod.ts`
- **Copy Script**: `src/scripts/copy-translations-to-prod.ts` (copy from local/dev to prod)
- **Translation Script**: `src/scripts/translate-skills.ts` (generate new translations with OpenAI)
- **API Route**: `src/app/api/skills/search/route.ts`
- **Component**: `src/components/candidate/SkillSearch.tsx`
- **Wizard Step**: `src/components/candidate/wizard-steps/JobRoleStep.tsx`

## Notes

- The migration is **idempotent** (safe to run multiple times)
- **Copy script** (Option A) is faster and free - use it if you have translations in local/dev
- **Translation script** (Option B) uses OpenAI GPT-4o and costs API credits
- Both scripts **skip** items that already have translations
- The system **falls back** to English if Arabic is not available
- The system **falls back** to Arabic if English is not available
