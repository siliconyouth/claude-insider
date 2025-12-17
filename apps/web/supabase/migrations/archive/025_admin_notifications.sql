-- Migration: 025_admin_notifications
-- Description: Admin-created notifications with scheduling and targeting
-- Created: 2025-12-15
-- Note: Uses TEXT for user_id to match Better Auth's user.id type

-- Admin notifications table for bulk/scheduled notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  message TEXT,
  link TEXT, -- Custom deep link URL

  -- Delivery channels (which notification methods to use)
  send_in_app BOOLEAN DEFAULT TRUE,
  send_push BOOLEAN DEFAULT TRUE,
  send_email BOOLEAN DEFAULT FALSE,

  -- Targeting
  target_type TEXT NOT NULL DEFAULT 'all', -- 'all', 'role', 'users'
  target_roles TEXT[] DEFAULT '{}', -- Array of roles: 'admin', 'moderator', 'editor', 'beta_tester', 'user'
  target_user_ids TEXT[] DEFAULT '{}', -- Specific user IDs (TEXT to match Better Auth)

  -- Scheduling
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'sent', 'failed', 'cancelled'
  scheduled_at TIMESTAMPTZ, -- NULL means send immediately when status changes to 'scheduled'
  sent_at TIMESTAMPTZ,

  -- Stats
  total_recipients INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,

  -- Metadata
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Error tracking
  last_error TEXT
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_scheduled_at ON admin_notifications(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_by ON admin_notifications(created_by);

-- Delivery log for tracking individual sends
CREATE TABLE IF NOT EXISTS admin_notification_deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id UUID NOT NULL REFERENCES admin_notifications(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,

  -- Delivery status per channel
  in_app_sent BOOLEAN DEFAULT FALSE,
  in_app_sent_at TIMESTAMPTZ,
  push_sent BOOLEAN DEFAULT FALSE,
  push_sent_at TIMESTAMPTZ,
  email_sent BOOLEAN DEFAULT FALSE,
  email_sent_at TIMESTAMPTZ,

  -- Error tracking
  error TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_admin_notification_deliveries_notification ON admin_notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_admin_notification_deliveries_user ON admin_notification_deliveries(user_id);

-- Function to get target users for a notification
CREATE OR REPLACE FUNCTION get_notification_target_users(notification_id UUID)
RETURNS TABLE(user_id TEXT, email TEXT, name TEXT, role TEXT) AS $$
DECLARE
  notif RECORD;
BEGIN
  SELECT * INTO notif FROM admin_notifications WHERE id = notification_id;

  IF notif.target_type = 'all' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role
    FROM "user" u
    WHERE u.email IS NOT NULL;

  ELSIF notif.target_type = 'role' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role
    FROM "user" u
    WHERE u.role = ANY(notif.target_roles)
      AND u.email IS NOT NULL;

  ELSIF notif.target_type = 'users' THEN
    RETURN QUERY
    SELECT u.id, u.email, u.name, u.role
    FROM "user" u
    WHERE u.id = ANY(notif.target_user_ids)
      AND u.email IS NOT NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (permissive - Better Auth handles auth at app layer)
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Permissive policies for admin notifications
CREATE POLICY "Full access to admin notifications"
  ON admin_notifications
  USING (true);

CREATE POLICY "Full access to delivery logs"
  ON admin_notification_deliveries
  USING (true);

COMMENT ON TABLE admin_notifications IS 'Admin-created notifications with scheduling, targeting, and multi-channel delivery';
COMMENT ON TABLE admin_notification_deliveries IS 'Delivery tracking for admin notifications per user';
