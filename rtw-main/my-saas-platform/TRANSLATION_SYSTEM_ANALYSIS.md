# Translation System Analysis

## Overview
The codebase uses a **dual translation system** for the homepage and throughout the application:

1. **next-intl** - For static UI text translations (JSON files)
2. **CMS Database Fields** - For dynamic content translations (`_en`/`_ar` fields)

This hybrid approach allows:
- Static UI text (buttons, labels, headings) → Translated via JSON files
- Dynamic CMS content (disciplines, plans, pages) → Translated via database fields

## Part 1: next-intl Translation System (Static UI Text)

### How It Works

**Framework:** `next-intl` (Next.js internationalization library)

**Translation Files:**
- `messages/en.json` - English translations
- `messages/ar.json` - Arabic translations

**Configuration:**
- `src/i18n/config.ts` - Locale definitions (`['en', 'ar']`)
- `src/i18n/routing.ts` - Routing configuration
- `src/i18n/request.ts` - Message loading logic
- `src/app/[locale]/layout.tsx` - Locale layout with `NextIntlClientProvider`

### Usage in Components

**Server Components:**
```typescript
import { getTranslations } from 'next-intl/server'

export async function MyComponent() {
  const t = await getTranslations('homepage.hero')
  return <h1>{t('title')}</h1>
}
```

**Client Components:**
```typescript
'use client'
import { useTranslations } from 'next-intl'

export function MyComponent() {
  const t = useTranslations('homepage.hero')
  return <h1>{t('title')}</h1>
}
```

### Homepage Components Using next-intl

| Component | Translation Key | Type |
|-----------|----------------|------|
| `Hero` | `homepage.hero` | Client Component |
| `Candidates` | `homepage.candidates` | Server Component |
| `MajorDisciplines` | `homepage.majorDisciplines` | Server Component |
| `UploadResume` | `homepage.uploadResume` | Server Component |
| `Blog` | `homepage.blog` | Server Component |
| `TrustedBy` | `homepage.trustedBy` | Server Component |
| `FAQ` | `homepage.faq` | Client Component |
| `Newsletter` | `homepage.newsletter` | Client Component |
| `Footer` | `homepage.footer` | Server Component |
| `Navbar` | `nav` | Client Component |

### Translation File Structure

```json
{
  "homepage": {
    "hero": {
      "title": "Explore thousands of openings and",
      "titleHighlight": "talented",
      "titleEnd": "profiles all in one place.",
      "subtitle": "Access a wide pool...",
      "forEmployer": "For Employer",
      "forCandidates": "For Candidates",
      "searchPlaceholder": "Smart Search"
    },
    "candidates": {
      "title": "Candidates",
      "subtitle": "Search over 30,475 skilled candidates...",
      "findMore": "Find More Candidates"
    },
    "majorDisciplines": {
      "title": "Explore Jobs by Major Discipline",
      "subtitle": "Our platform connects you..."
    }
    // ... more sections
  }
}
```

### How Locale is Determined

1. **URL-based routing:** `/en/` or `/ar/` prefix
2. **Layout wrapper:** `src/app/[locale]/layout.tsx` extracts locale from params
3. **Message loading:** `src/i18n/request.ts` loads corresponding JSON file
4. **Provider:** `NextIntlClientProvider` makes messages available to all children

### RTL Support

- **Arabic locale:** Automatically sets `dir="rtl"` and uses Cairo font
- **English locale:** Uses `dir="ltr"` and Geist fonts
- Configured in: `src/app/[locale]/layout.tsx`

---

## Part 2: CMS Database Translation System (Dynamic Content)

## Translation Pattern

### Field Naming Convention
- **Base field**: `name` or `title` (fallback value)
- **English field**: `name_en` or `title_en` (explicit English)
- **Arabic field**: `name_ar` or `title_ar` (Arabic translation)

### Fallback Chain
The fallback order is:
1. Locale-specific field (`name_ar` for Arabic, `name_en` for English)
2. English field (`name_en`) - if Arabic is requested but not available
3. Base field (`name` or `title`)
4. Empty string

## Collections with Localized Fields

### 1. **Disciplines** (`disciplines`)
**Fields:**
- `name` (text, required) - Base/fallback name
- `name_en` (text, optional) - English name
- `name_ar` (text, optional) - Arabic name

**Usage:**
- Used in: `src/lib/disciplines.ts` → `getLocalizedDisciplineName()`
- Used in: `src/components/homepage/blocks/MajorDisciplines.tsx` - **Combines both systems!**
  - Section title/subtitle: Uses `next-intl` (`homepage.majorDisciplines.title`)
  - Discipline names: Uses CMS fields (`discipline.name_ar` or `discipline.name_en`)
