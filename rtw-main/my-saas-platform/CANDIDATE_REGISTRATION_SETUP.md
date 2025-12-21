# Candidate Registration Module - Setup Guide

## Overview

This module implements a complete Candidate Registration system with:
- **Taxonomy Collections**: Disciplines → Categories → SubCategories → Skills (Job Matrix)
- **Smart Search**: Google-like search instead of 4 dropdowns
- **Vector Search Support**: For semantic skill matching and candidate matching
- **Full Registration Form**: Matches the provided form layout

## Collections Created

### 1. Taxonomy Collections

#### `Disciplines`
- **Slug**: `disciplines`
- **Fields**: `name` (text, unique)

#### `Categories`
- **Slug**: `categories`
- **Fields**: 
  - `name` (text)
  - `discipline` (relationship to disciplines)

#### `SubCategories`
- **Slug**: `subcategories`
- **Fields**:
  - `name` (text)
  - `category` (relationship to categories)

#### `Skills`
- **Slug**: `skills`
- **Fields**:
  - `name` (text, required)
  - `subCategory` (relationship to subcategories)
  - `billingClass` (select: A, B, C, D) - **Critical for pricing**
  - `name_embedding` (array) - Vector embedding for semantic search
- **Hooks**: `beforeChange` - Generates OpenAI embedding for vector search

### 2. Candidates Collection

#### `Candidates`
- **Slug**: `candidates`
- **Auth**: Enabled (creates user account)
- **Fields**:
  - **Identity**: firstName, lastName, email, password, phone, whatsapp
  - **Smart Matrix**: primarySkill (relationship to skills)
  - **Demographics**: gender, dob, nationality, languages
  - **Work**: jobTitle, experienceYears, saudiExperience, currentEmployer, availabilityDate
  - **Visa**: location, visaStatus, visaExpiry, visaProfession
  - **Vector Search**: bio_embedding (array) - For candidate matching
  - **Terms**: termsAccepted (checkbox)
- **Hooks**: `beforeChange` - Generates bio embedding from jobTitle + skill + experience

## Seeding Script

### Location
`src/scripts/seed-skills.ts`

### Usage
```bash
pnpm seed:skills
```

### What it does:
1. Reads `Job Master Skills List.xlsx` from project root
2. Parses Excel file (expects columns: Discipline, Category, Sub Category, Skill, Class)
3. Creates hierarchy: Discipline → Category → SubCategory → Skill
4. Maps CSV "Class" column to `billingClass` field
5. Avoids duplicates by checking existing records
6. Generates embeddings for skills (if OpenAI API key is set)

### Requirements:
- Excel file must be in project root: `Job Master Skills List.xlsx`
- Columns: Discipline, Category, Sub Category, Skill, Class
- OpenAI API key (optional, for embeddings)

## Frontend Registration Form

### Location
`src/app/(frontend)/(site)/register/page.tsx`

### Features:
1. **Smart Search Component** (`SkillSearch.tsx`)
   - Google-like search input
   - Calls `/api/skills/search?q=query`
   - Shows full path: Discipline > Category > SubCategory > Skill
   - Displays billing class
   - Debounced search (300ms)

2. **Two-Column Layout**
   - Responsive: 2 columns on desktop, 1 column on mobile
   - Matches the provided form image

3. **Form Validation**
   - React Hook Form + Zod validation
   - Client-side and server-side validation
   - Password strength validation
   - Email validation

4. **WhatsApp Toggle**
   - Checkbox: "Same as Phone"
   - Auto-fills WhatsApp when checked

5. **Server Action**
   - `registerCandidate()` in `src/lib/candidate.ts`
   - Creates candidate with auth
   - Generates bio embedding automatically

## API Routes

### 1. Skill Search
**GET** `/api/skills/search?q=query&limit=10`
- Performs fuzzy search on skills collection
- Returns skills with full hierarchy path
- Includes billing class

### 2. Get Skill by ID
**GET** `/api/skills/[id]`
- Fetches single skill with full hierarchy
- Used by Smart Search to display selected skill

## Environment Variables

Add to your `.env` file:

```env
# OpenAI API Key (Required for vector embeddings)
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Note**: Vector search will work without OpenAI, but embeddings won't be generated. The system will still function with regular text search.

## Setup Steps

1. **Install Dependencies** (already done):
   ```bash
   pnpm add xlsx
   pnpm add -D tsx
   ```

2. **Generate Types**:
   ```bash
   pnpm generate:types
   pnpm generate:importmap
   ```

3. **Seed Skills Data**:
   ```bash
   pnpm seed:skills
   ```

4. **Add OpenAI API Key** (optional but recommended):
   - Get API key from https://platform.openai.com
   - Add to `.env`: `OPENAI_API_KEY=sk-...`

5. **Access Registration Form**:
   - Navigate to: `http://localhost:3000/register`

## How It Works

### Smart Search Flow:
1. User types in "Mason" in the Smart Search input
2. Frontend calls `/api/skills/search?q=Mason`
3. Backend performs fuzzy search on skills collection
4. Returns matching skills with full path
5. User selects "Marble Mason"
6. Form stores only the `skill_id`
7. Discipline/Category/SubCategory are inferred from the skill relationship

### Pricing Logic:
- Only the `Skill` is stored in the candidate record
- The `billingClass` (A, B, C, D) is stored on the Skill
- You can query: `skill.subCategory.category.discipline` to get full hierarchy
- Pricing is determined by `skill.billingClass`

### Vector Search:
- **Skills**: Embedding generated from `name` field
- **Candidates**: Embedding generated from `jobTitle + primarySkill.name + experienceYears`
- Use Supabase vector search or OpenAI embeddings for semantic matching

## File Structure

```
src/
├── collections/
│   ├── Disciplines.ts
│   ├── Categories.ts (updated)
│   ├── SubCategories.ts
│   ├── Skills.ts
│   └── Candidates.ts
├── scripts/
│   └── seed-skills.ts
├── components/
│   └── candidate/
│       └── SkillSearch.tsx
├── app/
│   ├── (frontend)/(site)/
│   │   └── register/
│   │       └── page.tsx
│   └── api/
│       └── skills/
│           ├── search/
│           │   └── route.ts
│           └── [id]/
│               └── route.ts
└── lib/
    └── candidate.ts
```

## Next Steps

1. **Test the Registration Form**:
   - Visit `/register`
   - Fill out the form
   - Test the Smart Search
   - Submit and verify candidate creation

2. **Customize as Needed**:
   - Adjust form layout
   - Add more validation rules
   - Customize the Smart Search UI
   - Add CV upload field (already configured with S3 storage)

3. **Vector Search Implementation**:
   - Use Supabase's vector search capabilities
   - Or implement OpenAI-based semantic search
   - Match candidates to job postings using embeddings

## Troubleshooting

### Seeding Issues:
- Ensure Excel file is in project root
- Check column names match exactly: Discipline, Category, Sub Category, Skill, Class
- Verify database connection

### Smart Search Not Working:
- Check API route: `/api/skills/search`
- Verify skills are seeded
- Check browser console for errors

### Embeddings Not Generating:
- Verify `OPENAI_API_KEY` is set in `.env`
- Check API key is valid
- Review console logs for errors

---

**Status**: ✅ Complete and Ready to Use


