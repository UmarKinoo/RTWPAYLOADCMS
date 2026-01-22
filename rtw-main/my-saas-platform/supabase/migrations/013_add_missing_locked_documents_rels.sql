-- Add missing relationship columns to payload_locked_documents_rels
-- This fixes the document locking query that was failing in production
-- Missing columns: contact_submissions_id, newsletter_subscriptions_id

-- Check if the relationship table exists
DO $$
BEGIN
  -- Add contact_submissions_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payload_locked_documents_rels' 
    AND column_name = 'contact_submissions_id'
  ) THEN
    ALTER TABLE payload_locked_documents_rels 
    ADD COLUMN contact_submissions_id integer;
    
    -- Add foreign key constraint if contact_submissions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contact_submissions') THEN
      ALTER TABLE payload_locked_documents_rels
      ADD CONSTRAINT fk_contact_submissions 
      FOREIGN KEY (contact_submissions_id) 
      REFERENCES contact_submissions(id) 
      ON DELETE CASCADE;
    END IF;
    
    RAISE NOTICE 'Added contact_submissions_id column to payload_locked_documents_rels';
  ELSE
    RAISE NOTICE 'contact_submissions_id column already exists';
  END IF;

  -- Add newsletter_subscriptions_id column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payload_locked_documents_rels' 
    AND column_name = 'newsletter_subscriptions_id'
  ) THEN
    ALTER TABLE payload_locked_documents_rels 
    ADD COLUMN newsletter_subscriptions_id integer;
    
    -- Add foreign key constraint if newsletter_subscriptions table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'newsletter_subscriptions') THEN
      ALTER TABLE payload_locked_documents_rels
      ADD CONSTRAINT fk_newsletter_subscriptions 
      FOREIGN KEY (newsletter_subscriptions_id) 
      REFERENCES newsletter_subscriptions(id) 
      ON DELETE CASCADE;
    END IF;
    
    RAISE NOTICE 'Added newsletter_subscriptions_id column to payload_locked_documents_rels';
  ELSE
    RAISE NOTICE 'newsletter_subscriptions_id column already exists';
  END IF;
END $$;