- Used in: `src/app/[locale]/(frontend)/(site)/candidates/page.tsx`

**How MajorDisciplines Works:**
```typescript
// 1. Get static UI text from next-intl
const t = await getTranslations('homepage.majorDisciplines')
const locale = await getLocale()

// 2. Get dynamic discipline data with localized names from CMS
const disciplines = await getDisciplines(locale) // Uses getLocalizedDisciplineName()

// 3. Render:
// - Section title: {t('title')} ← next-intl
// - Discipline names: {discipline.localizedName} ← CMS database fields
```

**Migration Status:** ✅ Migration created (`002_add_disciplines_localized_names.sql`)
**Action Required:** Apply migration to production

---

### 2. **Plans** (`plans`)
**Fields:**
- `title` (text, required) - Base/fallback title
- `title_en` (text, optional) - English title
- `title_ar` (text, optional) - Arabic title

**Usage:**
- Used in: `src/lib/payload/plans.ts` → `getLocalizedPlanTitle()`
- Used in: Pricing page components

**Migration Status:** ⚠️ **MIGRATION NEEDED**
**Action Required:** Create and apply migration for `title_en` and `title_ar` columns

---

### 3. **Pages** (`pages`)
**Fields:**
- `title` (text, optional) - Base/fallback title
- `title_en` (text, optional) - English title
- `title_ar` (text, optional) - Arabic title

**Usage:**
- Used via: `src/lib/cms-translations.ts` → `getLocalizedField()`
- Used in: Page rendering components

**Migration Status:** ⚠️ **MIGRATION NEEDED**
**Action Required:** Create and apply migration for `title_en` and `title_ar` columns

---

### 4. **Posts** (`posts`)
**Fields:**
- `title` (text, required) - **NO localized fields**

**Status:** ✅ No translation fields (only base `title` field)

---

## Helper Functions

### 1. `getLocalizedField()` - Generic Helper
**Location:** `src/lib/cms-translations.ts`

**Purpose:** Generic function for any collection with `_en`/`_ar` pattern

**Usage:**
```typescript
import { getLocalizedField } from '@/lib/cms-translations'

const pageTitle = getLocalizedField(page, 'title', 'ar')
// Returns: page.title_ar || page.title_en || page.title || ''
```

**Fallback Logic:**
- For Arabic (`ar`): `title_ar` → `title_en` → `title` → `''`
- For English (`en`): `title_en` → `title` → `''`

---

### 2. `getLocalizedDisciplineName()` - Discipline-Specific
**Location:** `src/lib/disciplines.ts`

**Purpose:** Specialized function for disciplines

**Usage:**
```typescript
import { getLocalizedDisciplineName } from '@/lib/disciplines'

const localizedName = getLocalizedDisciplineName(discipline, locale)
```

**Fallback Logic:**
- For Arabic: `name_ar` → `name_en` → `name` → `''`
- For English: `name_en` → `name` → `''`

---

### 3. `getLocalizedPlanTitle()` - Plan-Specific
**Location:** `src/lib/payload/plans.ts`

**Purpose:** Specialized function for plans

**Usage:**
```typescript
// Internal to plans.ts, used in getPlans()
const title = getLocalizedPlanTitle(plan, locale)
```

**Fallback Logic:**
- For Arabic: `title_ar` → `title_en` → `title` → `''`
- For English: `title_en` → `title` → `''`

---

## Translation Scripts

### `translate-disciplines.ts`
**Location:** `src/scripts/translate-disciplines.ts`

**Purpose:** Automatically translate discipline names to Arabic using OpenAI

**How it works:**
1. Fetches all disciplines
2. For each discipline without `name_ar`:
   - Uses `name_en` or `name` as source
   - Calls OpenAI GPT-4o to translate to Arabic
   - Updates discipline with `name_ar`
3. Sets `name_en` from `name` if not already set

**Usage:**
```bash
pnpm tsx src/scripts/translate-disciplines.ts
```

**Requirements:**
- `OPENAI_API_KEY` environment variable
- `PAYLOAD_SECRET` environment variable
- Disciplines must have `name_en` or `name` field populated

---

## Database Schema Requirements

### Current Status

| Collection | Base Field | English Field | Arabic Field | Migration Status |
|------------|-----------|---------------|--------------|------------------|
| `disciplines` | `name` ✅ | `name_en` ❌ | `name_ar` ❌ | ✅ Created, needs application |
| `plans` | `title` ✅ | `title_en` ❌ | `title_ar` ❌ | ❌ Not created |
| `pages` | `title` ✅ | `title_en` ❌ | `title_ar` ❌ | ❌ Not created |

