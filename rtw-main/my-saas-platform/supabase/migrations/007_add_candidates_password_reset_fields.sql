-- Add password reset fields to candidates table
-- These fields are defined in the Candidates collection but missing from production

-- Add password_reset_token column (text, for password reset)
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS password_reset_token text;

-- Add password_reset_expires column (timestamp, for password reset expiry)
ALTER TABLE candidates 
  ADD COLUMN IF NOT EXISTS password_reset_expires timestamp with time zone;

-- Note: These fields are used by the custom password reset functionality
-- They work alongside Payload's built-in reset_password_token and reset_password_expiration fields

