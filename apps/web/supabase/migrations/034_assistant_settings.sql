-- AI Assistant Settings
-- Stores user preferences for the AI assistant (voice, name, auto-speak, etc.)
-- Replaces localStorage for authenticated users
-- Note: Uses TEXT for user_id to match Better Auth's user.id type

-- Create assistant_settings table
CREATE TABLE IF NOT EXISTS assistant_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE UNIQUE,

  -- Personalization
  assistant_name TEXT DEFAULT 'Claude',
  user_display_name TEXT,

  -- Voice settings
  selected_voice_id TEXT DEFAULT 'EXAVITQu4vr4xnSDxMaL', -- Sarah (default)
  auto_speak BOOLEAN DEFAULT FALSE,
  speech_rate DECIMAL(3,2) DEFAULT 1.00,

  -- UI preferences
  show_suggested_questions BOOLEAN DEFAULT TRUE,
  show_conversation_history BOOLEAN DEFAULT TRUE,
  compact_mode BOOLEAN DEFAULT FALSE,

  -- Feature flags
  enable_voice_input BOOLEAN DEFAULT TRUE,
  enable_code_highlighting BOOLEAN DEFAULT TRUE,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_assistant_settings_user_id ON assistant_settings(user_id);

-- Enable RLS
ALTER TABLE assistant_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive - actual auth is handled by Better Auth in application layer)
CREATE POLICY "Users can view assistant settings"
  ON assistant_settings
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create assistant settings"
  ON assistant_settings
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update assistant settings"
  ON assistant_settings
  FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete assistant settings"
  ON assistant_settings
  FOR DELETE
  USING (true);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_assistant_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_assistant_settings_updated_at
  BEFORE UPDATE ON assistant_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_assistant_settings_updated_at();

-- Function to get or create assistant settings for a user
CREATE OR REPLACE FUNCTION get_or_create_assistant_settings(p_user_id TEXT)
RETURNS SETOF assistant_settings AS $$
BEGIN
  -- Try to return existing settings
  RETURN QUERY SELECT * FROM assistant_settings WHERE user_id = p_user_id;

  -- If nothing returned, insert and return new settings
  IF NOT FOUND THEN
    RETURN QUERY INSERT INTO assistant_settings (user_id)
    VALUES (p_user_id)
    RETURNING *;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_or_create_assistant_settings(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION get_or_create_assistant_settings(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_assistant_settings(TEXT) TO service_role;
