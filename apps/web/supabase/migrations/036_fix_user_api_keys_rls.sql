-- Migration: 036_fix_user_api_keys_rls.sql
-- Purpose: Fix RLS policies for user_api_keys tables to work with Better Auth
-- Author: Claude Supabase Migration Manager
-- Date: 2025-12-15
--
-- Issue: Migration 033 used auth.uid() which only works with Supabase Auth.
-- This project uses Better Auth, so policies need to be permissive (USING true)
-- with actual authorization handled at the application level.

-- ============================================
-- DROP EXISTING (BROKEN) POLICIES
-- ============================================

-- Drop user_api_keys policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can create own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can update own API keys" ON user_api_keys;
DROP POLICY IF EXISTS "Users can delete own API keys" ON user_api_keys;

-- Drop api_key_usage_logs policies that use auth.uid()
DROP POLICY IF EXISTS "Users can view own usage logs" ON api_key_usage_logs;

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_key_usage_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- CREATE NEW PERMISSIVE POLICIES
-- (Authorization handled by Better Auth at app level)
-- ============================================

-- user_api_keys policies
CREATE POLICY "Users can view API keys" ON user_api_keys
  FOR SELECT USING (true);

CREATE POLICY "Users can create API keys" ON user_api_keys
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update API keys" ON user_api_keys
  FOR UPDATE USING (true);

CREATE POLICY "Users can delete API keys" ON user_api_keys
  FOR DELETE USING (true);

-- api_key_usage_logs policies
CREATE POLICY "Users can view usage logs" ON api_key_usage_logs
  FOR SELECT USING (true);

CREATE POLICY "Users can create usage logs" ON api_key_usage_logs
  FOR INSERT WITH CHECK (true);
