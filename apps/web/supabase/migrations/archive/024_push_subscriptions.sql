-- Migration: 024_push_subscriptions
-- Description: Store Web Push subscriptions for background notifications
-- Created: 2025-12-15
-- Note: Uses TEXT for user_id to match Better Auth's user.id type

-- Push subscriptions table for Web Push notifications
-- This enables notifications even when users aren't on the website
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

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

-- Row Level Security (permissive - Better Auth handles auth at app layer)
ALTER TABLE push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view push subscriptions"
  ON push_subscriptions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert push subscriptions"
  ON push_subscriptions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can delete push subscriptions"
  ON push_subscriptions FOR DELETE
  USING (true);

CREATE POLICY "Users can update push subscriptions"
  ON push_subscriptions FOR UPDATE
  USING (true);

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
