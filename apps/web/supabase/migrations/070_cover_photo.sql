-- Migration: Add cover photo support to user profiles
-- Allows users to upload custom cover photos for their profile pages

-- Add cover photo columns to user table
-- Using camelCase per Better Auth convention
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "coverPhotoUrl" TEXT;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "coverPhotoPath" TEXT;

-- Add comment for documentation
COMMENT ON COLUMN "user"."coverPhotoUrl" IS 'Signed URL for user cover photo (1-year expiry)';
COMMENT ON COLUMN "user"."coverPhotoPath" IS 'Storage path for cover photo cleanup';
