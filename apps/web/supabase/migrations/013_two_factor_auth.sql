-- Two-Factor Authentication Migration
-- Adds TOTP-based 2FA with backup codes

-- Add 2FA columns to user table
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twoFactorEnabled" BOOLEAN DEFAULT FALSE;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twoFactorSecret" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twoFactorBackupCodes" TEXT[];
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "twoFactorVerifiedAt" TIMESTAMPTZ;

-- Create 2FA sessions table for pending verifications
CREATE TABLE IF NOT EXISTS two_factor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Index for fast session lookups
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_token ON two_factor_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_user ON two_factor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_two_factor_sessions_expires ON two_factor_sessions(expires_at);

-- Cleanup expired sessions automatically
CREATE OR REPLACE FUNCTION cleanup_expired_2fa_sessions()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM two_factor_sessions WHERE expires_at < NOW();
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for periodic cleanup (runs on insert)
DROP TRIGGER IF EXISTS trigger_cleanup_2fa_sessions ON two_factor_sessions;
CREATE TRIGGER trigger_cleanup_2fa_sessions
AFTER INSERT ON two_factor_sessions
EXECUTE FUNCTION cleanup_expired_2fa_sessions();

-- Function to enable 2FA for a user
CREATE OR REPLACE FUNCTION enable_two_factor(
  p_user_id TEXT,
  p_secret TEXT,
  p_backup_codes TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "user"
  SET
    "twoFactorEnabled" = TRUE,
    "twoFactorSecret" = p_secret,
    "twoFactorBackupCodes" = p_backup_codes,
    "twoFactorVerifiedAt" = NOW()
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to disable 2FA for a user
CREATE OR REPLACE FUNCTION disable_two_factor(p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "user"
  SET
    "twoFactorEnabled" = FALSE,
    "twoFactorSecret" = NULL,
    "twoFactorBackupCodes" = NULL,
    "twoFactorVerifiedAt" = NULL
  WHERE id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to use a backup code (removes it from the array)
CREATE OR REPLACE FUNCTION use_backup_code(
  p_user_id TEXT,
  p_backup_code TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_codes TEXT[];
  v_code_index INT;
BEGIN
  -- Get current backup codes
  SELECT "twoFactorBackupCodes" INTO v_codes
  FROM "user"
  WHERE id = p_user_id;

  -- Find the code in the array
  v_code_index := array_position(v_codes, p_backup_code);

  IF v_code_index IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Remove the used code
  v_codes := array_remove(v_codes, p_backup_code);

  -- Update the user
  UPDATE "user"
  SET "twoFactorBackupCodes" = v_codes
  WHERE id = p_user_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to regenerate backup codes
CREATE OR REPLACE FUNCTION regenerate_backup_codes(
  p_user_id TEXT,
  p_new_codes TEXT[]
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE "user"
  SET "twoFactorBackupCodes" = p_new_codes
  WHERE id = p_user_id AND "twoFactorEnabled" = TRUE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for two_factor_sessions
ALTER TABLE two_factor_sessions ENABLE ROW LEVEL SECURITY;

-- Users can only see their own 2FA sessions
CREATE POLICY "Users can view own 2FA sessions" ON two_factor_sessions
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Users can create their own 2FA sessions
CREATE POLICY "Users can create own 2FA sessions" ON two_factor_sessions
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

-- Users can update their own 2FA sessions
CREATE POLICY "Users can update own 2FA sessions" ON two_factor_sessions
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- Users can delete their own 2FA sessions
CREATE POLICY "Users can delete own 2FA sessions" ON two_factor_sessions
  FOR DELETE USING (user_id = auth.uid()::TEXT);

-- Grant execute on functions to authenticated users
GRANT EXECUTE ON FUNCTION enable_two_factor TO authenticated;
GRANT EXECUTE ON FUNCTION disable_two_factor TO authenticated;
GRANT EXECUTE ON FUNCTION use_backup_code TO authenticated;
GRANT EXECUTE ON FUNCTION regenerate_backup_codes TO authenticated;
