-- ============================================
-- Migration: 048_superadmin_role.sql
-- Description: Add Super Admin role with elevated privileges
-- Version: 0.67.0
-- Note: Defensive migration - handles missing tables/columns gracefully
-- ============================================

-- ===========================================
-- 1. UPDATE ROLE CHECK CONSTRAINT
-- ===========================================

-- Drop old constraint if exists
ALTER TABLE public."user" DROP CONSTRAINT IF EXISTS user_role_check;

-- Add new constraint with ALL possible roles including ai_assistant
-- The constraint must include all existing role values in the database
ALTER TABLE public."user"
ADD CONSTRAINT user_role_check
CHECK (role IN ('user', 'editor', 'moderator', 'admin', 'superadmin', 'ai_assistant'));

-- ===========================================
-- 2. UPDATE ROLE HIERARCHY FUNCTION
-- ===========================================

-- Drop and recreate the user_has_role function with superadmin
-- Note: ai_assistant is a special non-hierarchical role (level 0)
CREATE OR REPLACE FUNCTION public.user_has_role(
  user_id TEXT,
  required_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  role_hierarchy TEXT[] := ARRAY['ai_assistant', 'user', 'editor', 'moderator', 'admin', 'superadmin'];
  user_level INTEGER;
  required_level INTEGER;
BEGIN
  -- Get user's role
  SELECT role INTO user_role
  FROM public."user"
  WHERE id = user_id;

  IF user_role IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Find position in hierarchy
  user_level := array_position(role_hierarchy, user_role);
  required_level := array_position(role_hierarchy, required_role);

  IF user_level IS NULL OR required_level IS NULL THEN
    RETURN FALSE;
  END IF;

  -- User has required role if their level is >= required level
  RETURN user_level >= required_level;
END;
$$;

-- ===========================================
-- 3. ADD SUPERADMIN-SPECIFIC RLS POLICIES
-- ===========================================

-- Allow superadmins to view all private user data
CREATE POLICY "superadmin_view_all_users"
ON public."user"
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role = 'superadmin'
  )
);

-- Allow superadmins to delete any user
CREATE POLICY "superadmin_delete_users"
ON public."user"
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role = 'superadmin'
  )
);

-- Update admin_logs policies to include superadmin (conditional - table may not exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_logs') THEN
    -- Drop old policies
    DROP POLICY IF EXISTS "admin_logs_select_admin" ON public.admin_logs;
    DROP POLICY IF EXISTS "admin_logs_insert_moderator" ON public.admin_logs;

    -- Create new policies including superadmin
    CREATE POLICY "admin_logs_select_admin"
    ON public.admin_logs
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public."user"
        WHERE id = (SELECT current_setting('app.user_id', TRUE))
        AND role IN ('admin', 'moderator', 'superadmin')
      )
    );

    CREATE POLICY "admin_logs_insert_moderator"
    ON public.admin_logs
    FOR INSERT
    WITH CHECK (
      EXISTS (
        SELECT 1 FROM public."user"
        WHERE id = (SELECT current_setting('app.user_id', TRUE))
        AND role IN ('admin', 'moderator', 'superadmin')
      )
    );
  END IF;
END $$;

-- ===========================================
-- 4. CREATE SUPERADMIN ACTIVITY LOG
-- ===========================================

-- Create table to track superadmin actions (higher security)
CREATE TABLE IF NOT EXISTS public.superadmin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  superadmin_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comments
COMMENT ON TABLE public.superadmin_logs IS 'Audit log for superadmin actions - higher security tracking';
COMMENT ON COLUMN public.superadmin_logs.action IS 'Action type: view_private_data, delete_user, change_superadmin, etc.';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_superadmin ON public.superadmin_logs(superadmin_id);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_created ON public.superadmin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_superadmin_logs_action ON public.superadmin_logs(action);

-- Enable RLS
ALTER TABLE public.superadmin_logs ENABLE ROW LEVEL SECURITY;

-- Only superadmins can view superadmin logs
CREATE POLICY "superadmin_logs_select"
ON public.superadmin_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role = 'superadmin'
  )
);

-- Only superadmins can insert logs
CREATE POLICY "superadmin_logs_insert"
ON public.superadmin_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role = 'superadmin'
  )
);

-- Grant permissions
GRANT SELECT, INSERT ON public.superadmin_logs TO authenticated;

-- ===========================================
-- 5. FUNCTION TO LOG SUPERADMIN ACTION
-- ===========================================

CREATE OR REPLACE FUNCTION public.log_superadmin_action(
  p_superadmin_id TEXT,
  p_action TEXT,
  p_target_type TEXT,
  p_target_id TEXT,
  p_details JSONB DEFAULT '{}'::jsonb,
  p_ip_address TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id UUID;
  user_role TEXT;
BEGIN
  -- Verify caller is a superadmin
  SELECT role INTO user_role
  FROM public."user"
  WHERE id = p_superadmin_id;

  IF user_role != 'superadmin' THEN
    RAISE EXCEPTION 'Only superadmins can log superadmin actions';
  END IF;

  INSERT INTO public.superadmin_logs (
    superadmin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    p_superadmin_id,
    p_action,
    p_target_type,
    p_target_id,
    p_details,
    p_ip_address,
    p_user_agent
  )
  RETURNING id INTO log_id;

  RETURN log_id;
END;
$$;

-- ===========================================
-- 6. SET VLADIMIR AS SUPERADMIN
-- ===========================================

-- Update Vladimir Dukelic to superadmin role
UPDATE public."user"
SET role = 'superadmin'
WHERE email = 'vladimir@dukelic.com';

-- Also update in profiles table if it exists and has role column
DO $$
BEGIN
  IF EXISTS (
    SELECT FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'role'
  ) THEN
    UPDATE public.profiles
    SET role = 'superadmin'
    WHERE user_id IN (
      SELECT id FROM public."user" WHERE email = 'vladimir@dukelic.com'
    );
  END IF;
END $$;

-- Log this action (conditional - admin_logs table may not exist)
DO $$
DECLARE
  vladimir_id TEXT;
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'admin_logs') THEN
    SELECT id INTO vladimir_id FROM public."user" WHERE email = 'vladimir@dukelic.com';

    IF vladimir_id IS NOT NULL THEN
      INSERT INTO public.admin_logs (admin_id, action, target_type, target_id, details)
      VALUES (
        vladimir_id,
        'role_change_to_superadmin',
        'user',
        vladimir_id,
        '{"previous_role": "admin", "new_role": "superadmin", "reason": "Initial superadmin setup"}'::jsonb
      );
    END IF;
  END IF;
END $$;

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
