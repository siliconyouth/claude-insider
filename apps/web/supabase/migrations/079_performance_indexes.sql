-- Migration: 079_performance_indexes.sql
-- Purpose: Add additional performance indexes for query optimization
-- Date: 2025-12-19
-- Impact: Minor query performance improvements (~5%)

-- ============================================
-- USER ACHIEVEMENTS INDEXES
-- ============================================

-- Index for activity feed ordering (ORDER BY unlocked_at DESC)
-- Used in: app/api/dashboard/activity/route.ts
CREATE INDEX IF NOT EXISTS idx_user_achievements_unlocked_at
ON public.user_achievements(unlocked_at DESC);

-- Composite index for user's recent achievements
-- Optimizes: SELECT ... WHERE user_id = $1 ORDER BY unlocked_at DESC LIMIT N
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_unlocked
ON public.user_achievements(user_id, unlocked_at DESC);

-- ============================================
-- SECURITY LOGS INDEXES (defensive - may not exist in dev)
-- ============================================

DO $$
BEGIN
  -- Composite index for filtered time-range queries
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'security_logs') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_security_logs_type_time
             ON public.security_logs(event_type, created_at DESC)';
    RAISE NOTICE 'Created: idx_security_logs_type_time';

    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_security_logs_critical_recent
             ON public.security_logs(created_at DESC)
             WHERE severity IN (''critical'', ''error'')';
    RAISE NOTICE 'Created: idx_security_logs_critical_recent';
  ELSE
    RAISE NOTICE 'Skipped security_logs indexes (table does not exist)';
  END IF;
END $$;

-- ============================================
-- AI CONVERSATIONS INDEXES (defensive - may not exist in dev)
-- ============================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'ai_conversations') THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_model
             ON public.ai_conversations(user_id, model, updated_at DESC)';
    RAISE NOTICE 'Created: idx_ai_conversations_user_model';
  ELSE
    RAISE NOTICE 'Skipped ai_conversations indexes (table does not exist)';
  END IF;
END $$;

-- ============================================
-- VERIFICATION
-- ============================================

DO $$
DECLARE
  idx RECORD;
  count INTEGER := 0;
BEGIN
  RAISE NOTICE '--- Performance Indexes Migration Complete ---';
  FOR idx IN
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    AND indexname IN (
      'idx_user_achievements_unlocked_at',
      'idx_user_achievements_user_unlocked',
      'idx_security_logs_type_time',
      'idx_security_logs_critical_recent',
      'idx_ai_conversations_user_model'
    )
  LOOP
    RAISE NOTICE 'Index exists: %', idx.indexname;
    count := count + 1;
  END LOOP;
  RAISE NOTICE 'Total indexes: %', count;
END $$;
