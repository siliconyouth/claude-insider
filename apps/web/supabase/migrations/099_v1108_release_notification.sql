-- Migration: 099_v1108_release_notification
-- Description: Create system notification for v1.10.8 release (Mobile Header Optimization)
-- Created: 2025-12-23

-- Insert admin notification for v1.10.8 release
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
  '📱 Claude Insider v1.10.8 - Mobile Header Optimization!',
  'Cleaner mobile experience: Header now fits in one row with just 4 icons. API link moved to footer. Updated iPhone mockup showcases the new mobile layout. CLAUDE.md now includes mandatory header/footer navigation guidelines for consistent menu structure.',
  '/changelog',
  TRUE,  -- send in-app notification
  TRUE,  -- send push notification
  FALSE, -- skip email for minor patch release
  'all', -- target all users
  'scheduled',
  NOW()  -- send immediately
);
