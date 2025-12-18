-- Migration: Add "welcome_aboard" achievement
-- This achievement is awarded when users complete onboarding

-- Insert the welcome_aboard achievement if it doesn't exist
INSERT INTO achievements (slug, name, description, icon, category, points, tier, requirement_type, requirement_value, is_hidden)
VALUES (
  'welcome_aboard',
  'Welcome Aboard',
  'Complete the onboarding process and join the community',
  'rocket',
  'milestone',
  50,
  'bronze',
  'special',
  1,
  FALSE
)
ON CONFLICT (slug) DO NOTHING;
