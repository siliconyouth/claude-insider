import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_resources" ADD COLUMN "content_hash" varchar;
  ALTER TABLE "_payload_resources_v" ADD COLUMN "version_content_hash" varchar;
  CREATE INDEX "payload_resources_content_hash_idx" ON "payload_resources" USING btree ("content_hash");
  CREATE INDEX "_payload_resources_v_version_version_content_hash_idx" ON "_payload_resources_v" USING btree ("version_content_hash");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "payload_resources_content_hash_idx";
  DROP INDEX "_payload_resources_v_version_version_content_hash_idx";
  ALTER TABLE "payload_resources" DROP COLUMN "content_hash";
  ALTER TABLE "_payload_resources_v" DROP COLUMN "version_content_hash";`)
}
