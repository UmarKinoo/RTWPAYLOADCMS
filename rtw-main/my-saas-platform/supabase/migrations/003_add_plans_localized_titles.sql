-- Add localized title columns to plans table
-- These columns support English and Arabic translations

-- Add title_en column (English title)
ALTER TABLE plans 
  ADD COLUMN IF NOT EXISTS title_en text;

-- Add title_ar column (Arabic title)
ALTER TABLE plans 
  ADD COLUMN IF NOT EXISTS title_ar text;

-- Update existing rows: set title_en to title if title_en is NULL
UPDATE plans 
SET title_en = title 
WHERE title_en IS NULL AND title IS NOT NULL;

-- Note: title_ar will remain NULL until translations are added manually
-- or via a translation script

