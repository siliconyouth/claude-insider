-- Migration: v1.11.0 Footer Redesign Notification
-- Description: Notifies all users about the v1.11.0 footer redesign release

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
  'v1.11.0: Footer Redesign',
  'Claude Insider v1.11.0 is here! The footer has been completely redesigned with a flex + grid hybrid layout featuring 5 unified columns for perfect alignment across all screen sizes.',
  jsonb_build_object(
    'version', '1.11.0',
    'category', 'design',
    'actionUrl', '/changelog',
    'actionLabel', 'View Changelog',
    'highlights', jsonb_build_array(
      'Footer redesign with flex + grid hybrid layout',
      'AI Assistant button opens chat directly (Cmd + .)',
      'MonochromeLogo contrast variant for dark/light modes',
      '10 new MANDATORY footer design rules in CLAUDE.md',
      'Updated iPhone mockup with real mobile screenshot'
    )
  ),
  NOW()
FROM "user" u
WHERE u.role != 'ai_assistant'
ON CONFLICT DO NOTHING;
