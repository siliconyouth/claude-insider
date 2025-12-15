-- Multi-Device Two-Factor Authentication Migration
-- Extends 2FA to support multiple devices with custom names

-- Create 2FA devices table
CREATE TABLE IF NOT EXISTS two_factor_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  device_name VARCHAR(100) NOT NULL DEFAULT 'Authenticator',
  device_type VARCHAR(50) NOT NULL DEFAULT 'totp', -- 'totp', 'sms', 'email'
  secret TEXT NOT NULL, -- Encrypted TOTP secret
  is_primary BOOLEAN DEFAULT FALSE,
  is_verified BOOLEAN DEFAULT FALSE,
  last_used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_2fa_devices_user ON two_factor_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_2fa_devices_primary ON two_factor_devices(user_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_2fa_devices_verified ON two_factor_devices(user_id, is_verified);

-- Function to add a new 2FA device
CREATE OR REPLACE FUNCTION add_2fa_device(
  p_user_id TEXT,
  p_device_name VARCHAR(100),
  p_secret TEXT,
  p_device_type VARCHAR(50) DEFAULT 'totp'
)
RETURNS UUID AS $$
DECLARE
  v_device_id UUID;
  v_is_first BOOLEAN;
BEGIN
  -- Check if this is the first device
  SELECT NOT EXISTS(
    SELECT 1 FROM two_factor_devices WHERE user_id = p_user_id AND is_verified = TRUE
  ) INTO v_is_first;

  -- Insert the new device
  INSERT INTO two_factor_devices (user_id, device_name, device_type, secret, is_primary)
  VALUES (p_user_id, p_device_name, p_device_type, p_secret, v_is_first)
  RETURNING id INTO v_device_id;

  RETURN v_device_id;
END;
$$ LANGUAGE plpgsql;

-- Function to verify a 2FA device (after user confirms with code)
CREATE OR REPLACE FUNCTION verify_2fa_device(
  p_device_id UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_first BOOLEAN;
BEGIN
  -- Check if this is the first verified device
  SELECT NOT EXISTS(
    SELECT 1 FROM two_factor_devices WHERE user_id = p_user_id AND is_verified = TRUE
  ) INTO v_is_first;

  -- Mark device as verified
  UPDATE two_factor_devices
  SET is_verified = TRUE,
      is_primary = v_is_first,
      updated_at = NOW()
  WHERE id = p_device_id AND user_id = p_user_id;

  -- If this is the first device, enable 2FA on user
  IF v_is_first THEN
    UPDATE "user"
    SET "twoFactorEnabled" = TRUE,
        "twoFactorVerifiedAt" = NOW()
    WHERE id = p_user_id;
  END IF;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to remove a 2FA device
CREATE OR REPLACE FUNCTION remove_2fa_device(
  p_device_id UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  v_was_primary BOOLEAN;
  v_remaining_count INT;
BEGIN
  -- Get device info
  SELECT is_primary INTO v_was_primary
  FROM two_factor_devices
  WHERE id = p_device_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Delete the device
  DELETE FROM two_factor_devices
  WHERE id = p_device_id AND user_id = p_user_id;

  -- Count remaining verified devices
  SELECT COUNT(*) INTO v_remaining_count
  FROM two_factor_devices
  WHERE user_id = p_user_id AND is_verified = TRUE;

  -- If no devices left, disable 2FA
  IF v_remaining_count = 0 THEN
    UPDATE "user"
    SET "twoFactorEnabled" = FALSE,
        "twoFactorSecret" = NULL,
        "twoFactorVerifiedAt" = NULL
    WHERE id = p_user_id;
  -- If primary was deleted, make another device primary
  ELSIF v_was_primary THEN
    UPDATE two_factor_devices
    SET is_primary = TRUE
    WHERE user_id = p_user_id
      AND is_verified = TRUE
      AND is_primary = FALSE
    ORDER BY created_at ASC
    LIMIT 1;
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to set a device as primary
CREATE OR REPLACE FUNCTION set_primary_2fa_device(
  p_device_id UUID,
  p_user_id TEXT
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Unset current primary
  UPDATE two_factor_devices
  SET is_primary = FALSE, updated_at = NOW()
  WHERE user_id = p_user_id AND is_primary = TRUE;

  -- Set new primary
  UPDATE two_factor_devices
  SET is_primary = TRUE, updated_at = NOW()
  WHERE id = p_device_id AND user_id = p_user_id AND is_verified = TRUE;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to rename a device
CREATE OR REPLACE FUNCTION rename_2fa_device(
  p_device_id UUID,
  p_user_id TEXT,
  p_new_name VARCHAR(100)
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE two_factor_devices
  SET device_name = p_new_name, updated_at = NOW()
  WHERE id = p_device_id AND user_id = p_user_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Function to record device usage
CREATE OR REPLACE FUNCTION record_2fa_device_usage(
  p_device_id UUID
)
RETURNS VOID AS $$
BEGIN
  UPDATE two_factor_devices
  SET last_used_at = NOW()
  WHERE id = p_device_id;
END;
$$ LANGUAGE plpgsql;

-- RLS policies for two_factor_devices
ALTER TABLE two_factor_devices ENABLE ROW LEVEL SECURITY;

-- Users can only view their own devices
CREATE POLICY "Users can view own 2FA devices" ON two_factor_devices
  FOR SELECT USING (user_id = auth.uid()::TEXT);

-- Users can create their own devices
CREATE POLICY "Users can create own 2FA devices" ON two_factor_devices
  FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);

-- Users can update their own devices
CREATE POLICY "Users can update own 2FA devices" ON two_factor_devices
  FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- Users can delete their own devices
CREATE POLICY "Users can delete own 2FA devices" ON two_factor_devices
  FOR DELETE USING (user_id = auth.uid()::TEXT);

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION add_2fa_device TO authenticated;
GRANT EXECUTE ON FUNCTION verify_2fa_device TO authenticated;
GRANT EXECUTE ON FUNCTION remove_2fa_device TO authenticated;
GRANT EXECUTE ON FUNCTION set_primary_2fa_device TO authenticated;
GRANT EXECUTE ON FUNCTION rename_2fa_device TO authenticated;
GRANT EXECUTE ON FUNCTION record_2fa_device_usage TO authenticated;
