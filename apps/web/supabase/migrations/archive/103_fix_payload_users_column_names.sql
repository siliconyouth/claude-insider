-- Migration: 103_fix_payload_users_column_names.sql
-- Description: Fix column names to match Payload CMS expectations (camelCase)
-- Payload uses camelCase for all column names with PostgreSQL adapter

-- Rename snake_case columns to camelCase
DO $$
BEGIN
  -- is_active -> isActive
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'is_active') THEN
    ALTER TABLE public.payload_users RENAME COLUMN is_active TO "isActive";
  END IF;

  -- permissions columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_can_approve_comments') THEN
    ALTER TABLE public.payload_users RENAME COLUMN permissions_can_approve_comments TO "permissions_canApproveComments";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_can_approve_edits') THEN
    ALTER TABLE public.payload_users RENAME COLUMN permissions_can_approve_edits TO "permissions_canApproveEdits";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_can_manage_resources') THEN
    ALTER TABLE public.payload_users RENAME COLUMN permissions_can_manage_resources TO "permissions_canManageResources";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_can_view_analytics') THEN
    ALTER TABLE public.payload_users RENAME COLUMN permissions_can_view_analytics TO "permissions_canViewAnalytics";
  END IF;

  -- Activity tracking
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'last_login_at') THEN
    ALTER TABLE public.payload_users RENAME COLUMN last_login_at TO "lastLoginAt";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'login_count') THEN
    ALTER TABLE public.payload_users RENAME COLUMN login_count TO "loginCount";
  END IF;

  -- Auth fields
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'reset_password_token') THEN
    ALTER TABLE public.payload_users RENAME COLUMN reset_password_token TO "resetPasswordToken";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'reset_password_expiration') THEN
    ALTER TABLE public.payload_users RENAME COLUMN reset_password_expiration TO "resetPasswordExpiration";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'login_attempts') THEN
    ALTER TABLE public.payload_users RENAME COLUMN login_attempts TO "loginAttempts";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'lock_until') THEN
    ALTER TABLE public.payload_users RENAME COLUMN lock_until TO "lockUntil";
  END IF;

  -- Timestamps
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'created_at') THEN
    ALTER TABLE public.payload_users RENAME COLUMN created_at TO "createdAt";
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'updated_at') THEN
    ALTER TABLE public.payload_users RENAME COLUMN updated_at TO "updatedAt";
  END IF;
END $$;

-- Recreate indexes with new column names
DROP INDEX IF EXISTS idx_payload_users_email;
DROP INDEX IF EXISTS idx_payload_users_role;
CREATE INDEX IF NOT EXISTS idx_payload_users_email ON public.payload_users(email);
CREATE INDEX IF NOT EXISTS idx_payload_users_role ON public.payload_users(role);
