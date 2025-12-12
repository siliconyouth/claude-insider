import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/**
 * Migration: Add FK columns to payload_locked_documents_rels
 *
 * This migration adds the missing foreign key columns for the new collections
 * to the payload_locked_documents_rels table used by Payload CMS for document locking.
 */
export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    -- Add FK columns for new collections to payload_locked_documents_rels
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "subcategories_id" integer REFERENCES "subcategories"("id") ON DELETE CASCADE;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "difficulty_levels_id" integer REFERENCES "difficulty_levels"("id") ON DELETE CASCADE;
    ALTER TABLE "payload_locked_documents_rels" ADD COLUMN IF NOT EXISTS "programming_languages_id" integer REFERENCES "programming_languages"("id") ON DELETE CASCADE;
    
    -- Add indexes for the new FK columns
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_subcategories_id_idx" ON "payload_locked_documents_rels" USING btree ("subcategories_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_difficulty_levels_id_idx" ON "payload_locked_documents_rels" USING btree ("difficulty_levels_id");
    CREATE INDEX IF NOT EXISTS "payload_locked_documents_rels_programming_languages_id_idx" ON "payload_locked_documents_rels" USING btree ("programming_languages_id");
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    -- Drop indexes
    DROP INDEX IF EXISTS "payload_locked_documents_rels_subcategories_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_difficulty_levels_id_idx";
    DROP INDEX IF EXISTS "payload_locked_documents_rels_programming_languages_id_idx";
    
    -- Drop columns
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "subcategories_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "difficulty_levels_id";
    ALTER TABLE "payload_locked_documents_rels" DROP COLUMN IF EXISTS "programming_languages_id";
  `)
}
