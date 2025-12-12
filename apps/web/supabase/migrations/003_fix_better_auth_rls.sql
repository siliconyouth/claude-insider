-- =============================================================================
-- Fix Better Auth RLS Policies
-- Version: 003
-- Created: 2025-12-12
-- Description: Disables RLS on Better Auth core tables since they are accessed
--              directly via PostgreSQL pool (server-side only), not PostgREST.
-- =============================================================================

-- Better Auth tables are managed server-side only through the pg Pool connection.
-- RLS policies that rely on request.jwt.claims don't work with direct connections.
-- Since these tables are never exposed to client-side queries, we disable RLS.

-- Drop existing policies first
DROP POLICY IF EXISTS "Users can view own profile" ON public."user";
DROP POLICY IF EXISTS "Users can update own profile" ON public."user";
DROP POLICY IF EXISTS "Users can view own sessions" ON public.session;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.session;
DROP POLICY IF EXISTS "Users can view own accounts" ON public.account;
DROP POLICY IF EXISTS "Users can delete own accounts" ON public.account;

-- Disable RLS on Better Auth core tables
-- These are only accessed by the server via authenticated PostgreSQL connection
ALTER TABLE public."user" DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.session DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.account DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification DISABLE ROW LEVEL SECURITY;

-- Note: User data tables (profiles, favorites, ratings, etc.) in 001_user_data.sql
-- still use RLS because they ARE accessed via Supabase client with JWT auth.
