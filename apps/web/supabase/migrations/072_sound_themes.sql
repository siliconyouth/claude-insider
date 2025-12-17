-- =============================================================================
-- Migration 072: Sound Themes
-- =============================================================================
-- Adds sound_theme column to assistant_settings for persisting user's
-- selected sound theme across sessions.
--
-- Valid themes: claude-insider, anthropic, apple, microsoft, google,
--               linux, whatsapp, telegram, github, vercel
-- =============================================================================

-- Add sound_theme column to assistant_settings
ALTER TABLE assistant_settings
ADD COLUMN IF NOT EXISTS sound_theme VARCHAR(50) DEFAULT 'claude-insider';

-- Add comment for documentation
COMMENT ON COLUMN assistant_settings.sound_theme IS
'Selected sound theme: claude-insider (default), anthropic, apple, microsoft, google, linux, whatsapp, telegram, github, vercel';

-- Create index for faster lookups (useful for analytics/reporting)
CREATE INDEX IF NOT EXISTS idx_assistant_settings_sound_theme
ON assistant_settings(sound_theme);

-- =============================================================================
-- End Migration 072
-- =============================================================================
