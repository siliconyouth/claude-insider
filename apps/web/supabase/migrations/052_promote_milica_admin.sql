-- Migration: Promote Milica Ristic to admin with beta tester access
-- Date: 2025-12-16
-- Purpose: Set Milica Ristic as admin and beta tester (both are independent fields)

-- Find Milica Ristic by name and promote to admin with beta tester flag
UPDATE "user"
SET
  role = 'admin',
  "isBetaTester" = TRUE
WHERE
  name ILIKE '%Milica%Ristic%'
  OR name ILIKE '%Milica%Ristić%'
  OR email ILIKE '%milica%ristic%';

-- Log the promotion (if admin_logs table exists)
INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
SELECT
  (SELECT id FROM "user" WHERE role = 'superadmin' LIMIT 1),
  'change_role',
  'user',
  id,
  '{"previousRole": "user", "newRole": "admin", "betaTesterStatus": "added", "migrationType": "manual_promotion"}'
FROM "user"
WHERE
  name ILIKE '%Milica%Ristic%'
  OR name ILIKE '%Milica%Ristić%'
  OR email ILIKE '%milica%ristic%';
