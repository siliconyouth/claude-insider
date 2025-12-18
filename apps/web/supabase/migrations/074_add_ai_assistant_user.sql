-- Migration 074: Add AI Assistant User
--
-- This migration creates the @claudeinsider AI assistant user that was
-- missing from 000_fresh_start.sql. This user is required for the AI
-- to respond to @claudeinsider mentions in DM conversations.
--
-- The INSERT uses ON CONFLICT to be idempotent - safe to run multiple times.

-- Create the @claudeinsider AI assistant user for DM responses
INSERT INTO public."user" (id, name, email, role, "emailVerified", "createdAt", "updatedAt")
VALUES (
  'ai-assistant-claudeinsider',
  'Claude Insider',
  'assistant@claudeinsider.com',
  'ai_assistant',
  TRUE,
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  role = 'ai_assistant',
  name = 'Claude Insider';

-- Create profile for AI assistant (profiles table has user_id UNIQUE constraint)
INSERT INTO public.profiles (id, user_id, display_name, bio, avatar_url, is_verified)
VALUES (
  gen_random_uuid(),
  'ai-assistant-claudeinsider',
  'Claude Insider',
  'I''m the AI assistant for Claude Insider. Mention @claudeinsider in any chat and I''ll help you find documentation, resources, and answers!',
  '/images/claude-insider-avatar.png',
  TRUE
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = 'Claude Insider',
  bio = 'I''m the AI assistant for Claude Insider. Mention @claudeinsider in any chat and I''ll help you find documentation, resources, and answers!',
  is_verified = TRUE;

-- Set AI assistant presence as always "online"
INSERT INTO public.user_presence (user_id, status, last_seen_at, last_active_at, updated_at)
VALUES (
  'ai-assistant-claudeinsider',
  'online',
  NOW(),
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO UPDATE SET status = 'online';

-- Add comment for documentation
COMMENT ON COLUMN public."user".role IS 'User role hierarchy: user < editor < moderator < admin < superadmin. ai_assistant is special non-hierarchical role for the @claudeinsider bot.';
