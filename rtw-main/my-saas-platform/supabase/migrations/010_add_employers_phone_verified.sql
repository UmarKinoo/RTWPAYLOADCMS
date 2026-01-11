-- Add phone_verified column to employers table
-- This column tracks whether the employer has verified their phone number via OTP

-- Add phone_verified column (boolean, default false)
ALTER TABLE employers 
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT FALSE;

-- Update existing rows: set phone_verified to FALSE if NULL
UPDATE employers 
SET phone_verified = FALSE 
WHERE phone_verified IS NULL;

-- Add comment for documentation
COMMENT ON COLUMN employers.phone_verified IS 'Has the employer verified their phone number via OTP';



