-- Add missing fields to employers table
-- These fields are defined in the Employers collection but missing from production

-- Add email_verified column (boolean, for email verification status)
ALTER TABLE employers 
  ADD COLUMN IF NOT EXISTS email_verified boolean DEFAULT false;

-- Add email_verification_token column (text, for email verification)
ALTER TABLE employers 
  ADD COLUMN IF NOT EXISTS email_verification_token text;

-- Add email_verification_expires column (timestamp, for email verification expiry)
ALTER TABLE employers 
  ADD COLUMN IF NOT EXISTS email_verification_expires timestamp with time zone;

-- Add password_reset_token column (text, for password reset)
-- Note: reset_password_token already exists, but Payload might expect password_reset_token
ALTER TABLE employers 
  ADD COLUMN IF NOT EXISTS password_reset_token text;

-- Add password_reset_expires column (timestamp, for password reset expiry)
-- Note: reset_password_expiration already exists, but Payload might expect password_reset_expires
ALTER TABLE employers 
  ADD COLUMN IF NOT EXISTS password_reset_expires timestamp with time zone;

-- Update existing rows: set email_verified to false if NULL
UPDATE employers 
SET email_verified = false 
WHERE email_verified IS NULL;

-- Note: password column is not needed - Payload uses hash and salt for authentication
-- The password field in the collection definition is handled by Payload's auth system

