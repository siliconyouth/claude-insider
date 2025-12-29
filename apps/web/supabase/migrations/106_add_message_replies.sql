-- Migration 106: Add message reply support
-- Adds reply_to_message_id for threading messages (Matrix SDK pattern)

-- Add reply_to_message_id column
ALTER TABLE public.dm_messages
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES public.dm_messages(id) ON DELETE SET NULL;

-- Create index for efficient reply lookups
CREATE INDEX IF NOT EXISTS idx_dm_messages_reply_to ON public.dm_messages(reply_to_message_id)
WHERE reply_to_message_id IS NOT NULL;

-- Note: ON DELETE SET NULL means if the original message is deleted,
-- the reply still exists but the reference is nulled out.
-- This matches Matrix SDK behavior where replies survive deletion of parent.
