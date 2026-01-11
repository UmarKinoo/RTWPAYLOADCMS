-- Create phone_verifications table for OTP verification
-- This table stores OTP verification data for phone numbers

CREATE TABLE IF NOT EXISTS phone_verifications (
  id serial PRIMARY KEY,
  phone text NOT NULL,
  user_id text,
  user_collection text,
  otp_hash text NOT NULL,
  otp_salt text NOT NULL,
  expires_at timestamp with time zone NOT NULL,
  attempts integer DEFAULT 0 NOT NULL,
  verified_at timestamp with time zone,
  last_sent_at timestamp with time zone,
  request_ip text,
  user_agent text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone ON phone_verifications(phone);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_phone_verified ON phone_verifications(phone, verified_at);
CREATE INDEX IF NOT EXISTS idx_phone_verifications_user_id ON phone_verifications(user_id) WHERE user_id IS NOT NULL;

-- Add comments for documentation
COMMENT ON TABLE phone_verifications IS 'Stores OTP verification data for phone number verification';
COMMENT ON COLUMN phone_verifications.phone IS 'Phone number in E.164 format (e.g., +9665xxxxxxx)';
COMMENT ON COLUMN phone_verifications.otp_hash IS 'SHA256 hash of OTP + salt';
COMMENT ON COLUMN phone_verifications.otp_salt IS 'Random salt for OTP hashing';
COMMENT ON COLUMN phone_verifications.verified_at IS 'Timestamp when OTP was successfully verified';



