-- Migration: Add beta_tester role to allowed user roles
-- Date: 2025-12-15
-- Purpose: Add beta_tester role for early access users

-- Update the check constraint to allow beta_tester role
ALTER TABLE public."user" DROP CONSTRAINT IF EXISTS user_role_check;

ALTER TABLE public."user"
ADD CONSTRAINT user_role_check
CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'superadmin', 'ai_assistant', 'beta_tester'));

-- Add role metadata comment
COMMENT ON CONSTRAINT user_role_check ON public."user" IS 'Allowed user roles: user (default), editor, moderator, admin, superadmin, ai_assistant, beta_tester';
