import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add Reference Collections
 *
 * This migration:
 * 1. Creates the subcategories table (linked to categories)
 * 2. Creates the difficulty_levels table (with colors, icons)
 * 3. Creates the programming_languages table (with colors, aliases)
 * 4. Modifies the resources table to use foreign keys instead of text/enum
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Create enum for difficulty levels color
    CREATE TYPE "public"."enum_difficulty_levels_color" AS ENUM('green', 'blue', 'yellow', 'orange', 'red', 'purple', 'gray');

    -- Create subcategories table (linked to categories)
    CREATE TABLE IF NOT EXISTS "subcategories" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL,
      "category_id" integer NOT NULL REFERENCES "categories"("id") ON DELETE CASCADE,
      "description" varchar,
      "icon" varchar,
      "resource_count" numeric DEFAULT 0,
      "sort_order" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Create difficulty_levels table
    CREATE TABLE IF NOT EXISTS "difficulty_levels" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL UNIQUE,
      "description" varchar,
      "color" "enum_difficulty_levels_color" DEFAULT 'gray' NOT NULL,
      "icon" varchar,
      "sort_order" numeric DEFAULT 0 NOT NULL,
      "resource_count" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Create programming_languages table
    CREATE TABLE IF NOT EXISTS "programming_languages" (
      "id" serial PRIMARY KEY NOT NULL,
      "name" varchar NOT NULL,
      "slug" varchar NOT NULL UNIQUE,
      "color" varchar DEFAULT 'gray-500' NOT NULL,
      "icon" varchar,
      "website" varchar,
      "resource_count" numeric DEFAULT 0,
      "updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
      "created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
    );

    -- Create programming_languages_aliases array table
    CREATE TABLE IF NOT EXISTS "programming_languages_aliases" (
      "id" serial PRIMARY KEY NOT NULL,
      "_order" integer NOT NULL,
      "_parent_id" integer NOT NULL REFERENCES "programming_languages"("id") ON DELETE CASCADE,
      "alias" varchar
    );

    -- Add indexes to subcategories
    CREATE INDEX IF NOT EXISTS "subcategories_category_idx" ON "subcategories" USING btree ("category_id");
    CREATE INDEX IF NOT EXISTS "subcategories_slug_idx" ON "subcategories" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "subcategories_updated_at_idx" ON "subcategories" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "subcategories_created_at_idx" ON "subcategories" USING btree ("created_at");

    -- Add indexes to difficulty_levels
    CREATE INDEX IF NOT EXISTS "difficulty_levels_slug_idx" ON "difficulty_levels" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "difficulty_levels_updated_at_idx" ON "difficulty_levels" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "difficulty_levels_created_at_idx" ON "difficulty_levels" USING btree ("created_at");

    -- Add indexes to programming_languages
    CREATE INDEX IF NOT EXISTS "programming_languages_slug_idx" ON "programming_languages" USING btree ("slug");
    CREATE INDEX IF NOT EXISTS "programming_languages_updated_at_idx" ON "programming_languages" USING btree ("updated_at");
    CREATE INDEX IF NOT EXISTS "programming_languages_created_at_idx" ON "programming_languages" USING btree ("created_at");

    -- Add index to programming_languages_aliases
    CREATE INDEX IF NOT EXISTS "programming_languages_aliases_parent_idx" ON "programming_languages_aliases" USING btree ("_parent_id");

    -- Modify resources table: add new FK columns
    ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "subcategory_id" integer REFERENCES "subcategories"("id") ON DELETE SET NULL;
    ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "difficulty_id" integer REFERENCES "difficulty_levels"("id") ON DELETE SET NULL;
    ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "github_language_id" integer REFERENCES "programming_languages"("id") ON DELETE SET NULL;

    -- Add indexes for new FK columns
    CREATE INDEX IF NOT EXISTS "resources_subcategory_idx" ON "resources" USING btree ("subcategory_id");
    CREATE INDEX IF NOT EXISTS "resources_difficulty_idx" ON "resources" USING btree ("difficulty_id");
    CREATE INDEX IF NOT EXISTS "resources_github_language_idx" ON "resources" USING btree ("github_language_id");

    -- Drop old columns that are being replaced (keep data migration would be needed for production)
    ALTER TABLE "resources" DROP COLUMN IF EXISTS "subcategory";
    ALTER TABLE "resources" DROP COLUMN IF EXISTS "difficulty";
    ALTER TABLE "resources" DROP COLUMN IF EXISTS "github_language";

    -- Drop old enum type (no longer needed)
    DROP TYPE IF EXISTS "public"."enum_resources_difficulty";
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Recreate old enum type
    CREATE TYPE "public"."enum_resources_difficulty" AS ENUM('beginner', 'intermediate', 'advanced', 'expert');

    -- Add back old columns to resources
    ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "subcategory" varchar;
    ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "difficulty" "enum_resources_difficulty";
    ALTER TABLE "resources" ADD COLUMN IF NOT EXISTS "github_language" varchar;

    -- Drop new FK columns
    ALTER TABLE "resources" DROP COLUMN IF EXISTS "subcategory_id";
    ALTER TABLE "resources" DROP COLUMN IF EXISTS "difficulty_id";
    ALTER TABLE "resources" DROP COLUMN IF EXISTS "github_language_id";

    -- Drop indexes
    DROP INDEX IF EXISTS "resources_subcategory_idx";
    DROP INDEX IF EXISTS "resources_difficulty_idx";
    DROP INDEX IF EXISTS "resources_github_language_idx";

    -- Drop new tables
    DROP TABLE IF EXISTS "programming_languages_aliases" CASCADE;
    DROP TABLE IF EXISTS "programming_languages" CASCADE;
    DROP TABLE IF EXISTS "difficulty_levels" CASCADE;
    DROP TABLE IF EXISTS "subcategories" CASCADE;

    -- Drop enum
    DROP TYPE IF EXISTS "public"."enum_difficulty_levels_color";
  `)
}
