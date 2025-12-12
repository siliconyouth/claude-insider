-- =============================================================================
-- Better Auth Core Schema Migration
-- Version: 002
-- Created: 2025-12-12
-- Description: Creates tables required by Better Auth for public user authentication
-- @see https://www.better-auth.com/docs/concepts/database#core-schema
-- =============================================================================

-- =============================================================================
-- USER TABLE
-- Stores public user accounts (separate from Payload CMS admin users)
-- =============================================================================

CREATE TABLE IF NOT EXISTS public."user" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  "emailVerified" BOOLEAN NOT NULL DEFAULT FALSE,
  image TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Additional fields from auth config
  "displayName" TEXT,
  bio TEXT,
  "avatarUrl" TEXT,
  "isBetaTester" BOOLEAN DEFAULT FALSE,
  "isVerified" BOOLEAN DEFAULT FALSE
);

-- Enable RLS
ALTER TABLE public."user" ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own profile"
  ON public."user" FOR SELECT
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can update own profile"
  ON public."user" FOR UPDATE
  USING (id = current_setting('request.jwt.claims', true)::json->>'sub');

-- Index
CREATE INDEX idx_user_email ON public."user"(email);

-- =============================================================================
-- SESSION TABLE
-- Stores active user sessions
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.session (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "ipAddress" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.session ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own sessions"
  ON public.session FOR SELECT
  USING ("userId" = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own sessions"
  ON public.session FOR DELETE
  USING ("userId" = current_setting('request.jwt.claims', true)::json->>'sub');

-- Indexes
CREATE INDEX idx_session_user_id ON public.session("userId");
CREATE INDEX idx_session_token ON public.session(token);
CREATE INDEX idx_session_expires ON public.session("expiresAt");

-- =============================================================================
-- ACCOUNT TABLE
-- Stores OAuth provider accounts linked to users
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.account (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  "accountId" TEXT NOT NULL,
  "providerId" TEXT NOT NULL,
  "accessToken" TEXT,
  "refreshToken" TEXT,
  "accessTokenExpiresAt" TIMESTAMPTZ,
  "refreshTokenExpiresAt" TIMESTAMPTZ,
  scope TEXT,
  "idToken" TEXT,
  password TEXT,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE("providerId", "accountId")
);

-- Enable RLS
ALTER TABLE public.account ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own accounts"
  ON public.account FOR SELECT
  USING ("userId" = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can delete own accounts"
  ON public.account FOR DELETE
  USING ("userId" = current_setting('request.jwt.claims', true)::json->>'sub');

-- Indexes
CREATE INDEX idx_account_user_id ON public.account("userId");
CREATE INDEX idx_account_provider ON public.account("providerId", "accountId");

-- =============================================================================
-- VERIFICATION TABLE
-- Stores email verification and password reset tokens
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.verification (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  "expiresAt" TIMESTAMPTZ NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS (no user-specific policies - managed by Better Auth)
ALTER TABLE public.verification ENABLE ROW LEVEL SECURITY;

-- Indexes
CREATE INDEX idx_verification_identifier ON public.verification(identifier);
CREATE INDEX idx_verification_expires ON public.verification("expiresAt");

-- =============================================================================
-- UPDATED_AT TRIGGERS
-- =============================================================================

-- Apply updated_at trigger to Better Auth tables
CREATE TRIGGER set_user_updated_at
  BEFORE UPDATE ON public."user"
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_session_updated_at
  BEFORE UPDATE ON public.session
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_account_updated_at
  BEFORE UPDATE ON public.account
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER set_verification_updated_at
  BEFORE UPDATE ON public.verification
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- CLEANUP FUNCTION
-- Remove expired sessions and verifications
-- =============================================================================

CREATE OR REPLACE FUNCTION cleanup_expired_auth_data()
RETURNS void AS $$
BEGIN
  -- Remove expired sessions
  DELETE FROM public.session WHERE "expiresAt" < NOW();

  -- Remove expired verifications
  DELETE FROM public.verification WHERE "expiresAt" < NOW();
END;
$$ LANGUAGE plpgsql;
