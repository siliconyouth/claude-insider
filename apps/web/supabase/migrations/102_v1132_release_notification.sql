-- Migration: v1.13.2 Payload CMS Fix Notification
-- Description: Notifies all users about the v1.13.2 Payload CMS route fix release

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
  'v1.13.2: Payload CMS & API Fixes',
  'Claude Insider v1.13.2 is here! This release fixes Payload CMS admin authentication and restructures API routes for better reliability.',
  jsonb_build_object(
    'version', '1.13.2',
    'category', 'fix',
    'actionUrl', '/changelog',
    'actionLabel', 'View Changelog',
    'highlights', jsonb_build_array(
      'Payload CMS admin authentication now works correctly',
      'API routes restructured: /api/users/* → /api/profiles/*',
      'Fixed column naming mismatches in database',
      'Added footer translations to all 17 non-English locales',
      'RAG index updated to 6,983 chunks'
    )
  ),
  NOW()
FROM "user" u
WHERE u.role != 'ai_assistant'
ON CONFLICT DO NOTHING;
