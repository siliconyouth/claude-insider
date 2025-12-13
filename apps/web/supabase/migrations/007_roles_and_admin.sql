-- ============================================
-- Migration: 007_roles_and_admin.sql
-- Description: Add role system and admin audit logging
-- Version: 0.30.0
-- ============================================

-- ===========================================
-- 1. ADD ROLE COLUMN TO USER TABLE
-- ===========================================

-- Add role column with default 'user'
ALTER TABLE public."user"
ADD COLUMN IF NOT EXISTS "role" TEXT DEFAULT 'user';

-- Add check constraint for valid roles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_role_check'
  ) THEN
    ALTER TABLE public."user"
    ADD CONSTRAINT user_role_check
    CHECK (role IN ('user', 'editor', 'moderator', 'admin'));
  END IF;
END $$;

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_user_role ON public."user"(role);

-- ===========================================
-- 2. CREATE ADMIN LOGS TABLE
-- ===========================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id TEXT NOT NULL REFERENCES public."user"(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.admin_logs IS 'Audit log for admin actions (user management, beta reviews, etc.)';
COMMENT ON COLUMN public.admin_logs.action IS 'Action type: approve_beta, reject_beta, change_role, ban_user, etc.';
COMMENT ON COLUMN public.admin_logs.target_type IS 'Type of target: user, beta_application, feedback';
COMMENT ON COLUMN public.admin_logs.target_id IS 'ID of the target entity';
COMMENT ON COLUMN public.admin_logs.details IS 'Additional details about the action (previous/new values)';

-- ===========================================
-- 3. CREATE INDEXES FOR ADMIN LOGS
-- ===========================================

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON public.admin_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);

-- ===========================================
-- 4. ROW LEVEL SECURITY
-- ===========================================

-- Enable RLS on admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read all logs
CREATE POLICY "admin_logs_select_admin"
ON public.admin_logs
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role IN ('admin', 'moderator')
  )
);

-- Policy: Moderators and admins can create logs
CREATE POLICY "admin_logs_insert_moderator"
ON public.admin_logs
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public."user"
    WHERE id = (SELECT current_setting('app.user_id', TRUE))
    AND role IN ('admin', 'moderator')
  )
);

-- ===========================================
-- 5. GRANT PERMISSIONS
-- ===========================================

-- Grant permissions for authenticated users
GRANT SELECT, INSERT ON public.admin_logs TO authenticated;

-- ===========================================
-- 6. HELPER FUNCTIONS
-- ===========================================

-- Function to check if user has required role
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
  role_hierarchy TEXT[] := ARRAY['user', 'editor', 'moderator', 'admin'];
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

-- Function to log admin action
CREATE OR REPLACE FUNCTION public.log_admin_action(
  p_admin_id TEXT,
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
BEGIN
  INSERT INTO public.admin_logs (
    admin_id,
    action,
    target_type,
    target_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    p_admin_id,
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
-- 7. SET INITIAL ADMIN (Optional - run manually)
-- ===========================================

-- Uncomment and modify to set an initial admin user:
-- UPDATE public."user" SET role = 'admin' WHERE email = 'your-email@example.com';

-- ===========================================
-- MIGRATION COMPLETE
-- ===========================================
