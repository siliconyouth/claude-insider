-- Migration: 104_revert_payload_users_to_snake_case.sql
-- Description: Revert column names back to snake_case (Payload's default for PostgreSQL)

DO $$
BEGIN
  -- isActive -> is_active
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'isActive') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "isActive" TO is_active;
  END IF;

  -- permissions columns
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_canApproveComments') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "permissions_canApproveComments" TO permissions_can_approve_comments;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_canApproveEdits') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "permissions_canApproveEdits" TO permissions_can_approve_edits;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_canManageResources') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "permissions_canManageResources" TO permissions_can_manage_resources;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'permissions_canViewAnalytics') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "permissions_canViewAnalytics" TO permissions_can_view_analytics;
  END IF;

  -- Activity tracking
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'lastLoginAt') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "lastLoginAt" TO last_login_at;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'loginCount') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "loginCount" TO login_count;
  END IF;

  -- Auth fields
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'resetPasswordToken') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "resetPasswordToken" TO reset_password_token;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'resetPasswordExpiration') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "resetPasswordExpiration" TO reset_password_expiration;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'loginAttempts') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "loginAttempts" TO login_attempts;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'lockUntil') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "lockUntil" TO lock_until;
  END IF;

  -- Timestamps
  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'createdAt') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "createdAt" TO created_at;
  END IF;

  IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payload_users' AND column_name = 'updatedAt') THEN
    ALTER TABLE public.payload_users RENAME COLUMN "updatedAt" TO updated_at;
  END IF;
END $$;
