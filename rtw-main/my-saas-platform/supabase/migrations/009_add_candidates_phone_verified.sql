-- Add phone_verified column to candidates table
-- This field tracks whether a candidate has verified their phone number via OTP

-- Add phone_verified column (boolean, default false)
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS phone_verified boolean DEFAULT FALSE;

-- Update existing rows: set phone_verified to FALSE if NULL
UPDATE candidates 
SET phone_verified = FALSE 
WHERE phone_verified IS NULL;

-- Add comment to column
COMMENT ON COLUMN candidates.phone_verified IS 'Has the candidate verified their phone number via OTP';



