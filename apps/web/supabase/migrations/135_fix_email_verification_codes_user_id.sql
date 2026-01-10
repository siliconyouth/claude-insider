-- Migration: Fix email_verification_codes table
-- Problem: user_id column is NOT NULL but Better Auth may not have user.id during signup flow
-- This caused ALL verification code inserts to fail silently

-- 1. Drop the NOT NULL constraint on user_id
ALTER TABLE email_verification_codes 
ALTER COLUMN user_id DROP NOT NULL;

-- 2. Add comment explaining why it's nullable
COMMENT ON COLUMN email_verification_codes.user_id IS 
'Nullable because during email signup flow, user may not exist yet. Email address is the primary identifier for verification.';

-- 3. Add index on email for faster lookups (if not exists)
CREATE INDEX IF NOT EXISTS idx_email_verification_codes_email 
ON email_verification_codes (email);

-- 4. Log this fix
DO $$
BEGIN
  RAISE NOTICE 'Fixed email_verification_codes: user_id is now nullable to support Better Auth signup flow';
END $$;
