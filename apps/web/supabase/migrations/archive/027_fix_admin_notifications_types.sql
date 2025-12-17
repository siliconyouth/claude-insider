-- Migration: 027_fix_admin_notifications_types
-- Description: Fix type mismatches - user IDs should be TEXT not UUID
-- Created: 2025-12-15

-- Drop and recreate tables with correct types
-- (Needs to drop dependent tables first due to foreign keys)

-- Drop the delivery table first (depends on admin_notifications)
DROP TABLE IF EXISTS admin_notification_deliveries;

-- Drop the main table
DROP TABLE IF EXISTS admin_notifications;

-- Recreate with correct TEXT types for user IDs
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content
  title TEXT NOT NULL,
  message TEXT,
  link TEXT,

  -- Delivery channels
  send_in_app BOOLEAN DEFAULT TRUE,
  send_push BOOLEAN DEFAULT TRUE,
  send_email BOOLEAN DEFAULT FALSE,

  -- Targeting (TEXT[] for user IDs since Better Auth uses TEXT ids)
  target_type TEXT NOT NULL DEFAULT 'all',
  target_roles TEXT[] DEFAULT '{}',
  target_user_ids TEXT[] DEFAULT '{}',

  -- Scheduling
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,

  -- Stats
  total_recipients INTEGER DEFAULT 0,
  successful_deliveries INTEGER DEFAULT 0,
  failed_deliveries INTEGER DEFAULT 0,

  -- Metadata (TEXT for user ID reference)
  created_by TEXT REFERENCES "user"(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Error tracking
  last_error TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_admin_notifications_status ON admin_notifications(status);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_scheduled_at ON admin_notifications(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_by ON admin_notifications(created_by);

-- Delivery log with TEXT user_id
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

-- Updated function with correct types
CREATE OR REPLACE FUNCTION get_notification_target_users(p_notification_id UUID)
RETURNS TABLE(user_id TEXT, email TEXT, name TEXT, role TEXT) AS $$
DECLARE
  notif RECORD;
BEGIN
  SELECT * INTO notif FROM admin_notifications WHERE id = p_notification_id;

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

-- RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notification_deliveries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Admins can manage admin notifications"
  ON admin_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('admin', 'moderator')
    )
  );

CREATE POLICY "Admins can view delivery logs"
  ON admin_notification_deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "user" u
      WHERE u.id = auth.uid()::text
      AND u.role IN ('admin', 'moderator')
    )
  );

COMMENT ON TABLE admin_notifications IS 'Admin-created notifications with scheduling, targeting, and multi-channel delivery';
COMMENT ON TABLE admin_notification_deliveries IS 'Delivery tracking for admin notifications per user';
