-- Add phone_verifications relationship column to payload_locked_documents_rels
-- This allows Payload to manage relationships for the phone_verifications collection

-- Check if the relationship table exists
DO $$
BEGIN
  -- Add phone_verifications_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payload_locked_documents_rels' 
    AND column_name = 'phone_verifications_id'
  ) THEN
    ALTER TABLE payload_locked_documents_rels 
    ADD COLUMN phone_verifications_id integer;
    
    -- Add foreign key constraint if phone_verifications table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'phone_verifications') THEN
      ALTER TABLE payload_locked_documents_rels
      ADD CONSTRAINT fk_phone_verifications 
      FOREIGN KEY (phone_verifications_id) 
      REFERENCES phone_verifications(id) 
      ON DELETE CASCADE;
    END IF;
    
    RAISE NOTICE 'Added phone_verifications_id column to payload_locked_documents_rels';
  ELSE
    RAISE NOTICE 'phone_verifications_id column already exists';
  END IF;
END $$;



