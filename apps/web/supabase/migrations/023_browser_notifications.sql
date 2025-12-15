-- Migration: 023_browser_notifications
-- Description: Add browser push notification preferences
-- Created: 2025-12-15

-- Add browser_notifications column to notification_preferences
ALTER TABLE notification_preferences
ADD COLUMN IF NOT EXISTS browser_notifications BOOLEAN DEFAULT FALSE;

-- Update the create_notification function to handle browser notifications
-- (Browser notifications are handled client-side, so no server-side changes needed)

COMMENT ON COLUMN notification_preferences.browser_notifications IS 'Whether the user has enabled browser push notifications';
