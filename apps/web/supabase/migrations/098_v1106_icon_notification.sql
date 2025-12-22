-- Migration: v1.10.6 Brand Icon Redesign Notification
-- Description: Notifies users about the new "Ci" gradient icon

INSERT INTO notifications (
  user_id,
  type,
  title,
  message,
  data,
  created_at
)
SELECT
  u.id,
  'system_announcement',
  'v1.10.6: Brand Icon Redesign',
  'Claude Insider has a fresh new look! Check out our new "Ci" gradient icon across browser tabs, PWA installs, and home screens. The new violet→blue→cyan gradient represents our connection to the Claude ecosystem.',
  jsonb_build_object(
    'version', '1.10.6',
    'category', 'design',
    'actionUrl', '/changelog',
    'actionLabel', 'View Changelog',
    'highlights', jsonb_build_array(
      'New "Ci" gradient icon (violet→blue→cyan)',
      'Updated favicon, PWA icons, and Apple touch icons',
      'Maskable icons for Android adaptive icon support',
      'New icon generation pipeline using Playwright + sharp'
    )
  ),
  NOW()
FROM "user" u
WHERE u.role != 'ai_assistant'
ON CONFLICT DO NOTHING;
