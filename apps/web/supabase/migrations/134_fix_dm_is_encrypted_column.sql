-- Migration 134: Fix Missing is_encrypted Column
--
-- Migration 119 defined functions using is_encrypted column but never added it.
-- This adds the missing column to fix the get_or_create_dm_conversation RPC.
--
-- Error was: column "is_encrypted" of relation "dm_conversations" does not exist

-- Add the missing is_encrypted column
-- Default to FALSE for existing conversations (preserving backward compatibility)
-- New DMs via RPC will set TRUE explicitly
ALTER TABLE dm_conversations ADD COLUMN IF NOT EXISTS is_encrypted BOOLEAN DEFAULT FALSE;

-- Index for filtering encrypted/unencrypted conversations
CREATE INDEX IF NOT EXISTS idx_dm_conversations_is_encrypted ON dm_conversations (is_encrypted);

-- Update existing DMs to be encrypted if they have encryption_disabled_at = NULL
-- (meaning encryption was never disabled, so they should be encrypted)
-- But only for 'direct' type (not groups)
UPDATE dm_conversations
SET is_encrypted = TRUE
WHERE type = 'direct'
  AND encryption_disabled_at IS NULL
  AND is_encrypted = FALSE;

-- Comment for documentation
COMMENT ON COLUMN dm_conversations.is_encrypted IS 'Whether E2EE is enabled. Default TRUE for new DMs (v1.14.0+), opt-in for groups.';
