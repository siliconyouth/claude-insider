-- Migration: 024_push_subscriptions
-- Description: Store Web Push subscriptions for background notifications
-- Created: 2025-12-15

-- Push subscriptions table for Web Push notifications
-- This enables notifications even when users aren't on the website
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Web Push subscription data
  endpoint TEXT NOT NULL,
  p256dh_key TEXT NOT NULL,
  auth_key TEXT NOT NULL,

  -- Device identification (for managing multiple devices per user)
  user_agent TEXT,
  device_name TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,

  -- Ensure unique endpoint per user (prevent duplicate subscriptions)
  UNIQUE(user_id, endpoint)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_endpoint ON push_subscriptions(endpoint);

-- Row Level Security
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can only see/manage their own subscriptions
CREATE POLICY "Users can view own push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete own push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- Service role bypass for server-side operations
CREATE POLICY "Service role has full access to push subscriptions"
  ON push_subscriptions
  USING (auth.role() = 'service_role');

-- Function to clean up old unused subscriptions (older than 30 days without use)
CREATE OR REPLACE FUNCTION cleanup_stale_push_subscriptions()
RETURNS void AS $$
BEGIN
  DELETE FROM push_subscriptions
  WHERE last_used_at < NOW() - INTERVAL '30 days'
     OR (last_used_at IS NULL AND created_at < NOW() - INTERVAL '30 days');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE push_subscriptions IS 'Web Push subscriptions for browser notifications when users are not on the website';
COMMENT ON COLUMN push_subscriptions.endpoint IS 'Push service endpoint URL from browser';
COMMENT ON COLUMN push_subscriptions.p256dh_key IS 'P-256 Diffie-Hellman public key for encryption';
COMMENT ON COLUMN push_subscriptions.auth_key IS 'Authentication secret for encryption';
