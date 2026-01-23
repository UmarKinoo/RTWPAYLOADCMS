-- Add localized name columns to skills, categories, and subcategories tables
-- These columns support English and Arabic translations

-- ============================================================================
-- SKILLS TABLE
-- ============================================================================

-- Add name_en column (English name)
ALTER TABLE skills 
  ADD COLUMN IF NOT EXISTS name_en text;

-- Add name_ar column (Arabic name)
ALTER TABLE skills 
  ADD COLUMN IF NOT EXISTS name_ar text;

-- Update existing rows: set name_en to name if name_en is NULL
UPDATE skills 
SET name_en = name 
WHERE name_en IS NULL AND name IS NOT NULL;

-- ============================================================================
-- CATEGORIES TABLE
-- ============================================================================

-- Add name_en column (English name)
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS name_en text;

-- Add name_ar column (Arabic name)
ALTER TABLE categories 
  ADD COLUMN IF NOT EXISTS name_ar text;

-- Update existing rows: set name_en to name if name_en is NULL
UPDATE categories 
SET name_en = name 
WHERE name_en IS NULL AND name IS NOT NULL;

-- ============================================================================
-- SUBCATEGORIES TABLE
-- ============================================================================

-- Add name_en column (English name)
ALTER TABLE subcategories 
  ADD COLUMN IF NOT EXISTS name_en text;

-- Add name_ar column (Arabic name)
ALTER TABLE subcategories 
  ADD COLUMN IF NOT EXISTS name_ar text;

-- Update existing rows: set name_en to name if name_en is NULL
UPDATE subcategories 
SET name_en = name 
WHERE name_en IS NULL AND name IS NOT NULL;

-- Note: name_ar will remain NULL until translations are added
-- Translations can be added manually or via scripts
