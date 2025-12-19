-- Migration: 080_v140_release_notification
-- Description: Create system notification for v1.4.0 release
-- Created: 2025-12-19

-- Insert admin notification for v1.4.0 release
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
  '⚡ Claude Insider v1.4.0 Released!',
  'Performance boost! LCP improved by 16% (2.1s), Lighthouse score now 86%. New lazy provider architecture for faster page loads. Check out the changelog for details!',
  '/changelog',
  TRUE,  -- send in-app notification
  TRUE,  -- send push notification
  FALSE, -- don't send email for minor releases
  'all', -- target all users
  'scheduled',
  NOW()  -- send immediately
);
