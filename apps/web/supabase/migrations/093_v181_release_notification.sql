-- Migration: 093_v181_release_notification
-- Description: Create system notification for v1.8.1 release (Data Quality & Resource Relationships)
-- Created: 2025-12-21

-- Insert admin notification for v1.8.1 release
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
  '🔗 Claude Insider v1.8.1 - Data Quality & Resource Relationships!',
  '121 new resource-resource relationships connecting similar tools, alternatives, and complementary resources. Plus 679 data quality fixes ensuring 100% coverage across all 1,952 resources with proper titles and descriptions.',
  '/changelog',
  TRUE,  -- send in-app notification
  TRUE,  -- send push notification
  FALSE, -- don't send email for patch releases
  'all', -- target all users
  'scheduled',
  NOW()  -- send immediately
);
