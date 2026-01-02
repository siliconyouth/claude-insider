-- Migration 115: Voice Messages Support
--
-- Adds support for voice messages in chat:
-- - message_type: Distinguishes text, voice, image, file messages
-- - Voice metadata: duration, waveform visualization data
-- - Storage URL for audio file
-- - Optional AI transcription

-- Add message_type column to distinguish message types
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS message_type TEXT DEFAULT 'text';

-- Add constraint for valid message types
DO $$ BEGIN
  ALTER TABLE dm_messages ADD CONSTRAINT dm_messages_type_check
    CHECK (message_type IN ('text', 'voice', 'image', 'file'));
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Voice message metadata columns
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS voice_duration INTEGER; -- Duration in seconds
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS voice_waveform REAL[]; -- Normalized 0-1 values for visualization
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS voice_url TEXT; -- Supabase storage URL
ALTER TABLE dm_messages ADD COLUMN IF NOT EXISTS voice_transcription TEXT; -- Optional AI transcription

-- Index for finding voice messages
CREATE INDEX IF NOT EXISTS idx_dm_messages_type ON dm_messages(message_type) WHERE message_type != 'text';

-- Index for messages with transcriptions (for search)
CREATE INDEX IF NOT EXISTS idx_dm_messages_transcription ON dm_messages(voice_transcription)
  WHERE voice_transcription IS NOT NULL;

-- Comment for documentation
COMMENT ON COLUMN dm_messages.message_type IS 'Message type: text (default), voice, image, or file';
COMMENT ON COLUMN dm_messages.voice_duration IS 'Duration of voice message in seconds (max 300)';
COMMENT ON COLUMN dm_messages.voice_waveform IS 'Array of normalized amplitude values (0-1) for waveform visualization';
COMMENT ON COLUMN dm_messages.voice_url IS 'Supabase storage URL for voice message audio file';
COMMENT ON COLUMN dm_messages.voice_transcription IS 'AI-generated transcription of voice message (optional)';

-- Storage bucket for voice messages (run via Supabase dashboard or storage API)
-- Bucket: 'voice-messages'
-- Path pattern: {conversation_id}/{message_id}.webm
-- Max file size: 10MB
-- Allowed MIME types: audio/webm, audio/ogg, audio/mp4

-- Function to validate voice message metadata
CREATE OR REPLACE FUNCTION validate_voice_message()
RETURNS TRIGGER AS $$
BEGIN
  -- If message_type is voice, require duration and URL
  IF NEW.message_type = 'voice' THEN
    IF NEW.voice_duration IS NULL OR NEW.voice_duration <= 0 THEN
      RAISE EXCEPTION 'Voice messages must have a positive duration';
    END IF;
    IF NEW.voice_duration > 300 THEN
      RAISE EXCEPTION 'Voice messages cannot exceed 5 minutes (300 seconds)';
    END IF;
    IF NEW.voice_url IS NULL THEN
      RAISE EXCEPTION 'Voice messages must have an audio URL';
    END IF;
    -- Clear text content for voice messages (waveform is the content)
    IF NEW.content IS NULL OR NEW.content = '' THEN
      NEW.content := '[Voice Message]';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate voice messages
DROP TRIGGER IF EXISTS validate_voice_message_trigger ON dm_messages;
CREATE TRIGGER validate_voice_message_trigger
  BEFORE INSERT OR UPDATE ON dm_messages
  FOR EACH ROW
  WHEN (NEW.message_type = 'voice')
  EXECUTE FUNCTION validate_voice_message();

-- Function to get voice messages in a conversation (for gallery view)
CREATE OR REPLACE FUNCTION get_voice_messages(
  p_conversation_id UUID,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  sender_id UUID,
  voice_duration INTEGER,
  voice_waveform REAL[],
  voice_url TEXT,
  voice_transcription TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.sender_id,
    m.voice_duration,
    m.voice_waveform,
    m.voice_url,
    m.voice_transcription,
    m.created_at
  FROM dm_messages m
  WHERE m.conversation_id = p_conversation_id
    AND m.message_type = 'voice'
    AND m.deleted_at IS NULL
  ORDER BY m.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_voice_messages(UUID, INTEGER, INTEGER) TO authenticated;
