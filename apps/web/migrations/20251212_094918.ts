import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_announcement_type" AS ENUM('info', 'success', 'warning', 'feature');
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"general_site_name" varchar DEFAULT 'Claude Insider' NOT NULL,
  	"general_tagline" varchar DEFAULT 'Your Guide to Mastering Claude AI' NOT NULL,
  	"general_description" varchar DEFAULT 'Comprehensive documentation, tips, tricks, and resources for Claude AI by Anthropic.' NOT NULL,
  	"general_version" varchar DEFAULT '0.26.0',
  	"social_github" varchar DEFAULT 'https://github.com/siliconyouth/claude-insider',
  	"social_twitter" varchar,
  	"social_discord" varchar,
  	"social_linkedin" varchar,
  	"footer_copyright_text" varchar DEFAULT '© 2025 Vladimir Dukelic. All rights reserved.',
  	"footer_show_version" boolean DEFAULT true,
  	"footer_show_build_info" boolean DEFAULT true,
  	"seo_og_image" varchar DEFAULT '/og-image.png',
  	"seo_twitter_handle" varchar,
  	"seo_google_analytics_id" varchar,
  	"features_maintenance_mode" boolean DEFAULT false,
  	"features_maintenance_message" varchar DEFAULT 'We are currently performing scheduled maintenance. Please check back soon.',
  	"features_enable_voice_assistant" boolean DEFAULT true,
  	"features_enable_search" boolean DEFAULT true,
  	"features_enable_analytics" boolean DEFAULT true,
  	"contact_email" varchar DEFAULT 'vladimir@dukelic.com',
  	"contact_support_url" varchar DEFAULT 'https://github.com/siliconyouth/claude-insider/issues',
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_message" varchar,
  	"announcement_link" varchar,
  	"announcement_type" "enum_site_settings_announcement_type" DEFAULT 'info',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  `)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings" CASCADE;
  DROP TYPE "public"."enum_site_settings_announcement_type";`)
}
