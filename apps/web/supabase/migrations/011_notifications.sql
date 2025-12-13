-- Migration: 011_notifications
-- Description: In-app notifications system
-- Created: 2025-12-13

-- Notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Actor who triggered the notification (optional)
  actor_id TEXT REFERENCES "user"(id) ON DELETE SET NULL,

  -- Related resource (optional)
  resource_type TEXT,
  resource_id TEXT
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, read) WHERE read = FALSE;
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE UNIQUE,

  -- In-app notification preferences
  in_app_comments BOOLEAN DEFAULT TRUE,
  in_app_replies BOOLEAN DEFAULT TRUE,
  in_app_suggestions BOOLEAN DEFAULT TRUE,
  in_app_follows BOOLEAN DEFAULT TRUE,
  in_app_mentions BOOLEAN DEFAULT TRUE,

  -- Email notification preferences (for Phase 7)
  email_comments BOOLEAN DEFAULT FALSE,
  email_replies BOOLEAN DEFAULT TRUE,
  email_suggestions BOOLEAN DEFAULT TRUE,
  email_follows BOOLEAN DEFAULT FALSE,
  email_digest BOOLEAN DEFAULT FALSE,
  email_digest_frequency TEXT DEFAULT 'weekly',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);

-- Function to create a notification
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id TEXT,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT DEFAULT NULL,
  p_data JSONB DEFAULT '{}',
  p_actor_id TEXT DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
  v_notification_id UUID;
  v_prefs notification_preferences;
  v_should_notify BOOLEAN := TRUE;
BEGIN
  -- Don't notify yourself
  IF p_user_id = p_actor_id THEN
    RETURN NULL;
  END IF;

  -- Check user preferences
  SELECT * INTO v_prefs FROM notification_preferences WHERE user_id = p_user_id;

  IF v_prefs IS NOT NULL THEN
    CASE p_type
      WHEN 'comment' THEN v_should_notify := v_prefs.in_app_comments;
      WHEN 'reply' THEN v_should_notify := v_prefs.in_app_replies;
      WHEN 'suggestion_approved', 'suggestion_rejected', 'suggestion_merged' THEN
        v_should_notify := v_prefs.in_app_suggestions;
      WHEN 'follow' THEN v_should_notify := v_prefs.in_app_follows;
      WHEN 'mention' THEN v_should_notify := v_prefs.in_app_mentions;
      ELSE v_should_notify := TRUE;
    END CASE;
  END IF;

  IF NOT v_should_notify THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (
    user_id, type, title, message, data, actor_id, resource_type, resource_id
  ) VALUES (
    p_user_id, p_type, p_title, p_message, p_data, p_actor_id, p_resource_type, p_resource_id
  ) RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$ LANGUAGE plpgsql;

-- Function to mark notifications as read
CREATE OR REPLACE FUNCTION mark_notifications_read(
  p_user_id TEXT,
  p_notification_ids UUID[] DEFAULT NULL
) RETURNS INTEGER AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF p_notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE notifications
    SET read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND read = FALSE;
  ELSE
    -- Mark specific notifications as read
    UPDATE notifications
    SET read = TRUE, read_at = NOW()
    WHERE user_id = p_user_id AND id = ANY(p_notification_ids) AND read = FALSE;
  END IF;

  GET DIAGNOSTICS v_count = ROW_COUNT;
  RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get unread count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id TEXT)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM notifications
    WHERE user_id = p_user_id AND read = FALSE
  );
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
CREATE POLICY "Users can view own notifications"
  ON notifications FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
CREATE POLICY "Users can update own notifications"
  ON notifications FOR UPDATE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;
CREATE POLICY "Users can delete own notifications"
  ON notifications FOR DELETE
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Users can manage their own preferences
DROP POLICY IF EXISTS "Users can view own notification preferences" ON notification_preferences;
CREATE POLICY "Users can view own notification preferences"
  ON notification_preferences FOR SELECT
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

DROP POLICY IF EXISTS "Users can update own notification preferences" ON notification_preferences;
CREATE POLICY "Users can update own notification preferences"
  ON notification_preferences FOR ALL
  USING (user_id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Grant access
GRANT ALL ON notifications TO authenticated;
GRANT ALL ON notification_preferences TO authenticated;
