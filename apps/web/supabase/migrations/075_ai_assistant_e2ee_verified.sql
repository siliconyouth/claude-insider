-- Migration 075: AI Assistant E2EE Verified Device
--
-- Sets up the AI assistant's E2EE identity as always verified.
-- The AI doesn't actually decrypt messages - users consent to share
-- decrypted content with the AI. But the AI needs a "device" entry
-- to show as verified in the UI.

-- Create AI assistant's system device (pre-verified)
INSERT INTO public.device_keys (
  user_id,
  device_id,
  identity_key,
  signing_key,
  device_name,
  device_type,
  is_verified,
  verified_at,
  verification_method
)
VALUES (
  'ai-assistant-claudeinsider',
  'claude-insider-system',
  'AI_SYSTEM_IDENTITY_KEY', -- Placeholder - AI doesn't actually use keys
  'AI_SYSTEM_SIGNING_KEY',  -- Placeholder - AI doesn't actually use keys
  'Claude Insider AI System',
  'web',
  TRUE,                      -- Pre-verified
  NOW(),
  'admin'                    -- Verified by system/admin authority
) ON CONFLICT (user_id, device_id) DO UPDATE SET
  is_verified = TRUE,
  verified_at = NOW(),
  verification_method = 'admin',
  device_name = 'Claude Insider AI System';

-- Ensure AI profile is marked as verified (bot verification)
UPDATE public.profiles
SET is_verified = TRUE
WHERE user_id = 'ai-assistant-claudeinsider';

-- Add comment documenting the AI E2EE approach
COMMENT ON TABLE public.device_keys IS
'E2EE device keys for users. The AI assistant has a special "system" device that is pre-verified. The AI does not actually decrypt messages - users consent to share decrypted content with the AI via the e2ee_ai_consent table.';