### Migration Files Needed

1. ✅ **`002_add_disciplines_localized_names.sql`** - Created
2. ❌ **`003_add_plans_localized_titles.sql`** - **NEEDS CREATION**
3. ❌ **`004_add_pages_localized_titles.sql`** - **NEEDS CREATION**

---

## Production Database Issues

### Current Error
```
error: column "name_en" does not exist
```

**Root Cause:** Payload CMS queries ALL fields defined in collection config, including `name_en` and `name_ar`, but these columns don't exist in production database.

**Impact:** 
- ❌ Homepage fails to load (queries disciplines)
- ❌ Any page that queries disciplines fails
- ❌ Candidate filtering by discipline fails

---

## Required Actions

### 1. Immediate Fix (Disciplines)
**File:** `supabase/migrations/002_add_disciplines_localized_names.sql`

**Apply to production:**
```bash
# Option 1: Via Supabase Dashboard SQL Editor
# Copy/paste migration SQL and execute

# Option 2: Via migration script (with production DATABASE_URI)
pnpm tsx src/scripts/run-migration.ts supabase/migrations/002_add_disciplines_localized_names.sql

# Option 3: Via Supabase CLI
supabase db push
```

---

### 2. Create Plans Migration
**File:** `supabase/migrations/003_add_plans_localized_titles.sql`

**SQL:**
```sql
-- Add localized title columns to plans table
ALTER TABLE plans 
  ADD COLUMN IF NOT EXISTS title_en text;

ALTER TABLE plans 
  ADD COLUMN IF NOT EXISTS title_ar text;

-- Update existing rows: set title_en to title if title_en is NULL
UPDATE plans 
SET title_en = title 
WHERE title_en IS NULL AND title IS NOT NULL;
```

---

### 3. Create Pages Migration
**File:** `supabase/migrations/004_add_pages_localized_titles.sql`

**SQL:**
```sql
-- Add localized title columns to pages table
ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS title_en text;

ALTER TABLE pages 
  ADD COLUMN IF NOT EXISTS title_ar text;

-- Update existing rows: set title_en to title if title_en is NULL
UPDATE pages 
SET title_en = title 
WHERE title_en IS NULL AND title IS NOT NULL;
```

---

## Testing Checklist

After applying migrations:

- [ ] Homepage loads without errors
- [ ] Disciplines display correctly in English
- [ ] Disciplines display correctly in Arabic (if translations exist)
- [ ] Plans page loads without errors
- [ ] Plans display localized titles correctly
- [ ] Pages load without errors
- [ ] Pages display localized titles correctly
- [ ] Candidate filtering by discipline works
- [ ] No SQL errors in Vercel logs

---

## Best Practices

1. **Always create migrations** when adding new fields to collections
2. **Test locally first** using `supabase db reset` or local migration script
3. **Backfill existing data** in migrations (set `_en` from base field)
4. **Use helper functions** (`getLocalizedField`) instead of manual fallback logic
5. **Keep fallback chain consistent** across all collections

---

## Summary

### Translation Systems Summary

**1. next-intl (Static UI Text):**
- ✅ Fully implemented
- ✅ All homepage components use it
- ✅ Translation files: `messages/en.json` and `messages/ar.json`
- ✅ No database changes needed

**2. CMS Database Fields (Dynamic Content):**
- ✅ Disciplines (migration created, needs application)
- ⚠️ Plans (migration needed)
- ⚠️ Pages (migration needed)

### How Homepage Translation Works

The homepage uses **BOTH systems together**:

1. **Static UI elements** (headings, buttons, labels) → `next-intl` JSON files
2. **Dynamic CMS content** (discipline names, plan titles) → Database fields (`_en`/`_ar`)

**Example - MajorDisciplines Component:**
```typescript
// Static text from next-intl
const t = await getTranslations('homepage.majorDisciplines')
<h2>{t('title')}</h2>  // "Explore Jobs by Major Discipline"

// Dynamic content from CMS
const disciplines = await getDisciplines(locale)
{disciplines.map(d => (
  <div>{d.localizedName}</div>  // Uses name_ar or name_en from database
))}
```

### Critical Actions Required

1. **IMMEDIATE:** Apply `002_add_disciplines_localized_names.sql` to production
   - This fixes the current Vercel error: `column "name_en" does not exist`
   - Without this, homepage fails because `MajorDisciplines` queries disciplines

2. **SOON:** Create and apply migrations for Plans and Pages
   - Prevents future errors when those collections are queried

3. **VERIFY:** After migrations, test homepage in both `/en` and `/ar` locales

