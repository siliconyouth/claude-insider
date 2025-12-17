-- Fix E2EE one_time_prekeys key_id column type
-- Vodozemac returns base64-encoded string key IDs, not integers

-- Change key_id from INTEGER to TEXT
ALTER TABLE one_time_prekeys ALTER COLUMN key_id TYPE TEXT USING key_id::TEXT;

-- Update claim function to return TEXT key_id
DROP FUNCTION IF EXISTS claim_one_time_prekey(text, text, text, text);

CREATE OR REPLACE FUNCTION public.claim_one_time_prekey(
  p_target_user_id text,
  p_target_device_id text,
  p_claimer_user_id text,
  p_claimer_device_id text
)
RETURNS TABLE(key_id text, public_key text)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_device_key_id UUID;
  v_prekey_id TEXT;
  v_public_key TEXT;
BEGIN
  -- Find the target device
  SELECT dk.id INTO v_device_key_id
  FROM device_keys dk
  WHERE dk.user_id = p_target_user_id
    AND dk.device_id = p_target_device_id;

  IF v_device_key_id IS NULL THEN
    RETURN;
  END IF;

  -- Claim one unclaimed prekey atomically
  UPDATE one_time_prekeys otp
  SET
    claimed_at = NOW(),
    claimed_by_user = p_claimer_user_id,
    claimed_by_device = p_claimer_device_id
  WHERE otp.id = (
    SELECT id FROM one_time_prekeys
    WHERE device_key_id = v_device_key_id
      AND claimed_at IS NULL
    ORDER BY created_at ASC
    LIMIT 1
    FOR UPDATE SKIP LOCKED
  )
  RETURNING otp.key_id, otp.public_key
  INTO v_prekey_id, v_public_key;

  IF v_prekey_id IS NOT NULL THEN
    key_id := v_prekey_id;
    public_key := v_public_key;
    RETURN NEXT;
  END IF;

  RETURN;
END;
$function$;
