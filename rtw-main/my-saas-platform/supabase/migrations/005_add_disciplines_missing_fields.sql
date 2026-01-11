-- Add missing fields to disciplines table
-- These fields are defined in the Disciplines collection but missing from production

-- Add display_order column (number, for sorting)
ALTER TABLE disciplines 
  ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;

-- Add is_highlighted column (boolean, for highlighting on homepage)
ALTER TABLE disciplines 
  ADD COLUMN IF NOT EXISTS is_highlighted boolean DEFAULT false;

-- Ensure slug column exists (should already exist, but adding IF NOT EXISTS for safety)
ALTER TABLE disciplines 
  ADD COLUMN IF NOT EXISTS slug text;

-- Update existing rows: set display_order to 0 if NULL
UPDATE disciplines 
SET display_order = 0 
WHERE display_order IS NULL;

-- Update existing rows: set is_highlighted to false if NULL
UPDATE disciplines 
SET is_highlighted = false 
WHERE is_highlighted IS NULL;

-- Note: slug values should be populated via the seed-disciplines script
-- or manually in the CMS admin



