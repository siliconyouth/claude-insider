-- Fix WebAuthn Challenges RLS Policies
-- Allow service role (used by server actions via direct pool connection) to manage challenges
-- This mirrors the fix applied to passkeys table in migration 037

-- Drop existing policy that may not work correctly with pool connection
DROP POLICY IF EXISTS "Service can manage challenges" ON webauthn_challenges;

-- Create new policy that allows full access (security enforced by server action logic)
CREATE POLICY "Service role can manage challenges" ON webauthn_challenges
  FOR ALL USING (TRUE) WITH CHECK (TRUE);

-- Grant necessary permissions to the postgres role (used by pool)
GRANT ALL ON webauthn_challenges TO postgres;
GRANT ALL ON webauthn_challenges TO service_role;

-- Also grant to authenticated role for future direct access
GRANT SELECT, INSERT, UPDATE, DELETE ON webauthn_challenges TO authenticated;
