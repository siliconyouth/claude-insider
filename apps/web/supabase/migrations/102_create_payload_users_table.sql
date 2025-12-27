-- Migration: 102_create_payload_users_table.sql
-- Description: Create payload_users table for Payload CMS admin authentication
-- This is separate from the Better Auth "user" table used for site visitors

CREATE TABLE IF NOT EXISTS public.payload_users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT,
  role TEXT NOT NULL DEFAULT 'editor' CHECK (role IN ('superadmin', 'admin', 'editor', 'moderator')),
  is_active BOOLEAN DEFAULT true,

  -- Permissions group (flattened for PostgreSQL)
  permissions_can_approve_comments BOOLEAN DEFAULT false,
  permissions_can_approve_edits BOOLEAN DEFAULT false,
  permissions_can_manage_resources BOOLEAN DEFAULT false,
  permissions_can_view_analytics BOOLEAN DEFAULT false,

  -- Activity tracking
  last_login_at TIMESTAMPTZ,
  login_count INTEGER DEFAULT 0,

  -- Payload auth fields
  email TEXT NOT NULL UNIQUE,
  reset_password_token TEXT,
  reset_password_expiration TIMESTAMPTZ,
  salt TEXT,
  hash TEXT,
  login_attempts INTEGER DEFAULT 0,
  lock_until TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_payload_users_email ON public.payload_users(email);
CREATE INDEX IF NOT EXISTS idx_payload_users_role ON public.payload_users(role);

-- Add comment
COMMENT ON TABLE public.payload_users IS 'Payload CMS admin users - separate from Better Auth site users';
