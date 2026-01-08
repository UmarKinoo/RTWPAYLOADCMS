-- Add localized name columns to disciplines table
-- These columns support English and Arabic translations

-- Add name_en column (English name)
ALTER TABLE disciplines 
  ADD COLUMN IF NOT EXISTS name_en text;

-- Add name_ar column (Arabic name)
ALTER TABLE disciplines 
  ADD COLUMN IF NOT EXISTS name_ar text;

-- Update existing rows: set name_en to name if name_en is NULL
UPDATE disciplines 
SET name_en = name 
WHERE name_en IS NULL AND name IS NOT NULL;

-- Note: name_ar will remain NULL until translations are added
-- Run the translate-disciplines script to populate name_ar values

