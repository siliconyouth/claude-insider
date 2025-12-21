-- Migration: 092_v180_release_notification
-- Description: Create system notification for v1.8.0 release (Admin Dashboard & Resource Discovery)
-- Created: 2025-12-21

-- Insert admin notification for v1.8.0 release
-- This will be delivered to all users via the cron job
INSERT INTO admin_notifications (
  title,
  message,
  link,
  send_in_app,
  send_push,
  send_email,
  target_type,
  status,
  scheduled_at
) VALUES (
  '🎛️ Claude Insider v1.8.0 - Admin Dashboard & Resource Discovery!',
  'New: Admin Dashboard with Documentation, Resources, and Relationships management pages. Plus a powerful resource discovery pipeline with 6 adapter types (GitHub, ProductHunt, npm, and more). 120 database tables, 1,952 resources cataloged!',
  '/changelog',
  TRUE,  -- send in-app notification
  TRUE,  -- send push notification
  FALSE, -- don't send email for minor releases
  'all', -- target all users
  'scheduled',
  NOW()  -- send immediately
);
