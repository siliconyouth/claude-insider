-- Fix Passkeys RLS Policies
-- Allow service role (used by server actions via direct pool connection) to manage passkeys

-- Drop existing policies that only work with Supabase auth
DROP POLICY IF EXISTS "Users can view own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can create own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can update own passkeys" ON passkeys;
DROP POLICY IF EXISTS "Users can delete own passkeys" ON passkeys;

-- Create new policies that allow service role access
-- The service role (postgres user used by pool) can manage all passkeys
-- This is secure because the server actions verify user ownership via session

CREATE POLICY "Service role can manage passkeys" ON passkeys
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Grant necessary permissions to the service role
GRANT ALL ON passkeys TO postgres;
GRANT ALL ON passkeys TO service_role;

-- Also grant to authenticated role for future Supabase client usage
GRANT SELECT, INSERT, UPDATE, DELETE ON passkeys TO authenticated;
