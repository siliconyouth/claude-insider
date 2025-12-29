-- ============================================
-- Migration 105: Message Reactions
-- ============================================
-- Adds support for emoji reactions on messages (Matrix SDK pattern).
-- Users can react to messages with emojis, and reactions are aggregated.

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.dm_messages(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Each user can only react once with the same emoji per message
  UNIQUE (message_id, user_id, emoji)
);

-- Add index for fast lookups by message
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id
  ON public.message_reactions(message_id);

-- Add index for user's reactions
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id
  ON public.message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view reactions on messages they can see
CREATE POLICY "message_reactions_select"
  ON public.message_reactions
  FOR SELECT
  USING (
    message_id IN (
      SELECT m.id FROM public.dm_messages m
      JOIN public.dm_participants p ON p.conversation_id = m.conversation_id
      WHERE p.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Policy: Users can add reactions to messages they can see
CREATE POLICY "message_reactions_insert"
  ON public.message_reactions
  FOR INSERT
  WITH CHECK (
    user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    AND message_id IN (
      SELECT m.id FROM public.dm_messages m
      JOIN public.dm_participants p ON p.conversation_id = m.conversation_id
      WHERE p.user_id = current_setting('request.jwt.claims', true)::json->>'sub'
    )
  );

-- Policy: Users can remove their own reactions
CREATE POLICY "message_reactions_delete"
  ON public.message_reactions
  FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Service role can do everything
CREATE POLICY "message_reactions_service_role"
  ON public.message_reactions
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

-- Comment for documentation
COMMENT ON TABLE public.message_reactions IS 'Message reactions with emojis (Matrix SDK pattern)';
COMMENT ON COLUMN public.message_reactions.emoji IS 'Unicode emoji character';
