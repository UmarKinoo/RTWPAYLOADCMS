-- Make employers.phone optional (nullable) to support existing records
-- New registrations will require phone via form validation, but existing records can have NULL

-- Ensure phone column allows NULL (in case it was set to NOT NULL previously)
-- This prevents errors when Payload tries to sync schema with existing NULL values
ALTER TABLE employers ALTER COLUMN phone DROP NOT NULL;

-- Note: Phone is kept as nullable in the database to avoid breaking existing records
-- Form validation ensures new registrations include phone number
-- The collection definition has required: false to match database schema
