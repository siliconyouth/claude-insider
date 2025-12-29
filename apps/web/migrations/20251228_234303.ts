import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'popular' BEFORE 'new';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'official';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'official-source';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'official-repository';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'official-community';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'official-courses';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'official-examples';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'active-community';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'built-with-claude';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'industry-standard';
  ALTER TYPE "public"."enum_payload_resources_featured_reason" ADD VALUE 'industry-example';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'popular' BEFORE 'new';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'official';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'official-source';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'official-repository';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'official-community';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'official-courses';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'official-examples';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'active-community';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'built-with-claude';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'industry-standard';
  ALTER TYPE "public"."enum__payload_resources_v_version_featured_reason" ADD VALUE 'industry-example';`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "payload_resources" ALTER COLUMN "featured_reason" SET DATA TYPE text;
  DROP TYPE "public"."enum_payload_resources_featured_reason";
  CREATE TYPE "public"."enum_payload_resources_featured_reason" AS ENUM('editors-pick', 'most-popular', 'new', 'trending', 'essential');
  ALTER TABLE "payload_resources" ALTER COLUMN "featured_reason" SET DATA TYPE "public"."enum_payload_resources_featured_reason" USING "featured_reason"::"public"."enum_payload_resources_featured_reason";
  ALTER TABLE "_payload_resources_v" ALTER COLUMN "version_featured_reason" SET DATA TYPE text;
  DROP TYPE "public"."enum__payload_resources_v_version_featured_reason";
  CREATE TYPE "public"."enum__payload_resources_v_version_featured_reason" AS ENUM('editors-pick', 'most-popular', 'new', 'trending', 'essential');
  ALTER TABLE "_payload_resources_v" ALTER COLUMN "version_featured_reason" SET DATA TYPE "public"."enum__payload_resources_v_version_featured_reason" USING "version_featured_reason"::"public"."enum__payload_resources_v_version_featured_reason";`)
}
