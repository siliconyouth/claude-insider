import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."_locales" AS ENUM('en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'sr', 'ru', 'it', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'el');
  CREATE TYPE "public"."enum_users_role" AS ENUM('superadmin', 'admin', 'editor', 'moderator');
  CREATE TYPE "public"."enum_media_category" AS ENUM('avatar', 'resource', 'doc', 'general');
  CREATE TYPE "public"."enum_categories_color" AS ENUM('violet', 'blue', 'cyan', 'green', 'yellow', 'purple', 'pink', 'indigo', 'amber', 'rose');
  CREATE TYPE "public"."res_doc_rel_type" AS ENUM('required', 'recommended', 'related', 'example', 'alternative', 'extends', 'implements');
  CREATE TYPE "public"."res_res_rel_type" AS ENUM('alternative', 'complement', 'dependency', 'fork', 'successor', 'related');
  CREATE TYPE "public"."enum_payload_resources_publish_status" AS ENUM('published', 'hidden', 'pending_review', 'rejected', 'draft');
  CREATE TYPE "public"."enum_payload_resources_enhancement_status" AS ENUM('not_enhanced', 'pending', 'enhanced', 'needs_update', 'failed');
  CREATE TYPE "public"."enum_payload_resources_resource_type" AS ENUM('official', 'community', 'beta', 'deprecated', 'archived');
  CREATE TYPE "public"."enum_payload_resources_featured_reason" AS ENUM('editors-pick', 'most-popular', 'new', 'trending', 'essential');
  CREATE TYPE "public"."enum_payload_resources_discovery_discovered_by" AS ENUM('ai', 'manual', 'import', 'suggestion');
  CREATE TYPE "public"."enum_payload_resources_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__payload_resources_v_version_publish_status" AS ENUM('published', 'hidden', 'pending_review', 'rejected', 'draft');
  CREATE TYPE "public"."enum__payload_resources_v_version_enhancement_status" AS ENUM('not_enhanced', 'pending', 'enhanced', 'needs_update', 'failed');
  CREATE TYPE "public"."enum__payload_resources_v_version_resource_type" AS ENUM('official', 'community', 'beta', 'deprecated', 'archived');
  CREATE TYPE "public"."enum__payload_resources_v_version_featured_reason" AS ENUM('editors-pick', 'most-popular', 'new', 'trending', 'essential');
  CREATE TYPE "public"."enum__payload_resources_v_version_discovery_discovered_by" AS ENUM('ai', 'manual', 'import', 'suggestion');
  CREATE TYPE "public"."enum__payload_resources_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "public"."enum__payload_resources_v_published_locale" AS ENUM('en', 'es', 'fr', 'de', 'ja', 'zh', 'ko', 'pt', 'sr', 'ru', 'it', 'nl', 'pl', 'sv', 'no', 'da', 'fi', 'el');
  CREATE TYPE "public"."enum_payload_resource_sources_type" AS ENUM('github_repo', 'github_search', 'awesome_list', 'npm', 'pypi', 'website', 'rss', 'api', 'manual');
  CREATE TYPE "public"."enum_payload_resource_sources_scan_frequency" AS ENUM('daily', 'weekly', 'monthly', 'manual');
  CREATE TYPE "public"."enum_payload_resource_sources_last_scan_status" AS ENUM('success', 'partial', 'failed', 'never');
  CREATE TYPE "public"."enum_payload_resource_discovery_queue_suggested_status" AS ENUM('official', 'community', 'beta', 'deprecated');
  CREATE TYPE "public"."enum_payload_resource_discovery_queue_package_registry" AS ENUM('npm', 'pypi');
  CREATE TYPE "public"."enum_payload_resource_discovery_queue_status" AS ENUM('pending', 'approved', 'rejected', 'duplicate', 'needs_info');
  CREATE TYPE "public"."enum_payload_resource_discovery_queue_priority" AS ENUM('high', 'normal', 'low');
  CREATE TYPE "public"."enum_payload_resource_reviews_status" AS ENUM('pending', 'approved', 'rejected', 'flagged');
  CREATE TYPE "public"."enum_payload_resource_reviews_rejection_reason" AS ENUM('spam', 'inappropriate', 'off-topic', 'fake', 'duplicate', 'other');
  CREATE TYPE "public"."enum_payload_resource_authors_role" AS ENUM('creator', 'maintainer', 'contributor', 'author', 'organization');
  CREATE TYPE "public"."enum_audit_logs_action" AS ENUM('create', 'update', 'delete', 'approve', 'reject', 'discover', 'scrape', 'analyze', 'import', 'export', 'login', 'logout', 'settings', 'bulk');
  CREATE TYPE "public"."enum_audit_logs_status" AS ENUM('success', 'failed', 'partial');
  CREATE TYPE "public"."enum_documents_ai_relationships_relationship_type" AS ENUM('required', 'recommended', 'related', 'example', 'alternative', 'extends', 'implements');
  CREATE TYPE "public"."enum_documents_display_mode" AS ENUM('hover', 'cards', 'both');
  CREATE TYPE "public"."enum_documents_analysis_status" AS ENUM('pending', 'analyzed', 'needs_update', 'failed');
  CREATE TYPE "public"."enum_documents_rewrite_info_rewrite_status" AS ENUM('none', 'queued', 'in_progress', 'completed');
  CREATE TYPE "public"."enum_document_sections_display_mode" AS ENUM('inherit', 'hover', 'cards');
  CREATE TYPE "public"."enum_difficulty_levels_color" AS ENUM('green', 'blue', 'yellow', 'orange', 'red', 'purple', 'gray');
  CREATE TYPE "public"."enum_payload_edit_suggestions_target_type" AS ENUM('doc', 'resource');
  CREATE TYPE "public"."enum_payload_edit_suggestions_status" AS ENUM('pending', 'reviewing', 'approved', 'rejected', 'merged');
  CREATE TYPE "public"."enum_payload_edit_suggestions_priority" AS ENUM('low', 'normal', 'high', 'critical');
  CREATE TYPE "public"."enum_payload_edit_suggestions_submitter_type" AS ENUM('public', 'cms', 'anonymous');
  CREATE TYPE "public"."enum_translations_namespace" AS ENUM('common', 'navigation', 'home', 'search', 'favorites', 'collections', 'readingLists', 'notifications', 'profile', 'settings', 'auth', 'pwa', 'errors', 'footer');
  CREATE TYPE "public"."enum_email_templates_slug" AS ENUM('verification', 'verification-code', 'password-reset', 'welcome', 'notification', 'digest', 'mention', 'follow', 'comment-reply', 'donation-receipt', 'donation-thank-you', 'feedback-confirmation', 'admin-alert', 'import-complete', 'discovery-complete');
  CREATE TYPE "public"."enum_email_templates_status" AS ENUM('draft', 'active');
  CREATE TYPE "public"."enum_achievement_tiers_animation" AS ENUM('none', 'pulse', 'glow', 'shine', 'rainbow');
  CREATE TYPE "public"."enum_payload_achievements_condition_type" AS ENUM('special', 'count', 'streak', 'time', 'first', 'compound');
  CREATE TYPE "public"."enum_payload_achievements_metric" AS ENUM('messages_sent', 'messages_received', 'conversations_started', 'groups_created', 'followers_count', 'following_count', 'profile_views', 'reviews_written', 'comments_posted', 'favorites_count', 'ratings_count', 'login_days', 'account_age_days', 'streak_days', '2fa_enabled', 'passkeys_count', 'ai_conversations', 'ai_messages');
  CREATE TYPE "public"."enum_payload_achievements_compound_logic" AS ENUM('and', 'or');
  CREATE TYPE "public"."enum_payload_achievements_notification_sound" AS ENUM('achievement', 'level_up', 'fanfare', 'subtle', 'none');
  CREATE TYPE "public"."enum_badges_type" AS ENUM('role', 'donor', 'special', 'event', 'verified', 'achievement');
  CREATE TYPE "public"."enum_badges_role_required" AS ENUM('', 'editor', 'moderator', 'admin', 'superadmin');
  CREATE TYPE "public"."enum_badges_donor_tier_required" AS ENUM('', 'bronze', 'silver', 'gold', 'platinum');
  CREATE TYPE "public"."enum_site_settings_notifications_digest_frequency" AS ENUM('immediate', 'daily', 'weekly', 'never');
  CREATE TYPE "public"."enum_site_settings_announcement_type" AS ENUM('info', 'success', 'warning', 'feature', 'critical');
  CREATE TYPE "public"."enum_seo_settings_index_now_search_engines" AS ENUM('bing', 'yandex', 'seznam', 'naver');
  CREATE TYPE "public"."enum_seo_settings_open_graph_type" AS ENUM('website', 'article', 'product');
  CREATE TYPE "public"."enum_seo_settings_twitter_card_type" AS ENUM('summary', 'summary_large_image', 'app', 'player');
  CREATE TYPE "public"."enum_seo_settings_structured_data_organization_type" AS ENUM('Organization', 'Corporation', 'EducationalOrganization', 'LocalBusiness');
  CREATE TYPE "public"."enum_seo_settings_robots_sitemap_change_freq" AS ENUM('always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never');
  CREATE TYPE "public"."enum_seo_settings_advanced_www_redirect" AS ENUM('www', 'non-www', 'none');
  CREATE TYPE "public"."enum_cross_link_settings_display_defaults_default_display_mode" AS ENUM('hover', 'cards', 'both');
  CREATE TYPE "public"."enum_ai_pipeline_settings_relationships_enabled_types" AS ENUM('required', 'recommended', 'related', 'example', 'alternative', 'extends', 'implements');
  CREATE TYPE "public"."enum_ai_pipeline_settings_documentation_preserve_sections" AS ENUM('code_examples', 'content_meta', 'custom_components');
  CREATE TYPE "public"."enum_ai_pipeline_settings_scheduling_preferred_days" AS ENUM('monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday');
  CREATE TYPE "public"."enum_ai_pipeline_settings_documentation_auto_rewrite_schedule" AS ENUM('disabled', 'weekly', 'monthly');
  CREATE TYPE "public"."enum_ai_pipeline_settings_model_config_preferred_model" AS ENUM('claude-opus-4-5-20251101', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022');
  CREATE TYPE "public"."enum_ai_pipeline_settings_model_config_fallback_model" AS ENUM('claude-opus-4-5-20251101', 'claude-sonnet-4-20250514', 'claude-3-5-haiku-20241022');
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"bio" varchar,
  	"role" "enum_users_role" DEFAULT 'editor' NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"permissions_can_approve_comments" boolean DEFAULT false,
  	"permissions_can_approve_edits" boolean DEFAULT false,
  	"permissions_can_manage_resources" boolean DEFAULT false,
  	"permissions_can_view_analytics" boolean DEFAULT false,
  	"last_login_at" timestamp(3) with time zone,
  	"login_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"caption" varchar,
  	"category" "enum_media_category" DEFAULT 'general',
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_avatar_url" varchar,
  	"sizes_avatar_width" numeric,
  	"sizes_avatar_height" numeric,
  	"sizes_avatar_mime_type" varchar,
  	"sizes_avatar_filesize" numeric,
  	"sizes_avatar_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_feature_url" varchar,
  	"sizes_feature_width" numeric,
  	"sizes_feature_height" numeric,
  	"sizes_feature_mime_type" varchar,
  	"sizes_feature_filesize" numeric,
  	"sizes_feature_filename" varchar
  );
  
  CREATE TABLE "categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"short_name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"icon" varchar NOT NULL,
  	"color" "enum_categories_color" DEFAULT 'blue' NOT NULL,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "subcategories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"category_id" integer NOT NULL,
  	"description" varchar,
  	"icon" varchar,
  	"resource_count" numeric DEFAULT 0,
  	"sort_order" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "tags" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"resource_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_resources_key_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"feature" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "payload_resources_use_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"use_case" varchar,
  	"description" varchar
  );
  
  CREATE TABLE "payload_resources_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"pro" varchar
  );
  
  CREATE TABLE "payload_resources_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"con" varchar
  );
  
  CREATE TABLE "payload_resources_ai_doc_relationships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_slug" varchar,
  	"doc_title" varchar,
  	"relationship_type" "res_doc_rel_type",
  	"confidence" numeric,
  	"reasoning" varchar,
  	"is_approved" boolean DEFAULT false
  );
  
  CREATE TABLE "payload_resources_ai_resource_relationships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"resource_id" varchar,
  	"resource_title" varchar,
  	"relationship_type" "res_res_rel_type",
  	"confidence" numeric
  );
  
  CREATE TABLE "payload_resources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"publish_status" "enum_payload_resources_publish_status" DEFAULT 'draft',
  	"enhancement_status" "enum_payload_resources_enhancement_status" DEFAULT 'not_enhanced',
  	"title" varchar,
  	"description" varchar,
  	"url" varchar,
  	"category_id" integer,
  	"subcategory_id" integer,
  	"difficulty_id" integer,
  	"resource_type" "enum_payload_resources_resource_type" DEFAULT 'community',
  	"featured" boolean DEFAULT false,
  	"featured_reason" "enum_payload_resources_featured_reason",
  	"added_date" timestamp(3) with time zone,
  	"last_verified" timestamp(3) with time zone,
  	"ai_summary" varchar,
  	"ai_overview" jsonb,
  	"enhancement_metadata_ai_enhanced_at" timestamp(3) with time zone,
  	"enhancement_metadata_ai_model" varchar,
  	"enhancement_metadata_enhancement_notes" varchar,
  	"relationship_count" numeric,
  	"github_owner" varchar,
  	"github_repo" varchar,
  	"github_stars" numeric DEFAULT 0,
  	"github_forks" numeric DEFAULT 0,
  	"github_last_updated" timestamp(3) with time zone,
  	"github_language_id" integer,
  	"version" varchar,
  	"namespace" varchar,
  	"discovery_source_id" integer,
  	"discovery_discovered_by" "enum_payload_resources_discovery_discovered_by",
  	"discovery_discovered_at" timestamp(3) with time zone,
  	"discovery_ai_confidence_score" numeric,
  	"discovery_ai_notes" varchar,
  	"review_reviewed_by_id" integer,
  	"review_reviewed_at" timestamp(3) with time zone,
  	"review_review_notes" varchar,
  	"review_rejection_reason" varchar,
  	"meta_keywords" varchar,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "enum_payload_resources_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload_resources_locales" (
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "payload_resources_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"documents_id" integer,
  	"payload_resources_id" integer
  );
  
  CREATE TABLE "_payload_resources_v_version_key_features" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"feature" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_payload_resources_v_version_use_cases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"use_case" varchar,
  	"description" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_payload_resources_v_version_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"pro" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_payload_resources_v_version_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"con" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_payload_resources_v_version_ai_doc_relationships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"doc_slug" varchar,
  	"doc_title" varchar,
  	"relationship_type" "res_doc_rel_type",
  	"confidence" numeric,
  	"reasoning" varchar,
  	"is_approved" boolean DEFAULT false,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_payload_resources_v_version_ai_resource_relationships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"resource_id" varchar,
  	"resource_title" varchar,
  	"relationship_type" "res_res_rel_type",
  	"confidence" numeric,
  	"_uuid" varchar
  );
  
  CREATE TABLE "_payload_resources_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_publish_status" "enum__payload_resources_v_version_publish_status" DEFAULT 'draft',
  	"version_enhancement_status" "enum__payload_resources_v_version_enhancement_status" DEFAULT 'not_enhanced',
  	"version_title" varchar,
  	"version_description" varchar,
  	"version_url" varchar,
  	"version_category_id" integer,
  	"version_subcategory_id" integer,
  	"version_difficulty_id" integer,
  	"version_resource_type" "enum__payload_resources_v_version_resource_type" DEFAULT 'community',
  	"version_featured" boolean DEFAULT false,
  	"version_featured_reason" "enum__payload_resources_v_version_featured_reason",
  	"version_added_date" timestamp(3) with time zone,
  	"version_last_verified" timestamp(3) with time zone,
  	"version_ai_summary" varchar,
  	"version_ai_overview" jsonb,
  	"version_enhancement_metadata_ai_enhanced_at" timestamp(3) with time zone,
  	"version_enhancement_metadata_ai_model" varchar,
  	"version_enhancement_metadata_enhancement_notes" varchar,
  	"version_relationship_count" numeric,
  	"version_github_owner" varchar,
  	"version_github_repo" varchar,
  	"version_github_stars" numeric DEFAULT 0,
  	"version_github_forks" numeric DEFAULT 0,
  	"version_github_last_updated" timestamp(3) with time zone,
  	"version_github_language_id" integer,
  	"version_version" varchar,
  	"version_namespace" varchar,
  	"version_discovery_source_id" integer,
  	"version_discovery_discovered_by" "enum__payload_resources_v_version_discovery_discovered_by",
  	"version_discovery_discovered_at" timestamp(3) with time zone,
  	"version_discovery_ai_confidence_score" numeric,
  	"version_discovery_ai_notes" varchar,
  	"version_review_reviewed_by_id" integer,
  	"version_review_reviewed_at" timestamp(3) with time zone,
  	"version_review_review_notes" varchar,
  	"version_review_rejection_reason" varchar,
  	"version_meta_keywords" varchar,
  	"version_meta_no_index" boolean DEFAULT false,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "enum__payload_resources_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"snapshot" boolean,
  	"published_locale" "enum__payload_resources_v_published_locale",
  	"latest" boolean
  );
  
  CREATE TABLE "_payload_resources_v_locales" (
  	"version_meta_title" varchar,
  	"version_meta_description" varchar,
  	"version_meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "_payload_resources_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"documents_id" integer,
  	"payload_resources_id" integer
  );
  
  CREATE TABLE "payload_resource_sources" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"supabase_id" varchar,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"type" "enum_payload_resource_sources_type" NOT NULL,
  	"url" varchar NOT NULL,
  	"github_owner" varchar,
  	"github_repo" varchar,
  	"github_branch" varchar DEFAULT 'main',
  	"github_path" varchar,
  	"github_search_query" varchar,
  	"github_topics" varchar,
  	"registry_search_query" varchar,
  	"registry_scope" varchar,
  	"registry_keywords" varchar,
  	"discovery_settings_default_category_id" integer,
  	"discovery_settings_default_subcategory_id" integer,
  	"discovery_settings_auto_approve" boolean DEFAULT false,
  	"discovery_settings_min_stars" numeric DEFAULT 0,
  	"discovery_settings_min_downloads" numeric DEFAULT 0,
  	"discovery_settings_include_patterns" varchar,
  	"discovery_settings_exclude_patterns" varchar,
  	"is_active" boolean DEFAULT true,
  	"scan_frequency" "enum_payload_resource_sources_scan_frequency" DEFAULT 'weekly',
  	"last_scanned_at" timestamp(3) with time zone,
  	"last_scan_status" "enum_payload_resource_sources_last_scan_status" DEFAULT 'never',
  	"last_scan_error" varchar,
  	"resource_count" numeric DEFAULT 0,
  	"pending_count" numeric DEFAULT 0,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_resource_sources_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "payload_resource_discovery_queue" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"suggested_category_id" integer,
  	"suggested_subcategory_id" integer,
  	"suggested_difficulty_id" integer,
  	"suggested_status" "enum_payload_resource_discovery_queue_suggested_status" DEFAULT 'community',
  	"github_owner" varchar,
  	"github_repo" varchar,
  	"github_stars" numeric,
  	"github_forks" numeric,
  	"github_language" varchar,
  	"github_last_commit" timestamp(3) with time zone,
  	"github_open_issues" numeric,
  	"github_license" varchar,
  	"package_name" varchar,
  	"package_version" varchar,
  	"package_weekly_downloads" numeric,
  	"package_registry" "enum_payload_resource_discovery_queue_package_registry",
  	"source_id" integer,
  	"source_url" varchar,
  	"raw_data" jsonb,
  	"ai_analysis_confidence_score" numeric,
  	"ai_analysis_relevance_score" numeric,
  	"ai_analysis_quality_score" numeric,
  	"ai_analysis_reasoning" varchar,
  	"ai_analysis_suggested_improvements" varchar,
  	"ai_analysis_warnings" varchar,
  	"ai_analysis_analyzed_at" timestamp(3) with time zone,
  	"status" "enum_payload_resource_discovery_queue_status" DEFAULT 'pending' NOT NULL,
  	"priority" "enum_payload_resource_discovery_queue_priority" DEFAULT 'normal',
  	"reviewed_by_id" integer,
  	"reviewed_at" timestamp(3) with time zone,
  	"review_notes" varchar,
  	"rejection_reason" varchar,
  	"created_resource_id" integer,
  	"duplicate_of_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_resource_discovery_queue_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer
  );
  
  CREATE TABLE "payload_resource_reviews_pros" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload_resource_reviews_cons" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"text" varchar
  );
  
  CREATE TABLE "payload_resource_reviews" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"supabase_id" varchar NOT NULL,
  	"resource_title" varchar,
  	"resource_slug" varchar,
  	"user_name" varchar,
  	"user_email" varchar,
  	"user_id" varchar,
  	"title" varchar,
  	"content" varchar NOT NULL,
  	"rating" numeric NOT NULL,
  	"status" "enum_payload_resource_reviews_status" DEFAULT 'pending' NOT NULL,
  	"moderation_notes" varchar,
  	"rejection_reason" "enum_payload_resource_reviews_rejection_reason",
  	"moderated_by_id" integer,
  	"moderated_at" timestamp(3) with time zone,
  	"helpful_count" numeric DEFAULT 0,
  	"not_helpful_count" numeric DEFAULT 0,
  	"submitted_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_resource_authors" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"resource_id" integer NOT NULL,
  	"user_id" integer,
  	"name" varchar NOT NULL,
  	"role" "enum_payload_resource_authors_role" DEFAULT 'creator' NOT NULL,
  	"is_primary" boolean DEFAULT false,
  	"github_username" varchar,
  	"twitter_username" varchar,
  	"website_url" varchar,
  	"avatar_url" varchar,
  	"bio" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "audit_logs" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"action" "enum_audit_logs_action" NOT NULL,
  	"collection" varchar,
  	"document_id" varchar,
  	"user_id" integer NOT NULL,
  	"user_snapshot_email" varchar,
  	"user_snapshot_name" varchar,
  	"user_snapshot_role" varchar,
  	"changes" jsonb,
  	"metadata_ip_address" varchar,
  	"metadata_user_agent" varchar,
  	"metadata_endpoint" varchar,
  	"metadata_method" varchar,
  	"metadata_duration" numeric,
  	"metadata_status_code" numeric,
  	"context_reason" varchar,
  	"context_notes" varchar,
  	"context_affected_count" numeric,
  	"context_source_url" varchar,
  	"status" "enum_audit_logs_status" DEFAULT 'success' NOT NULL,
  	"error_message" varchar,
  	"error_code" varchar,
  	"error_stack" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "documents_ai_relationships" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"resource_id" varchar NOT NULL,
  	"resource_title" varchar,
  	"relationship_type" "enum_documents_ai_relationships_relationship_type" NOT NULL,
  	"confidence" numeric,
  	"reasoning" varchar,
  	"is_approved" boolean DEFAULT false
  );
  
  CREATE TABLE "documents_rewrite_info_source_urls" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL,
  	"title" varchar
  );
  
  CREATE TABLE "documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"doc_category" varchar NOT NULL,
  	"sync_info_mdx_path" varchar,
  	"sync_info_content_hash" varchar,
  	"sync_info_last_synced" timestamp(3) with time zone,
  	"metadata_reading_time" varchar,
  	"metadata_word_count" numeric,
  	"metadata_heading_count" numeric,
  	"metadata_code_block_count" numeric,
  	"display_mode" "enum_documents_display_mode" DEFAULT 'both',
  	"auto_match_enabled" boolean DEFAULT true,
  	"relationship_count" numeric,
  	"analysis_status" "enum_documents_analysis_status" DEFAULT 'pending',
  	"last_analyzed_at" timestamp(3) with time zone,
  	"analysis_metadata_ai_model" varchar,
  	"analysis_metadata_analysis_content_hash" varchar,
  	"analysis_metadata_relationships_found" numeric,
  	"analysis_metadata_analysis_duration" numeric,
  	"analysis_metadata_analysis_notes" varchar,
  	"rewrite_info_last_rewrite_at" timestamp(3) with time zone,
  	"rewrite_info_rewrite_status" "enum_documents_rewrite_info_rewrite_status" DEFAULT 'none',
  	"meta_keywords" varchar,
  	"meta_no_index" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "documents_locales" (
  	"meta_title" varchar,
  	"meta_description" varchar,
  	"meta_image_id" integer,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"payload_resources_id" integer
  );
  
  CREATE TABLE "document_sections" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"document_id" integer NOT NULL,
  	"heading_id" varchar NOT NULL,
  	"heading_text" varchar NOT NULL,
  	"heading_level" numeric NOT NULL,
  	"order" numeric NOT NULL,
  	"show_related_resources" boolean DEFAULT true,
  	"display_mode" "enum_document_sections_display_mode" DEFAULT 'inherit',
  	"content_preview" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "document_sections_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"payload_resources_id" integer
  );
  
  CREATE TABLE "code_examples" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"document_id" integer NOT NULL,
  	"section_id" integer,
  	"code_id" varchar NOT NULL,
  	"title" varchar,
  	"filename" varchar,
  	"language_id" integer,
  	"order" numeric NOT NULL,
  	"code_preview" varchar,
  	"metadata_line_count" numeric,
  	"metadata_patterns" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "code_examples_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"tags_id" integer,
  	"payload_resources_id" integer
  );
  
  CREATE TABLE "difficulty_levels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"description" varchar,
  	"color" "enum_difficulty_levels_color" DEFAULT 'gray' NOT NULL,
  	"icon" varchar,
  	"sort_order" numeric DEFAULT 0 NOT NULL,
  	"resource_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "programming_languages_aliases" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"alias" varchar
  );
  
  CREATE TABLE "programming_languages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"slug" varchar NOT NULL,
  	"color" varchar DEFAULT 'gray-500' NOT NULL,
  	"icon" varchar,
  	"website" varchar,
  	"resource_count" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_edit_suggestions" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar NOT NULL,
  	"target_type" "enum_payload_edit_suggestions_target_type" NOT NULL,
  	"target_id" varchar NOT NULL,
  	"target_url" varchar,
  	"current_content" varchar,
  	"suggested_content" varchar NOT NULL,
  	"reason" varchar,
  	"status" "enum_payload_edit_suggestions_status" DEFAULT 'pending' NOT NULL,
  	"priority" "enum_payload_edit_suggestions_priority" DEFAULT 'normal',
  	"submitter_type" "enum_payload_edit_suggestions_submitter_type" DEFAULT 'anonymous',
  	"submitter_user_id" varchar,
  	"submitter_email" varchar,
  	"submitter_name" varchar,
  	"reviewed_by_id" integer,
  	"review_notes" varchar,
  	"rejection_reason" varchar,
  	"reviewed_at" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "translations_placeholders" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar
  );
  
  CREATE TABLE "translations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"namespace" "enum_translations_namespace" NOT NULL,
  	"key" varchar NOT NULL,
  	"context" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "translations_locales" (
  	"value" varchar NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"_locale" "_locales" NOT NULL,
  	"_parent_id" integer NOT NULL
  );
  
  CREATE TABLE "email_templates" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" "enum_email_templates_slug" NOT NULL,
  	"name" varchar NOT NULL,
  	"status" "enum_email_templates_status" DEFAULT 'draft' NOT NULL,
  	"subject" varchar NOT NULL,
  	"preview_text" varchar,
  	"html_content" jsonb NOT NULL,
  	"plain_text_content" varchar,
  	"styling_primary_color" varchar,
  	"styling_show_logo" boolean DEFAULT true,
  	"styling_show_footer" boolean DEFAULT true,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "achievement_tiers" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"point_multiplier" numeric DEFAULT 1 NOT NULL,
  	"color_gradient_from" varchar DEFAULT 'gray-400' NOT NULL,
  	"color_gradient_via" varchar,
  	"color_gradient_to" varchar DEFAULT 'gray-500' NOT NULL,
  	"glow_color" varchar DEFAULT 'gray-500/20',
  	"text_color" varchar DEFAULT 'gray-600',
  	"animation" "enum_achievement_tiers_animation" DEFAULT 'none' NOT NULL,
  	"sort_order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "achievement_categories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"icon" varchar NOT NULL,
  	"color" varchar DEFAULT 'blue',
  	"sort_order" numeric DEFAULT 0 NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_achievements" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar NOT NULL,
  	"icon" varchar NOT NULL,
  	"tier_id" integer NOT NULL,
  	"category_id" integer NOT NULL,
  	"base_points" numeric DEFAULT 10 NOT NULL,
  	"condition_type" "enum_payload_achievements_condition_type" DEFAULT 'special' NOT NULL,
  	"metric" "enum_payload_achievements_metric",
  	"threshold" numeric DEFAULT 1,
  	"time_window" varchar,
  	"compound_logic" "enum_payload_achievements_compound_logic" DEFAULT 'and',
  	"compound_conditions" jsonb,
  	"notification_title" varchar,
  	"notification_message" varchar,
  	"notification_sound" "enum_payload_achievements_notification_sound" DEFAULT 'achievement',
  	"show_confetti" boolean DEFAULT true,
  	"confetti_duration" numeric DEFAULT 3000,
  	"display_duration" numeric DEFAULT 5000,
  	"is_active" boolean DEFAULT true,
  	"is_hidden" boolean DEFAULT false,
  	"is_secret" boolean DEFAULT false,
  	"is_limited" boolean DEFAULT false,
  	"start_date" timestamp(3) with time zone,
  	"end_date" timestamp(3) with time zone,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "badges" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"slug" varchar NOT NULL,
  	"name" varchar NOT NULL,
  	"description" varchar,
  	"type" "enum_badges_type" NOT NULL,
  	"icon" varchar NOT NULL,
  	"text_color" varchar DEFAULT 'white',
  	"bg_color" varchar DEFAULT 'blue-500',
  	"border_color" varchar,
  	"gradient_enabled" boolean DEFAULT false,
  	"gradient_from" varchar,
  	"gradient_via" varchar,
  	"gradient_to" varchar,
  	"role_required" "enum_badges_role_required",
  	"donor_tier_required" "enum_badges_donor_tier_required",
  	"achievement_required_id" integer,
  	"manual_only" boolean DEFAULT false,
  	"priority" numeric DEFAULT 0 NOT NULL,
  	"is_active" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"categories_id" integer,
  	"subcategories_id" integer,
  	"tags_id" integer,
  	"payload_resources_id" integer,
  	"payload_resource_sources_id" integer,
  	"payload_resource_discovery_queue_id" integer,
  	"payload_resource_reviews_id" integer,
  	"payload_resource_authors_id" integer,
  	"audit_logs_id" integer,
  	"documents_id" integer,
  	"document_sections_id" integer,
  	"code_examples_id" integer,
  	"difficulty_levels_id" integer,
  	"programming_languages_id" integer,
  	"payload_edit_suggestions_id" integer,
  	"translations_id" integer,
  	"email_templates_id" integer,
  	"achievement_tiers_id" integer,
  	"achievement_categories_id" integer,
  	"payload_achievements_id" integer,
  	"badges_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "site_settings_footer_custom_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar NOT NULL,
  	"url" varchar NOT NULL,
  	"external" boolean DEFAULT false
  );
  
  CREATE TABLE "site_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"general_site_name" varchar DEFAULT 'Claude Insider' NOT NULL,
  	"general_tagline" varchar DEFAULT 'Your Guide to Mastering Claude AI' NOT NULL,
  	"general_description" varchar DEFAULT 'Comprehensive documentation, tips, tricks, and resources for Claude AI by Anthropic.' NOT NULL,
  	"general_version" varchar DEFAULT '1.13.1',
  	"general_logo_id" integer,
  	"general_favicon_id" integer,
  	"social_github" varchar DEFAULT 'https://github.com/siliconyouth/claude-insider',
  	"social_twitter" varchar,
  	"social_discord" varchar,
  	"social_linkedin" varchar,
  	"social_youtube" varchar,
  	"social_bluesky" varchar,
  	"footer_copyright_text" varchar DEFAULT '© 2025 Vladimir Dukelic. All rights reserved.',
  	"footer_show_version" boolean DEFAULT true,
  	"footer_show_build_info" boolean DEFAULT true,
  	"seo_og_image" varchar DEFAULT '/og-image.png',
  	"seo_twitter_handle" varchar,
  	"seo_google_analytics_id" varchar,
  	"features_maintenance_mode" boolean DEFAULT false,
  	"features_maintenance_message" varchar DEFAULT 'We are currently performing scheduled maintenance. Please check back soon.',
  	"features_maintenance_allowed_i_ps" varchar,
  	"features_enable_voice_assistant" boolean DEFAULT true,
  	"features_enable_search" boolean DEFAULT true,
  	"features_enable_analytics" boolean DEFAULT true,
  	"features_enable_chat" boolean DEFAULT true,
  	"features_enable_achievements" boolean DEFAULT true,
  	"features_enable_donations" boolean DEFAULT true,
  	"features_enable_user_registration" boolean DEFAULT true,
  	"features_enable_sound_effects" boolean DEFAULT true,
  	"security_enable_bot_challenge" boolean DEFAULT true,
  	"security_enable_honeypots" boolean DEFAULT true,
  	"security_enable_e2_e_e" boolean DEFAULT true,
  	"security_enable_fingerprinting" boolean DEFAULT true,
  	"security_trusted_domains" varchar DEFAULT 'www.claudeinsider.com
  claudeinsider.com
  localhost',
  	"security_blocked_i_ps" varchar,
  	"security_rate_limit_per_minute" numeric DEFAULT 60,
  	"performance_enable_i_s_r" boolean DEFAULT true,
  	"performance_enable_prefetching" boolean DEFAULT true,
  	"performance_cache_revalidate_seconds" numeric DEFAULT 3600,
  	"performance_static_page_paths" varchar DEFAULT '/
  /docs
  /resources
  /donate',
  	"performance_enable_lazy_providers" boolean DEFAULT true,
  	"performance_enable_image_optimization" boolean DEFAULT true,
  	"notifications_enable_email_notifications" boolean DEFAULT true,
  	"notifications_enable_push_notifications" boolean DEFAULT false,
  	"notifications_email_from_address" varchar DEFAULT 'noreply@claudeinsider.com',
  	"notifications_email_from_name" varchar DEFAULT 'Claude Insider',
  	"notifications_digest_frequency" "enum_site_settings_notifications_digest_frequency" DEFAULT 'daily',
  	"notifications_notification_types_messages" boolean DEFAULT true,
  	"notifications_notification_types_mentions" boolean DEFAULT true,
  	"notifications_notification_types_achievements" boolean DEFAULT true,
  	"notifications_notification_types_updates" boolean DEFAULT false,
  	"notifications_notification_types_marketing" boolean DEFAULT false,
  	"notifications_notification_types_security" boolean DEFAULT true,
  	"api_enable_public_a_p_i" boolean DEFAULT true,
  	"api_api_rate_limit" numeric DEFAULT 1000,
  	"api_api_cors_origins" varchar DEFAULT 'https://www.claudeinsider.com
  https://claudeinsider.com',
  	"api_api_version" varchar DEFAULT 'v1',
  	"contact_email" varchar DEFAULT 'vladimir@dukelic.com',
  	"contact_support_url" varchar DEFAULT 'https://github.com/siliconyouth/claude-insider/issues',
  	"contact_privacy_email" varchar DEFAULT 'privacy@claudeinsider.com',
  	"announcement_enabled" boolean DEFAULT false,
  	"announcement_message" varchar,
  	"announcement_link" varchar,
  	"announcement_type" "enum_site_settings_announcement_type" DEFAULT 'info',
  	"announcement_expires_at" timestamp(3) with time zone,
  	"announcement_dismissible" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "seo_settings_open_graph_alternate_locales" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"locale" varchar NOT NULL
  );
  
  CREATE TABLE "seo_settings_structured_data_same_as" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"url" varchar NOT NULL
  );
  
  CREATE TABLE "seo_settings_index_now_search_engines" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_seo_settings_index_now_search_engines",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "seo_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"meta_title_template" varchar DEFAULT '%s | Claude Insider',
  	"meta_default_title" varchar DEFAULT 'Claude Insider - Your Guide to Mastering Claude AI',
  	"meta_default_description" varchar DEFAULT 'Comprehensive documentation, tips, and guides for Claude AI, Claude Code, and the Anthropic ecosystem. Master AI-powered development with 34 docs and 1,952+ curated resources.',
  	"meta_keywords" varchar DEFAULT 'Claude AI, Claude Code, Anthropic, AI documentation, AI development, Claude API',
  	"meta_author" varchar DEFAULT 'Vladimir Dukelic',
  	"meta_theme_color" varchar DEFAULT '#0a0a0a',
  	"open_graph_site_name" varchar DEFAULT 'Claude Insider',
  	"open_graph_type" "enum_seo_settings_open_graph_type" DEFAULT 'website',
  	"open_graph_locale" varchar DEFAULT 'en_US',
  	"open_graph_default_image_id" integer,
  	"open_graph_image_alt" varchar DEFAULT 'Claude Insider - Your Guide to Mastering Claude AI',
  	"twitter_card_type" "enum_seo_settings_twitter_card_type" DEFAULT 'summary_large_image',
  	"twitter_site" varchar DEFAULT '@claudeinsider',
  	"twitter_creator" varchar DEFAULT '@claudeinsider',
  	"structured_data_organization_type" "enum_seo_settings_structured_data_organization_type" DEFAULT 'Organization',
  	"structured_data_organization_name" varchar DEFAULT 'Claude Insider',
  	"structured_data_logo_id" integer,
  	"structured_data_contact_email" varchar DEFAULT 'vladimir@dukelic.com',
  	"structured_data_contact_type" varchar DEFAULT 'customer support',
  	"verification_google" varchar,
  	"verification_bing" varchar,
  	"verification_yandex" varchar,
  	"verification_pinterest" varchar,
  	"robots_index_site" boolean DEFAULT true,
  	"robots_follow_links" boolean DEFAULT true,
  	"robots_sitemap_enabled" boolean DEFAULT true,
  	"robots_sitemap_change_freq" "enum_seo_settings_robots_sitemap_change_freq" DEFAULT 'weekly',
  	"robots_sitemap_priority" numeric DEFAULT 0.7,
  	"index_now_enabled" boolean DEFAULT true,
  	"index_now_api_key" varchar,
  	"analytics_google_analytics_id" varchar,
  	"analytics_google_tag_manager_id" varchar,
  	"analytics_plausible_domain" varchar,
  	"analytics_enable_vercel_analytics" boolean DEFAULT true,
  	"advanced_canonical_domain" varchar DEFAULT 'https://www.claudeinsider.com',
  	"advanced_trailing_slash" boolean DEFAULT false,
  	"advanced_www_redirect" "enum_seo_settings_advanced_www_redirect" DEFAULT 'www',
  	"advanced_hreflang_enabled" boolean DEFAULT true,
  	"advanced_default_hreflang" varchar DEFAULT 'en',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cross_link_settings_category_mappings" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"doc_category" varchar NOT NULL,
  	"boost_weight" numeric DEFAULT 1 NOT NULL
  );
  
  CREATE TABLE "cross_link_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"auto_matching_min_tag_overlap" numeric DEFAULT 2 NOT NULL,
  	"auto_matching_min_score_threshold" numeric DEFAULT 0.3 NOT NULL,
  	"auto_matching_max_auto_matches" numeric DEFAULT 5 NOT NULL,
  	"auto_matching_enabled" boolean DEFAULT true,
  	"display_defaults_default_display_mode" "enum_cross_link_settings_display_defaults_default_display_mode" DEFAULT 'both' NOT NULL,
  	"display_defaults_hover_delay_ms" numeric DEFAULT 200 NOT NULL,
  	"display_defaults_show_resource_cards_after_section" boolean DEFAULT true,
  	"display_defaults_show_resource_cards_at_document_end" boolean DEFAULT true,
  	"display_defaults_max_cards_per_section" numeric DEFAULT 3,
  	"scoring_weights_tag_overlap_weight" numeric DEFAULT 0.6 NOT NULL,
  	"scoring_weights_category_mapping_weight" numeric DEFAULT 0.25 NOT NULL,
  	"scoring_weights_title_similarity_weight" numeric DEFAULT 0.15 NOT NULL,
  	"features_enable_hover_cards" boolean DEFAULT true,
  	"features_enable_inline_cards" boolean DEFAULT true,
  	"features_enable_section_links" boolean DEFAULT true,
  	"features_enable_code_block_links" boolean DEFAULT true,
  	"features_enable_bidirectional_links" boolean DEFAULT true,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "cross_link_settings_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"categories_id" integer
  );
  
  CREATE TABLE "gamification_settings_levels_perks" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"perk" varchar
  );
  
  CREATE TABLE "gamification_settings_levels" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"level" numeric,
  	"name" varchar,
  	"points_required" numeric,
  	"icon" varchar,
  	"color" varchar
  );
  
  CREATE TABLE "gamification_settings_streaks_milestones" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"days" numeric,
  	"bonus_points" numeric,
  	"achievement_slug" varchar
  );
  
  CREATE TABLE "gamification_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"points_system_enabled" boolean DEFAULT true,
  	"points_system_points_per_message" numeric DEFAULT 1,
  	"points_system_points_per_login" numeric DEFAULT 5,
  	"points_system_points_per_review" numeric DEFAULT 10,
  	"points_system_points_per_comment" numeric DEFAULT 2,
  	"points_system_points_per_rating" numeric DEFAULT 2,
  	"points_system_points_per_favorite" numeric DEFAULT 1,
  	"points_system_points_per_edit_suggestion" numeric DEFAULT 15,
  	"points_system_points_per_share" numeric DEFAULT 3,
  	"points_system_daily_points_cap" numeric DEFAULT 100,
  	"levels_enabled" boolean DEFAULT true,
  	"streaks_enabled" boolean DEFAULT true,
  	"streaks_grace_period_hours" numeric DEFAULT 24,
  	"notifications_show_achievement_popups" boolean DEFAULT true,
  	"notifications_show_level_up_popups" boolean DEFAULT true,
  	"notifications_default_confetti_enabled" boolean DEFAULT true,
  	"notifications_default_sound_enabled" boolean DEFAULT true,
  	"notifications_show_points_toast" boolean DEFAULT true,
  	"leaderboard_enabled" boolean DEFAULT true,
  	"leaderboard_display_limit" numeric DEFAULT 100,
  	"leaderboard_refresh_interval" numeric DEFAULT 5,
  	"leaderboard_show_anonymous_users" boolean DEFAULT false,
  	"leaderboard_minimum_points_to_show" numeric DEFAULT 10,
  	"moderation_enable_abuse_detection" boolean DEFAULT true,
  	"moderation_max_actions_per_hour" numeric DEFAULT 50,
  	"moderation_suspicious_threshold" numeric DEFAULT 100,
  	"moderation_auto_suspend_on_abuse" boolean DEFAULT false,
  	"moderation_moderator_can_adjust_points" boolean DEFAULT true,
  	"moderation_max_points_adjustment" numeric DEFAULT 500,
  	"moderation_require_adjustment_reason" boolean DEFAULT true,
  	"moderation_moderator_can_revoke_achievements" boolean DEFAULT true,
  	"achievements_enabled" boolean DEFAULT true,
  	"achievements_show_hidden_progress" boolean DEFAULT false,
  	"achievements_max_badges_displayed" numeric DEFAULT 5,
  	"achievements_showcase_limit" numeric DEFAULT 3,
  	"achievements_retroactive_awards" boolean DEFAULT true,
  	"event_triggers_award_on_first_action" boolean DEFAULT true,
  	"event_triggers_first_action_multiplier" numeric DEFAULT 5,
  	"event_triggers_award_on_quality" boolean DEFAULT true,
  	"event_triggers_quality_bonus_points" numeric DEFAULT 10,
  	"event_triggers_delay_awards_minutes" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "ai_pipeline_settings_relationships_enabled_types" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_ai_pipeline_settings_relationships_enabled_types",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ai_pipeline_settings_documentation_preserve_sections" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_ai_pipeline_settings_documentation_preserve_sections",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ai_pipeline_settings_scheduling_preferred_days" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_ai_pipeline_settings_scheduling_preferred_days",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "ai_pipeline_settings" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"relationships_min_confidence" numeric DEFAULT 0.6 NOT NULL,
  	"relationships_max_relationships_per_doc" numeric DEFAULT 10 NOT NULL,
  	"relationships_auto_analyze_new_content" boolean DEFAULT false,
  	"relationships_reanalyze_on_content_change" boolean DEFAULT true,
  	"enhancement_auto_enhance_new_resources" boolean DEFAULT false,
  	"enhancement_required_fields_require_summary" boolean DEFAULT true,
  	"enhancement_required_fields_require_key_features" boolean DEFAULT true,
  	"enhancement_required_fields_require_use_cases" boolean DEFAULT true,
  	"enhancement_required_fields_require_pros_and_cons" boolean DEFAULT true,
  	"enhancement_min_features_count" numeric DEFAULT 3,
  	"enhancement_max_features_count" numeric DEFAULT 8,
  	"documentation_auto_rewrite_schedule" "enum_ai_pipeline_settings_documentation_auto_rewrite_schedule" DEFAULT 'disabled',
  	"documentation_require_source_urls" boolean DEFAULT true,
  	"documentation_max_sources_per_doc" numeric DEFAULT 5,
  	"cli_commands_analyze_relationships_command" varchar DEFAULT 'node scripts/analyze-relationships.mjs --slug=<SLUG>',
  	"cli_commands_enhance_resource_command" varchar DEFAULT 'node scripts/enhance-resources.mjs --id=<ID>',
  	"cli_commands_rewrite_doc_command" varchar DEFAULT 'node scripts/rewrite-docs.mjs --slug=<SLUG>',
  	"cli_commands_bulk_analyze_command" varchar DEFAULT 'node scripts/analyze-relationships.mjs --all',
  	"cli_commands_bulk_enhance_command" varchar DEFAULT 'node scripts/enhance-resources.mjs --pending',
  	"operation_tracking_keep_completed_days" numeric DEFAULT 30,
  	"operation_tracking_keep_failed_days" numeric DEFAULT 90,
  	"operation_tracking_notify_on_completion" boolean DEFAULT true,
  	"operation_tracking_notify_on_failure" boolean DEFAULT true,
  	"model_config_preferred_model" "enum_ai_pipeline_settings_model_config_preferred_model" DEFAULT 'claude-opus-4-5-20251101',
  	"model_config_fallback_model" "enum_ai_pipeline_settings_model_config_fallback_model" DEFAULT 'claude-sonnet-4-20250514',
  	"model_config_max_tokens_per_operation" numeric DEFAULT 8000,
  	"model_config_temperature" numeric DEFAULT 0.3,
  	"cost_tracking_enabled" boolean DEFAULT true,
  	"cost_tracking_monthly_budget_u_s_d" numeric DEFAULT 100,
  	"cost_tracking_warning_threshold_percent" numeric DEFAULT 80,
  	"cost_tracking_pause_on_budget_exceeded" boolean DEFAULT true,
  	"cost_tracking_cost_per_input_token" numeric DEFAULT 0.000015,
  	"cost_tracking_cost_per_output_token" numeric DEFAULT 0.000075,
  	"rate_limits_max_operations_per_hour" numeric DEFAULT 100,
  	"rate_limits_max_operations_per_day" numeric DEFAULT 500,
  	"rate_limits_max_concurrent_operations" numeric DEFAULT 3,
  	"rate_limits_cooldown_minutes" numeric DEFAULT 1,
  	"rate_limits_prioritize_manual_requests" boolean DEFAULT true,
  	"scheduling_enable_scheduled_operations" boolean DEFAULT false,
  	"scheduling_preferred_time_u_t_c" varchar DEFAULT '03:00',
  	"scheduling_max_batch_size" numeric DEFAULT 50,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "subcategories" ADD CONSTRAINT "subcategories_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources_key_features" ADD CONSTRAINT "payload_resources_key_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_use_cases" ADD CONSTRAINT "payload_resources_use_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_pros" ADD CONSTRAINT "payload_resources_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_cons" ADD CONSTRAINT "payload_resources_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_ai_doc_relationships" ADD CONSTRAINT "payload_resources_ai_doc_relationships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_ai_resource_relationships" ADD CONSTRAINT "payload_resources_ai_resource_relationships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources" ADD CONSTRAINT "payload_resources_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources" ADD CONSTRAINT "payload_resources_subcategory_id_subcategories_id_fk" FOREIGN KEY ("subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources" ADD CONSTRAINT "payload_resources_difficulty_id_difficulty_levels_id_fk" FOREIGN KEY ("difficulty_id") REFERENCES "public"."difficulty_levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources" ADD CONSTRAINT "payload_resources_github_language_id_programming_languages_id_fk" FOREIGN KEY ("github_language_id") REFERENCES "public"."programming_languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources" ADD CONSTRAINT "payload_resources_discovery_source_id_payload_resource_sources_id_fk" FOREIGN KEY ("discovery_source_id") REFERENCES "public"."payload_resource_sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources" ADD CONSTRAINT "payload_resources_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("review_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources_locales" ADD CONSTRAINT "payload_resources_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resources_locales" ADD CONSTRAINT "payload_resources_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_rels" ADD CONSTRAINT "payload_resources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_rels" ADD CONSTRAINT "payload_resources_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_rels" ADD CONSTRAINT "payload_resources_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resources_rels" ADD CONSTRAINT "payload_resources_rels_resources_fk" FOREIGN KEY ("payload_resources_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_version_key_features" ADD CONSTRAINT "_payload_resources_v_version_key_features_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_version_use_cases" ADD CONSTRAINT "_payload_resources_v_version_use_cases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_version_pros" ADD CONSTRAINT "_payload_resources_v_version_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_version_cons" ADD CONSTRAINT "_payload_resources_v_version_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_version_ai_doc_relationships" ADD CONSTRAINT "_payload_resources_v_version_ai_doc_relationships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_version_ai_resource_relationships" ADD CONSTRAINT "_payload_resources_v_version_ai_resource_relationships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v" ADD CONSTRAINT "_payload_resources_v_parent_id_payload_resources_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v" ADD CONSTRAINT "_payload_resources_v_version_category_id_categories_id_fk" FOREIGN KEY ("version_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v" ADD CONSTRAINT "_payload_resources_v_version_subcategory_id_subcategories_id_fk" FOREIGN KEY ("version_subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v" ADD CONSTRAINT "_payload_resources_v_version_difficulty_id_difficulty_levels_id_fk" FOREIGN KEY ("version_difficulty_id") REFERENCES "public"."difficulty_levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v" ADD CONSTRAINT "_payload_resources_v_version_github_language_id_programming_languages_id_fk" FOREIGN KEY ("version_github_language_id") REFERENCES "public"."programming_languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v" ADD CONSTRAINT "_payload_resources_v_version_discovery_source_id_payload_resource_sources_id_fk" FOREIGN KEY ("version_discovery_source_id") REFERENCES "public"."payload_resource_sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v" ADD CONSTRAINT "_payload_resources_v_version_review_reviewed_by_id_users_id_fk" FOREIGN KEY ("version_review_reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_locales" ADD CONSTRAINT "_payload_resources_v_locales_version_meta_image_id_media_id_fk" FOREIGN KEY ("version_meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_locales" ADD CONSTRAINT "_payload_resources_v_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_rels" ADD CONSTRAINT "_payload_resources_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."_payload_resources_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_rels" ADD CONSTRAINT "_payload_resources_v_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_rels" ADD CONSTRAINT "_payload_resources_v_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "_payload_resources_v_rels" ADD CONSTRAINT "_payload_resources_v_rels_resources_fk" FOREIGN KEY ("payload_resources_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resource_sources" ADD CONSTRAINT "payload_resource_sources_discovery_settings_default_category_id_categories_id_fk" FOREIGN KEY ("discovery_settings_default_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_sources" ADD CONSTRAINT "payload_resource_sources_discovery_settings_default_subcategory_id_subcategories_id_fk" FOREIGN KEY ("discovery_settings_default_subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_sources_rels" ADD CONSTRAINT "payload_resource_sources_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_resource_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resource_sources_rels" ADD CONSTRAINT "payload_resource_sources_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue" ADD CONSTRAINT "payload_resource_discovery_queue_suggested_category_id_categories_id_fk" FOREIGN KEY ("suggested_category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue" ADD CONSTRAINT "payload_resource_discovery_queue_suggested_subcategory_id_subcategories_id_fk" FOREIGN KEY ("suggested_subcategory_id") REFERENCES "public"."subcategories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue" ADD CONSTRAINT "payload_resource_discovery_queue_suggested_difficulty_id_difficulty_levels_id_fk" FOREIGN KEY ("suggested_difficulty_id") REFERENCES "public"."difficulty_levels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue" ADD CONSTRAINT "payload_resource_discovery_queue_source_id_payload_resource_sources_id_fk" FOREIGN KEY ("source_id") REFERENCES "public"."payload_resource_sources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue" ADD CONSTRAINT "payload_resource_discovery_queue_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue" ADD CONSTRAINT "payload_resource_discovery_queue_created_resource_id_payload_resources_id_fk" FOREIGN KEY ("created_resource_id") REFERENCES "public"."payload_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue" ADD CONSTRAINT "payload_resource_discovery_queue_duplicate_of_id_payload_resources_id_fk" FOREIGN KEY ("duplicate_of_id") REFERENCES "public"."payload_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue_rels" ADD CONSTRAINT "payload_resource_discovery_queue_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_resource_discovery_queue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resource_discovery_queue_rels" ADD CONSTRAINT "payload_resource_discovery_queue_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resource_reviews_pros" ADD CONSTRAINT "payload_resource_reviews_pros_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resource_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resource_reviews_cons" ADD CONSTRAINT "payload_resource_reviews_cons_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."payload_resource_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_resource_reviews" ADD CONSTRAINT "payload_resource_reviews_moderated_by_id_users_id_fk" FOREIGN KEY ("moderated_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_authors" ADD CONSTRAINT "payload_resource_authors_resource_id_payload_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."payload_resources"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_resource_authors" ADD CONSTRAINT "payload_resource_authors_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents_ai_relationships" ADD CONSTRAINT "documents_ai_relationships_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents_rewrite_info_source_urls" ADD CONSTRAINT "documents_rewrite_info_source_urls_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_meta_image_id_media_id_fk" FOREIGN KEY ("meta_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "documents_locales" ADD CONSTRAINT "documents_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents_rels" ADD CONSTRAINT "documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents_rels" ADD CONSTRAINT "documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "documents_rels" ADD CONSTRAINT "documents_rels_resources_fk" FOREIGN KEY ("payload_resources_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "document_sections" ADD CONSTRAINT "document_sections_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "document_sections_rels" ADD CONSTRAINT "document_sections_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."document_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "document_sections_rels" ADD CONSTRAINT "document_sections_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "document_sections_rels" ADD CONSTRAINT "document_sections_rels_resources_fk" FOREIGN KEY ("payload_resources_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "code_examples" ADD CONSTRAINT "code_examples_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "code_examples" ADD CONSTRAINT "code_examples_section_id_document_sections_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."document_sections"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "code_examples" ADD CONSTRAINT "code_examples_language_id_programming_languages_id_fk" FOREIGN KEY ("language_id") REFERENCES "public"."programming_languages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "code_examples_rels" ADD CONSTRAINT "code_examples_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."code_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "code_examples_rels" ADD CONSTRAINT "code_examples_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "code_examples_rels" ADD CONSTRAINT "code_examples_rels_resources_fk" FOREIGN KEY ("payload_resources_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "programming_languages_aliases" ADD CONSTRAINT "programming_languages_aliases_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."programming_languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_edit_suggestions" ADD CONSTRAINT "payload_edit_suggestions_reviewed_by_id_users_id_fk" FOREIGN KEY ("reviewed_by_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "translations_placeholders" ADD CONSTRAINT "translations_placeholders_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."translations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "translations_locales" ADD CONSTRAINT "translations_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."translations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_achievements" ADD CONSTRAINT "payload_achievements_tier_id_achievement_tiers_id_fk" FOREIGN KEY ("tier_id") REFERENCES "public"."achievement_tiers"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_achievements" ADD CONSTRAINT "payload_achievements_category_id_achievement_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."achievement_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "badges" ADD CONSTRAINT "badges_achievement_required_id_payload_achievements_id_fk" FOREIGN KEY ("achievement_required_id") REFERENCES "public"."payload_achievements"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_subcategories_fk" FOREIGN KEY ("subcategories_id") REFERENCES "public"."subcategories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_tags_fk" FOREIGN KEY ("tags_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resources_fk" FOREIGN KEY ("payload_resources_id") REFERENCES "public"."payload_resources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resource_sources_fk" FOREIGN KEY ("payload_resource_sources_id") REFERENCES "public"."payload_resource_sources"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resource_discovery_queue_fk" FOREIGN KEY ("payload_resource_discovery_queue_id") REFERENCES "public"."payload_resource_discovery_queue"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resource_reviews_fk" FOREIGN KEY ("payload_resource_reviews_id") REFERENCES "public"."payload_resource_reviews"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_resource_authors_fk" FOREIGN KEY ("payload_resource_authors_id") REFERENCES "public"."payload_resource_authors"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_audit_logs_fk" FOREIGN KEY ("audit_logs_id") REFERENCES "public"."audit_logs"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_documents_fk" FOREIGN KEY ("documents_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_document_sections_fk" FOREIGN KEY ("document_sections_id") REFERENCES "public"."document_sections"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_code_examples_fk" FOREIGN KEY ("code_examples_id") REFERENCES "public"."code_examples"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_difficulty_levels_fk" FOREIGN KEY ("difficulty_levels_id") REFERENCES "public"."difficulty_levels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_programming_languages_fk" FOREIGN KEY ("programming_languages_id") REFERENCES "public"."programming_languages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_edit_suggestions_fk" FOREIGN KEY ("payload_edit_suggestions_id") REFERENCES "public"."payload_edit_suggestions"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_translations_fk" FOREIGN KEY ("translations_id") REFERENCES "public"."translations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_email_templates_fk" FOREIGN KEY ("email_templates_id") REFERENCES "public"."email_templates"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_achievement_tiers_fk" FOREIGN KEY ("achievement_tiers_id") REFERENCES "public"."achievement_tiers"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_achievement_categories_fk" FOREIGN KEY ("achievement_categories_id") REFERENCES "public"."achievement_categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_achievements_fk" FOREIGN KEY ("payload_achievements_id") REFERENCES "public"."payload_achievements"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_badges_fk" FOREIGN KEY ("badges_id") REFERENCES "public"."badges"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings_footer_custom_footer_links" ADD CONSTRAINT "site_settings_footer_custom_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_general_logo_id_media_id_fk" FOREIGN KEY ("general_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings" ADD CONSTRAINT "site_settings_general_favicon_id_media_id_fk" FOREIGN KEY ("general_favicon_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_settings_open_graph_alternate_locales" ADD CONSTRAINT "seo_settings_open_graph_alternate_locales_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_settings_structured_data_same_as" ADD CONSTRAINT "seo_settings_structured_data_same_as_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."seo_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_settings_index_now_search_engines" ADD CONSTRAINT "seo_settings_index_now_search_engines_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."seo_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_open_graph_default_image_id_media_id_fk" FOREIGN KEY ("open_graph_default_image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "seo_settings" ADD CONSTRAINT "seo_settings_structured_data_logo_id_media_id_fk" FOREIGN KEY ("structured_data_logo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "cross_link_settings_category_mappings" ADD CONSTRAINT "cross_link_settings_category_mappings_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."cross_link_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cross_link_settings_rels" ADD CONSTRAINT "cross_link_settings_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."cross_link_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "cross_link_settings_rels" ADD CONSTRAINT "cross_link_settings_rels_categories_fk" FOREIGN KEY ("categories_id") REFERENCES "public"."categories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gamification_settings_levels_perks" ADD CONSTRAINT "gamification_settings_levels_perks_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gamification_settings_levels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gamification_settings_levels" ADD CONSTRAINT "gamification_settings_levels_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gamification_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "gamification_settings_streaks_milestones" ADD CONSTRAINT "gamification_settings_streaks_milestones_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."gamification_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_pipeline_settings_relationships_enabled_types" ADD CONSTRAINT "ai_pipeline_settings_relationships_enabled_types_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ai_pipeline_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_pipeline_settings_documentation_preserve_sections" ADD CONSTRAINT "ai_pipeline_settings_documentation_preserve_sections_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ai_pipeline_settings"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "ai_pipeline_settings_scheduling_preferred_days" ADD CONSTRAINT "ai_pipeline_settings_scheduling_preferred_days_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."ai_pipeline_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_avatar_sizes_avatar_filename_idx" ON "media" USING btree ("sizes_avatar_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_feature_sizes_feature_filename_idx" ON "media" USING btree ("sizes_feature_filename");
  CREATE UNIQUE INDEX "categories_slug_idx" ON "categories" USING btree ("slug");
  CREATE INDEX "categories_updated_at_idx" ON "categories" USING btree ("updated_at");
  CREATE INDEX "categories_created_at_idx" ON "categories" USING btree ("created_at");
  CREATE INDEX "subcategories_category_idx" ON "subcategories" USING btree ("category_id");
  CREATE INDEX "subcategories_updated_at_idx" ON "subcategories" USING btree ("updated_at");
  CREATE INDEX "subcategories_created_at_idx" ON "subcategories" USING btree ("created_at");
  CREATE UNIQUE INDEX "tags_name_idx" ON "tags" USING btree ("name");
  CREATE INDEX "tags_updated_at_idx" ON "tags" USING btree ("updated_at");
  CREATE INDEX "tags_created_at_idx" ON "tags" USING btree ("created_at");
  CREATE INDEX "payload_resources_key_features_order_idx" ON "payload_resources_key_features" USING btree ("_order");
  CREATE INDEX "payload_resources_key_features_parent_id_idx" ON "payload_resources_key_features" USING btree ("_parent_id");
  CREATE INDEX "payload_resources_use_cases_order_idx" ON "payload_resources_use_cases" USING btree ("_order");
  CREATE INDEX "payload_resources_use_cases_parent_id_idx" ON "payload_resources_use_cases" USING btree ("_parent_id");
  CREATE INDEX "payload_resources_pros_order_idx" ON "payload_resources_pros" USING btree ("_order");
  CREATE INDEX "payload_resources_pros_parent_id_idx" ON "payload_resources_pros" USING btree ("_parent_id");
  CREATE INDEX "payload_resources_cons_order_idx" ON "payload_resources_cons" USING btree ("_order");
  CREATE INDEX "payload_resources_cons_parent_id_idx" ON "payload_resources_cons" USING btree ("_parent_id");
  CREATE INDEX "payload_resources_ai_doc_relationships_order_idx" ON "payload_resources_ai_doc_relationships" USING btree ("_order");
  CREATE INDEX "payload_resources_ai_doc_relationships_parent_id_idx" ON "payload_resources_ai_doc_relationships" USING btree ("_parent_id");
  CREATE INDEX "payload_resources_ai_resource_relationships_order_idx" ON "payload_resources_ai_resource_relationships" USING btree ("_order");
  CREATE INDEX "payload_resources_ai_resource_relationships_parent_id_idx" ON "payload_resources_ai_resource_relationships" USING btree ("_parent_id");
  CREATE INDEX "payload_resources_category_idx" ON "payload_resources" USING btree ("category_id");
  CREATE INDEX "payload_resources_subcategory_idx" ON "payload_resources" USING btree ("subcategory_id");
  CREATE INDEX "payload_resources_difficulty_idx" ON "payload_resources" USING btree ("difficulty_id");
  CREATE INDEX "payload_resources_github_github_language_idx" ON "payload_resources" USING btree ("github_language_id");
  CREATE INDEX "payload_resources_discovery_discovery_source_idx" ON "payload_resources" USING btree ("discovery_source_id");
  CREATE INDEX "payload_resources_review_review_reviewed_by_idx" ON "payload_resources" USING btree ("review_reviewed_by_id");
  CREATE INDEX "payload_resources_updated_at_idx" ON "payload_resources" USING btree ("updated_at");
  CREATE INDEX "payload_resources_created_at_idx" ON "payload_resources" USING btree ("created_at");
  CREATE INDEX "payload_resources__status_idx" ON "payload_resources" USING btree ("_status");
  CREATE INDEX "payload_resources_meta_meta_image_idx" ON "payload_resources_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "payload_resources_locales_locale_parent_id_unique" ON "payload_resources_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "payload_resources_rels_order_idx" ON "payload_resources_rels" USING btree ("order");
  CREATE INDEX "payload_resources_rels_parent_idx" ON "payload_resources_rels" USING btree ("parent_id");
  CREATE INDEX "payload_resources_rels_path_idx" ON "payload_resources_rels" USING btree ("path");
  CREATE INDEX "payload_resources_rels_tags_id_idx" ON "payload_resources_rels" USING btree ("tags_id");
  CREATE INDEX "payload_resources_rels_documents_id_idx" ON "payload_resources_rels" USING btree ("documents_id");
  CREATE INDEX "payload_resources_rels_payload_resources_id_idx" ON "payload_resources_rels" USING btree ("payload_resources_id");
  CREATE INDEX "_payload_resources_v_version_key_features_order_idx" ON "_payload_resources_v_version_key_features" USING btree ("_order");
  CREATE INDEX "_payload_resources_v_version_key_features_parent_id_idx" ON "_payload_resources_v_version_key_features" USING btree ("_parent_id");
  CREATE INDEX "_payload_resources_v_version_use_cases_order_idx" ON "_payload_resources_v_version_use_cases" USING btree ("_order");
  CREATE INDEX "_payload_resources_v_version_use_cases_parent_id_idx" ON "_payload_resources_v_version_use_cases" USING btree ("_parent_id");
  CREATE INDEX "_payload_resources_v_version_pros_order_idx" ON "_payload_resources_v_version_pros" USING btree ("_order");
  CREATE INDEX "_payload_resources_v_version_pros_parent_id_idx" ON "_payload_resources_v_version_pros" USING btree ("_parent_id");
  CREATE INDEX "_payload_resources_v_version_cons_order_idx" ON "_payload_resources_v_version_cons" USING btree ("_order");
  CREATE INDEX "_payload_resources_v_version_cons_parent_id_idx" ON "_payload_resources_v_version_cons" USING btree ("_parent_id");
  CREATE INDEX "_payload_resources_v_version_ai_doc_relationships_order_idx" ON "_payload_resources_v_version_ai_doc_relationships" USING btree ("_order");
  CREATE INDEX "_payload_resources_v_version_ai_doc_relationships_parent_id_idx" ON "_payload_resources_v_version_ai_doc_relationships" USING btree ("_parent_id");
  CREATE INDEX "_payload_resources_v_version_ai_resource_relationships_order_idx" ON "_payload_resources_v_version_ai_resource_relationships" USING btree ("_order");
  CREATE INDEX "_payload_resources_v_version_ai_resource_relationships_parent_id_idx" ON "_payload_resources_v_version_ai_resource_relationships" USING btree ("_parent_id");
  CREATE INDEX "_payload_resources_v_parent_idx" ON "_payload_resources_v" USING btree ("parent_id");
  CREATE INDEX "_payload_resources_v_version_version_category_idx" ON "_payload_resources_v" USING btree ("version_category_id");
  CREATE INDEX "_payload_resources_v_version_version_subcategory_idx" ON "_payload_resources_v" USING btree ("version_subcategory_id");
  CREATE INDEX "_payload_resources_v_version_version_difficulty_idx" ON "_payload_resources_v" USING btree ("version_difficulty_id");
  CREATE INDEX "_payload_resources_v_version_github_version_github_langu_idx" ON "_payload_resources_v" USING btree ("version_github_language_id");
  CREATE INDEX "_payload_resources_v_version_discovery_version_discovery_idx" ON "_payload_resources_v" USING btree ("version_discovery_source_id");
  CREATE INDEX "_payload_resources_v_version_review_version_review_revie_idx" ON "_payload_resources_v" USING btree ("version_review_reviewed_by_id");
  CREATE INDEX "_payload_resources_v_version_version_updated_at_idx" ON "_payload_resources_v" USING btree ("version_updated_at");
  CREATE INDEX "_payload_resources_v_version_version_created_at_idx" ON "_payload_resources_v" USING btree ("version_created_at");
  CREATE INDEX "_payload_resources_v_version_version__status_idx" ON "_payload_resources_v" USING btree ("version__status");
  CREATE INDEX "_payload_resources_v_created_at_idx" ON "_payload_resources_v" USING btree ("created_at");
  CREATE INDEX "_payload_resources_v_updated_at_idx" ON "_payload_resources_v" USING btree ("updated_at");
  CREATE INDEX "_payload_resources_v_snapshot_idx" ON "_payload_resources_v" USING btree ("snapshot");
  CREATE INDEX "_payload_resources_v_published_locale_idx" ON "_payload_resources_v" USING btree ("published_locale");
  CREATE INDEX "_payload_resources_v_latest_idx" ON "_payload_resources_v" USING btree ("latest");
  CREATE INDEX "_payload_resources_v_version_meta_version_meta_image_idx" ON "_payload_resources_v_locales" USING btree ("version_meta_image_id","_locale");
  CREATE UNIQUE INDEX "_payload_resources_v_locales_locale_parent_id_unique" ON "_payload_resources_v_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "_payload_resources_v_rels_order_idx" ON "_payload_resources_v_rels" USING btree ("order");
  CREATE INDEX "_payload_resources_v_rels_parent_idx" ON "_payload_resources_v_rels" USING btree ("parent_id");
  CREATE INDEX "_payload_resources_v_rels_path_idx" ON "_payload_resources_v_rels" USING btree ("path");
  CREATE INDEX "_payload_resources_v_rels_tags_id_idx" ON "_payload_resources_v_rels" USING btree ("tags_id");
  CREATE INDEX "_payload_resources_v_rels_documents_id_idx" ON "_payload_resources_v_rels" USING btree ("documents_id");
  CREATE INDEX "_payload_resources_v_rels_payload_resources_id_idx" ON "_payload_resources_v_rels" USING btree ("payload_resources_id");
  CREATE INDEX "payload_resource_sources_discovery_settings_discovery_se_idx" ON "payload_resource_sources" USING btree ("discovery_settings_default_category_id");
  CREATE INDEX "payload_resource_sources_discovery_settings_discovery__1_idx" ON "payload_resource_sources" USING btree ("discovery_settings_default_subcategory_id");
  CREATE INDEX "payload_resource_sources_updated_at_idx" ON "payload_resource_sources" USING btree ("updated_at");
  CREATE INDEX "payload_resource_sources_created_at_idx" ON "payload_resource_sources" USING btree ("created_at");
  CREATE INDEX "payload_resource_sources_rels_order_idx" ON "payload_resource_sources_rels" USING btree ("order");
  CREATE INDEX "payload_resource_sources_rels_parent_idx" ON "payload_resource_sources_rels" USING btree ("parent_id");
  CREATE INDEX "payload_resource_sources_rels_path_idx" ON "payload_resource_sources_rels" USING btree ("path");
  CREATE INDEX "payload_resource_sources_rels_tags_id_idx" ON "payload_resource_sources_rels" USING btree ("tags_id");
  CREATE INDEX "payload_resource_discovery_queue_suggested_category_idx" ON "payload_resource_discovery_queue" USING btree ("suggested_category_id");
  CREATE INDEX "payload_resource_discovery_queue_suggested_subcategory_idx" ON "payload_resource_discovery_queue" USING btree ("suggested_subcategory_id");
  CREATE INDEX "payload_resource_discovery_queue_suggested_difficulty_idx" ON "payload_resource_discovery_queue" USING btree ("suggested_difficulty_id");
  CREATE INDEX "payload_resource_discovery_queue_source_idx" ON "payload_resource_discovery_queue" USING btree ("source_id");
  CREATE INDEX "payload_resource_discovery_queue_reviewed_by_idx" ON "payload_resource_discovery_queue" USING btree ("reviewed_by_id");
  CREATE INDEX "payload_resource_discovery_queue_created_resource_idx" ON "payload_resource_discovery_queue" USING btree ("created_resource_id");
  CREATE INDEX "payload_resource_discovery_queue_duplicate_of_idx" ON "payload_resource_discovery_queue" USING btree ("duplicate_of_id");
  CREATE INDEX "payload_resource_discovery_queue_updated_at_idx" ON "payload_resource_discovery_queue" USING btree ("updated_at");
  CREATE INDEX "payload_resource_discovery_queue_created_at_idx" ON "payload_resource_discovery_queue" USING btree ("created_at");
  CREATE INDEX "payload_resource_discovery_queue_rels_order_idx" ON "payload_resource_discovery_queue_rels" USING btree ("order");
  CREATE INDEX "payload_resource_discovery_queue_rels_parent_idx" ON "payload_resource_discovery_queue_rels" USING btree ("parent_id");
  CREATE INDEX "payload_resource_discovery_queue_rels_path_idx" ON "payload_resource_discovery_queue_rels" USING btree ("path");
  CREATE INDEX "payload_resource_discovery_queue_rels_tags_id_idx" ON "payload_resource_discovery_queue_rels" USING btree ("tags_id");
  CREATE INDEX "payload_resource_reviews_pros_order_idx" ON "payload_resource_reviews_pros" USING btree ("_order");
  CREATE INDEX "payload_resource_reviews_pros_parent_id_idx" ON "payload_resource_reviews_pros" USING btree ("_parent_id");
  CREATE INDEX "payload_resource_reviews_cons_order_idx" ON "payload_resource_reviews_cons" USING btree ("_order");
  CREATE INDEX "payload_resource_reviews_cons_parent_id_idx" ON "payload_resource_reviews_cons" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "payload_resource_reviews_supabase_id_idx" ON "payload_resource_reviews" USING btree ("supabase_id");
  CREATE INDEX "payload_resource_reviews_moderated_by_idx" ON "payload_resource_reviews" USING btree ("moderated_by_id");
  CREATE INDEX "payload_resource_reviews_updated_at_idx" ON "payload_resource_reviews" USING btree ("updated_at");
  CREATE INDEX "payload_resource_reviews_created_at_idx" ON "payload_resource_reviews" USING btree ("created_at");
  CREATE INDEX "payload_resource_authors_resource_idx" ON "payload_resource_authors" USING btree ("resource_id");
  CREATE INDEX "payload_resource_authors_user_idx" ON "payload_resource_authors" USING btree ("user_id");
  CREATE INDEX "payload_resource_authors_updated_at_idx" ON "payload_resource_authors" USING btree ("updated_at");
  CREATE INDEX "payload_resource_authors_created_at_idx" ON "payload_resource_authors" USING btree ("created_at");
  CREATE INDEX "audit_logs_user_idx" ON "audit_logs" USING btree ("user_id");
  CREATE INDEX "audit_logs_updated_at_idx" ON "audit_logs" USING btree ("updated_at");
  CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs" USING btree ("created_at");
  CREATE INDEX "action_idx" ON "audit_logs" USING btree ("action");
  CREATE INDEX "user_idx" ON "audit_logs" USING btree ("user_id");
  CREATE INDEX "collection_idx" ON "audit_logs" USING btree ("collection");
  CREATE INDEX "status_idx" ON "audit_logs" USING btree ("status");
  CREATE INDEX "action_user_idx" ON "audit_logs" USING btree ("action","user_id");
  CREATE INDEX "documents_ai_relationships_order_idx" ON "documents_ai_relationships" USING btree ("_order");
  CREATE INDEX "documents_ai_relationships_parent_id_idx" ON "documents_ai_relationships" USING btree ("_parent_id");
  CREATE INDEX "documents_rewrite_info_source_urls_order_idx" ON "documents_rewrite_info_source_urls" USING btree ("_order");
  CREATE INDEX "documents_rewrite_info_source_urls_parent_id_idx" ON "documents_rewrite_info_source_urls" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "documents_slug_idx" ON "documents" USING btree ("slug");
  CREATE INDEX "documents_updated_at_idx" ON "documents" USING btree ("updated_at");
  CREATE INDEX "documents_created_at_idx" ON "documents" USING btree ("created_at");
  CREATE INDEX "documents_meta_meta_image_idx" ON "documents_locales" USING btree ("meta_image_id","_locale");
  CREATE UNIQUE INDEX "documents_locales_locale_parent_id_unique" ON "documents_locales" USING btree ("_locale","_parent_id");
  CREATE INDEX "documents_rels_order_idx" ON "documents_rels" USING btree ("order");
  CREATE INDEX "documents_rels_parent_idx" ON "documents_rels" USING btree ("parent_id");
  CREATE INDEX "documents_rels_path_idx" ON "documents_rels" USING btree ("path");
  CREATE INDEX "documents_rels_tags_id_idx" ON "documents_rels" USING btree ("tags_id");
  CREATE INDEX "documents_rels_payload_resources_id_idx" ON "documents_rels" USING btree ("payload_resources_id");
  CREATE INDEX "document_sections_document_idx" ON "document_sections" USING btree ("document_id");
  CREATE INDEX "document_sections_updated_at_idx" ON "document_sections" USING btree ("updated_at");
  CREATE INDEX "document_sections_created_at_idx" ON "document_sections" USING btree ("created_at");
  CREATE INDEX "document_sections_rels_order_idx" ON "document_sections_rels" USING btree ("order");
  CREATE INDEX "document_sections_rels_parent_idx" ON "document_sections_rels" USING btree ("parent_id");
  CREATE INDEX "document_sections_rels_path_idx" ON "document_sections_rels" USING btree ("path");
  CREATE INDEX "document_sections_rels_tags_id_idx" ON "document_sections_rels" USING btree ("tags_id");
  CREATE INDEX "document_sections_rels_payload_resources_id_idx" ON "document_sections_rels" USING btree ("payload_resources_id");
  CREATE INDEX "code_examples_document_idx" ON "code_examples" USING btree ("document_id");
  CREATE INDEX "code_examples_section_idx" ON "code_examples" USING btree ("section_id");
  CREATE INDEX "code_examples_language_idx" ON "code_examples" USING btree ("language_id");
  CREATE INDEX "code_examples_updated_at_idx" ON "code_examples" USING btree ("updated_at");
  CREATE INDEX "code_examples_created_at_idx" ON "code_examples" USING btree ("created_at");
  CREATE INDEX "code_examples_rels_order_idx" ON "code_examples_rels" USING btree ("order");
  CREATE INDEX "code_examples_rels_parent_idx" ON "code_examples_rels" USING btree ("parent_id");
  CREATE INDEX "code_examples_rels_path_idx" ON "code_examples_rels" USING btree ("path");
  CREATE INDEX "code_examples_rels_tags_id_idx" ON "code_examples_rels" USING btree ("tags_id");
  CREATE INDEX "code_examples_rels_payload_resources_id_idx" ON "code_examples_rels" USING btree ("payload_resources_id");
  CREATE UNIQUE INDEX "difficulty_levels_slug_idx" ON "difficulty_levels" USING btree ("slug");
  CREATE INDEX "difficulty_levels_updated_at_idx" ON "difficulty_levels" USING btree ("updated_at");
  CREATE INDEX "difficulty_levels_created_at_idx" ON "difficulty_levels" USING btree ("created_at");
  CREATE INDEX "programming_languages_aliases_order_idx" ON "programming_languages_aliases" USING btree ("_order");
  CREATE INDEX "programming_languages_aliases_parent_id_idx" ON "programming_languages_aliases" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "programming_languages_slug_idx" ON "programming_languages" USING btree ("slug");
  CREATE INDEX "programming_languages_updated_at_idx" ON "programming_languages" USING btree ("updated_at");
  CREATE INDEX "programming_languages_created_at_idx" ON "programming_languages" USING btree ("created_at");
  CREATE INDEX "payload_edit_suggestions_reviewed_by_idx" ON "payload_edit_suggestions" USING btree ("reviewed_by_id");
  CREATE INDEX "payload_edit_suggestions_updated_at_idx" ON "payload_edit_suggestions" USING btree ("updated_at");
  CREATE INDEX "payload_edit_suggestions_created_at_idx" ON "payload_edit_suggestions" USING btree ("created_at");
  CREATE INDEX "translations_placeholders_order_idx" ON "translations_placeholders" USING btree ("_order");
  CREATE INDEX "translations_placeholders_parent_id_idx" ON "translations_placeholders" USING btree ("_parent_id");
  CREATE INDEX "translations_updated_at_idx" ON "translations" USING btree ("updated_at");
  CREATE INDEX "translations_created_at_idx" ON "translations" USING btree ("created_at");
  CREATE UNIQUE INDEX "translations_locales_locale_parent_id_unique" ON "translations_locales" USING btree ("_locale","_parent_id");
  CREATE UNIQUE INDEX "email_templates_slug_idx" ON "email_templates" USING btree ("slug");
  CREATE INDEX "email_templates_updated_at_idx" ON "email_templates" USING btree ("updated_at");
  CREATE INDEX "email_templates_created_at_idx" ON "email_templates" USING btree ("created_at");
  CREATE UNIQUE INDEX "achievement_tiers_slug_idx" ON "achievement_tiers" USING btree ("slug");
  CREATE INDEX "achievement_tiers_updated_at_idx" ON "achievement_tiers" USING btree ("updated_at");
  CREATE INDEX "achievement_tiers_created_at_idx" ON "achievement_tiers" USING btree ("created_at");
  CREATE UNIQUE INDEX "achievement_categories_slug_idx" ON "achievement_categories" USING btree ("slug");
  CREATE INDEX "achievement_categories_updated_at_idx" ON "achievement_categories" USING btree ("updated_at");
  CREATE INDEX "achievement_categories_created_at_idx" ON "achievement_categories" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_achievements_slug_idx" ON "payload_achievements" USING btree ("slug");
  CREATE INDEX "payload_achievements_tier_idx" ON "payload_achievements" USING btree ("tier_id");
  CREATE INDEX "payload_achievements_category_idx" ON "payload_achievements" USING btree ("category_id");
  CREATE INDEX "payload_achievements_updated_at_idx" ON "payload_achievements" USING btree ("updated_at");
  CREATE INDEX "payload_achievements_created_at_idx" ON "payload_achievements" USING btree ("created_at");
  CREATE UNIQUE INDEX "badges_slug_idx" ON "badges" USING btree ("slug");
  CREATE INDEX "badges_achievement_required_idx" ON "badges" USING btree ("achievement_required_id");
  CREATE INDEX "badges_updated_at_idx" ON "badges" USING btree ("updated_at");
  CREATE INDEX "badges_created_at_idx" ON "badges" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("categories_id");
  CREATE INDEX "payload_locked_documents_rels_subcategories_id_idx" ON "payload_locked_documents_rels" USING btree ("subcategories_id");
  CREATE INDEX "payload_locked_documents_rels_tags_id_idx" ON "payload_locked_documents_rels" USING btree ("tags_id");
  CREATE INDEX "payload_locked_documents_rels_payload_resources_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_resources_id");
  CREATE INDEX "payload_locked_documents_rels_payload_resource_sources_i_idx" ON "payload_locked_documents_rels" USING btree ("payload_resource_sources_id");
  CREATE INDEX "payload_locked_documents_rels_payload_resource_discovery_idx" ON "payload_locked_documents_rels" USING btree ("payload_resource_discovery_queue_id");
  CREATE INDEX "payload_locked_documents_rels_payload_resource_reviews_i_idx" ON "payload_locked_documents_rels" USING btree ("payload_resource_reviews_id");
  CREATE INDEX "payload_locked_documents_rels_payload_resource_authors_i_idx" ON "payload_locked_documents_rels" USING btree ("payload_resource_authors_id");
  CREATE INDEX "payload_locked_documents_rels_audit_logs_id_idx" ON "payload_locked_documents_rels" USING btree ("audit_logs_id");
  CREATE INDEX "payload_locked_documents_rels_documents_id_idx" ON "payload_locked_documents_rels" USING btree ("documents_id");
  CREATE INDEX "payload_locked_documents_rels_document_sections_id_idx" ON "payload_locked_documents_rels" USING btree ("document_sections_id");
  CREATE INDEX "payload_locked_documents_rels_code_examples_id_idx" ON "payload_locked_documents_rels" USING btree ("code_examples_id");
  CREATE INDEX "payload_locked_documents_rels_difficulty_levels_id_idx" ON "payload_locked_documents_rels" USING btree ("difficulty_levels_id");
  CREATE INDEX "payload_locked_documents_rels_programming_languages_id_idx" ON "payload_locked_documents_rels" USING btree ("programming_languages_id");
  CREATE INDEX "payload_locked_documents_rels_payload_edit_suggestions_i_idx" ON "payload_locked_documents_rels" USING btree ("payload_edit_suggestions_id");
  CREATE INDEX "payload_locked_documents_rels_translations_id_idx" ON "payload_locked_documents_rels" USING btree ("translations_id");
  CREATE INDEX "payload_locked_documents_rels_email_templates_id_idx" ON "payload_locked_documents_rels" USING btree ("email_templates_id");
  CREATE INDEX "payload_locked_documents_rels_achievement_tiers_id_idx" ON "payload_locked_documents_rels" USING btree ("achievement_tiers_id");
  CREATE INDEX "payload_locked_documents_rels_achievement_categories_id_idx" ON "payload_locked_documents_rels" USING btree ("achievement_categories_id");
  CREATE INDEX "payload_locked_documents_rels_payload_achievements_id_idx" ON "payload_locked_documents_rels" USING btree ("payload_achievements_id");
  CREATE INDEX "payload_locked_documents_rels_badges_id_idx" ON "payload_locked_documents_rels" USING btree ("badges_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "site_settings_footer_custom_footer_links_order_idx" ON "site_settings_footer_custom_footer_links" USING btree ("_order");
  CREATE INDEX "site_settings_footer_custom_footer_links_parent_id_idx" ON "site_settings_footer_custom_footer_links" USING btree ("_parent_id");
  CREATE INDEX "site_settings_general_general_logo_idx" ON "site_settings" USING btree ("general_logo_id");
  CREATE INDEX "site_settings_general_general_favicon_idx" ON "site_settings" USING btree ("general_favicon_id");
  CREATE INDEX "seo_settings_open_graph_alternate_locales_order_idx" ON "seo_settings_open_graph_alternate_locales" USING btree ("_order");
  CREATE INDEX "seo_settings_open_graph_alternate_locales_parent_id_idx" ON "seo_settings_open_graph_alternate_locales" USING btree ("_parent_id");
  CREATE INDEX "seo_settings_structured_data_same_as_order_idx" ON "seo_settings_structured_data_same_as" USING btree ("_order");
  CREATE INDEX "seo_settings_structured_data_same_as_parent_id_idx" ON "seo_settings_structured_data_same_as" USING btree ("_parent_id");
  CREATE INDEX "seo_settings_index_now_search_engines_order_idx" ON "seo_settings_index_now_search_engines" USING btree ("order");
  CREATE INDEX "seo_settings_index_now_search_engines_parent_idx" ON "seo_settings_index_now_search_engines" USING btree ("parent_id");
  CREATE INDEX "seo_settings_open_graph_open_graph_default_image_idx" ON "seo_settings" USING btree ("open_graph_default_image_id");
  CREATE INDEX "seo_settings_structured_data_structured_data_logo_idx" ON "seo_settings" USING btree ("structured_data_logo_id");
  CREATE INDEX "cross_link_settings_category_mappings_order_idx" ON "cross_link_settings_category_mappings" USING btree ("_order");
  CREATE INDEX "cross_link_settings_category_mappings_parent_id_idx" ON "cross_link_settings_category_mappings" USING btree ("_parent_id");
  CREATE INDEX "cross_link_settings_rels_order_idx" ON "cross_link_settings_rels" USING btree ("order");
  CREATE INDEX "cross_link_settings_rels_parent_idx" ON "cross_link_settings_rels" USING btree ("parent_id");
  CREATE INDEX "cross_link_settings_rels_path_idx" ON "cross_link_settings_rels" USING btree ("path");
  CREATE INDEX "cross_link_settings_rels_categories_id_idx" ON "cross_link_settings_rels" USING btree ("categories_id");
  CREATE INDEX "gamification_settings_levels_perks_order_idx" ON "gamification_settings_levels_perks" USING btree ("_order");
  CREATE INDEX "gamification_settings_levels_perks_parent_id_idx" ON "gamification_settings_levels_perks" USING btree ("_parent_id");
  CREATE INDEX "gamification_settings_levels_order_idx" ON "gamification_settings_levels" USING btree ("_order");
  CREATE INDEX "gamification_settings_levels_parent_id_idx" ON "gamification_settings_levels" USING btree ("_parent_id");
  CREATE INDEX "gamification_settings_streaks_milestones_order_idx" ON "gamification_settings_streaks_milestones" USING btree ("_order");
  CREATE INDEX "gamification_settings_streaks_milestones_parent_id_idx" ON "gamification_settings_streaks_milestones" USING btree ("_parent_id");
  CREATE INDEX "ai_pipeline_settings_relationships_enabled_types_order_idx" ON "ai_pipeline_settings_relationships_enabled_types" USING btree ("order");
  CREATE INDEX "ai_pipeline_settings_relationships_enabled_types_parent_idx" ON "ai_pipeline_settings_relationships_enabled_types" USING btree ("parent_id");
  CREATE INDEX "ai_pipeline_settings_documentation_preserve_sections_order_idx" ON "ai_pipeline_settings_documentation_preserve_sections" USING btree ("order");
  CREATE INDEX "ai_pipeline_settings_documentation_preserve_sections_parent_idx" ON "ai_pipeline_settings_documentation_preserve_sections" USING btree ("parent_id");
  CREATE INDEX "ai_pipeline_settings_scheduling_preferred_days_order_idx" ON "ai_pipeline_settings_scheduling_preferred_days" USING btree ("order");
  CREATE INDEX "ai_pipeline_settings_scheduling_preferred_days_parent_idx" ON "ai_pipeline_settings_scheduling_preferred_days" USING btree ("parent_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "categories" CASCADE;
  DROP TABLE "subcategories" CASCADE;
  DROP TABLE "tags" CASCADE;
  DROP TABLE "payload_resources_key_features" CASCADE;
  DROP TABLE "payload_resources_use_cases" CASCADE;
  DROP TABLE "payload_resources_pros" CASCADE;
  DROP TABLE "payload_resources_cons" CASCADE;
  DROP TABLE "payload_resources_ai_doc_relationships" CASCADE;
  DROP TABLE "payload_resources_ai_resource_relationships" CASCADE;
  DROP TABLE "payload_resources" CASCADE;
  DROP TABLE "payload_resources_locales" CASCADE;
  DROP TABLE "payload_resources_rels" CASCADE;
  DROP TABLE "_payload_resources_v_version_key_features" CASCADE;
  DROP TABLE "_payload_resources_v_version_use_cases" CASCADE;
  DROP TABLE "_payload_resources_v_version_pros" CASCADE;
  DROP TABLE "_payload_resources_v_version_cons" CASCADE;
  DROP TABLE "_payload_resources_v_version_ai_doc_relationships" CASCADE;
  DROP TABLE "_payload_resources_v_version_ai_resource_relationships" CASCADE;
  DROP TABLE "_payload_resources_v" CASCADE;
  DROP TABLE "_payload_resources_v_locales" CASCADE;
  DROP TABLE "_payload_resources_v_rels" CASCADE;
  DROP TABLE "payload_resource_sources" CASCADE;
  DROP TABLE "payload_resource_sources_rels" CASCADE;
  DROP TABLE "payload_resource_discovery_queue" CASCADE;
  DROP TABLE "payload_resource_discovery_queue_rels" CASCADE;
  DROP TABLE "payload_resource_reviews_pros" CASCADE;
  DROP TABLE "payload_resource_reviews_cons" CASCADE;
  DROP TABLE "payload_resource_reviews" CASCADE;
  DROP TABLE "payload_resource_authors" CASCADE;
  DROP TABLE "audit_logs" CASCADE;
  DROP TABLE "documents_ai_relationships" CASCADE;
  DROP TABLE "documents_rewrite_info_source_urls" CASCADE;
  DROP TABLE "documents" CASCADE;
  DROP TABLE "documents_locales" CASCADE;
  DROP TABLE "documents_rels" CASCADE;
  DROP TABLE "document_sections" CASCADE;
  DROP TABLE "document_sections_rels" CASCADE;
  DROP TABLE "code_examples" CASCADE;
  DROP TABLE "code_examples_rels" CASCADE;
  DROP TABLE "difficulty_levels" CASCADE;
  DROP TABLE "programming_languages_aliases" CASCADE;
  DROP TABLE "programming_languages" CASCADE;
  DROP TABLE "payload_edit_suggestions" CASCADE;
  DROP TABLE "translations_placeholders" CASCADE;
  DROP TABLE "translations" CASCADE;
  DROP TABLE "translations_locales" CASCADE;
  DROP TABLE "email_templates" CASCADE;
  DROP TABLE "achievement_tiers" CASCADE;
  DROP TABLE "achievement_categories" CASCADE;
  DROP TABLE "payload_achievements" CASCADE;
  DROP TABLE "badges" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "site_settings_footer_custom_footer_links" CASCADE;
  DROP TABLE "site_settings" CASCADE;
  DROP TABLE "seo_settings_open_graph_alternate_locales" CASCADE;
  DROP TABLE "seo_settings_structured_data_same_as" CASCADE;
  DROP TABLE "seo_settings_index_now_search_engines" CASCADE;
  DROP TABLE "seo_settings" CASCADE;
  DROP TABLE "cross_link_settings_category_mappings" CASCADE;
  DROP TABLE "cross_link_settings" CASCADE;
  DROP TABLE "cross_link_settings_rels" CASCADE;
  DROP TABLE "gamification_settings_levels_perks" CASCADE;
  DROP TABLE "gamification_settings_levels" CASCADE;
  DROP TABLE "gamification_settings_streaks_milestones" CASCADE;
  DROP TABLE "gamification_settings" CASCADE;
  DROP TABLE "ai_pipeline_settings_relationships_enabled_types" CASCADE;
  DROP TABLE "ai_pipeline_settings_documentation_preserve_sections" CASCADE;
  DROP TABLE "ai_pipeline_settings_scheduling_preferred_days" CASCADE;
  DROP TABLE "ai_pipeline_settings" CASCADE;
  DROP TYPE "public"."_locales";
  DROP TYPE "public"."enum_users_role";
  DROP TYPE "public"."enum_media_category";
  DROP TYPE "public"."enum_categories_color";
  DROP TYPE "public"."res_doc_rel_type";
  DROP TYPE "public"."res_res_rel_type";
  DROP TYPE "public"."enum_payload_resources_publish_status";
  DROP TYPE "public"."enum_payload_resources_enhancement_status";
  DROP TYPE "public"."enum_payload_resources_resource_type";
  DROP TYPE "public"."enum_payload_resources_featured_reason";
  DROP TYPE "public"."enum_payload_resources_discovery_discovered_by";
  DROP TYPE "public"."enum_payload_resources_status";
  DROP TYPE "public"."enum__payload_resources_v_version_publish_status";
  DROP TYPE "public"."enum__payload_resources_v_version_enhancement_status";
  DROP TYPE "public"."enum__payload_resources_v_version_resource_type";
  DROP TYPE "public"."enum__payload_resources_v_version_featured_reason";
  DROP TYPE "public"."enum__payload_resources_v_version_discovery_discovered_by";
  DROP TYPE "public"."enum__payload_resources_v_version_status";
  DROP TYPE "public"."enum__payload_resources_v_published_locale";
  DROP TYPE "public"."enum_payload_resource_sources_type";
  DROP TYPE "public"."enum_payload_resource_sources_scan_frequency";
  DROP TYPE "public"."enum_payload_resource_sources_last_scan_status";
  DROP TYPE "public"."enum_payload_resource_discovery_queue_suggested_status";
  DROP TYPE "public"."enum_payload_resource_discovery_queue_package_registry";
  DROP TYPE "public"."enum_payload_resource_discovery_queue_status";
  DROP TYPE "public"."enum_payload_resource_discovery_queue_priority";
  DROP TYPE "public"."enum_payload_resource_reviews_status";
  DROP TYPE "public"."enum_payload_resource_reviews_rejection_reason";
  DROP TYPE "public"."enum_payload_resource_authors_role";
  DROP TYPE "public"."enum_audit_logs_action";
  DROP TYPE "public"."enum_audit_logs_status";
  DROP TYPE "public"."enum_documents_ai_relationships_relationship_type";
  DROP TYPE "public"."enum_documents_display_mode";
  DROP TYPE "public"."enum_documents_analysis_status";
  DROP TYPE "public"."enum_documents_rewrite_info_rewrite_status";
  DROP TYPE "public"."enum_document_sections_display_mode";
  DROP TYPE "public"."enum_difficulty_levels_color";
  DROP TYPE "public"."enum_payload_edit_suggestions_target_type";
  DROP TYPE "public"."enum_payload_edit_suggestions_status";
  DROP TYPE "public"."enum_payload_edit_suggestions_priority";
  DROP TYPE "public"."enum_payload_edit_suggestions_submitter_type";
  DROP TYPE "public"."enum_translations_namespace";
  DROP TYPE "public"."enum_email_templates_slug";
  DROP TYPE "public"."enum_email_templates_status";
  DROP TYPE "public"."enum_achievement_tiers_animation";
  DROP TYPE "public"."enum_payload_achievements_condition_type";
  DROP TYPE "public"."enum_payload_achievements_metric";
  DROP TYPE "public"."enum_payload_achievements_compound_logic";
  DROP TYPE "public"."enum_payload_achievements_notification_sound";
  DROP TYPE "public"."enum_badges_type";
  DROP TYPE "public"."enum_badges_role_required";
  DROP TYPE "public"."enum_badges_donor_tier_required";
  DROP TYPE "public"."enum_site_settings_notifications_digest_frequency";
  DROP TYPE "public"."enum_site_settings_announcement_type";
  DROP TYPE "public"."enum_seo_settings_index_now_search_engines";
  DROP TYPE "public"."enum_seo_settings_open_graph_type";
  DROP TYPE "public"."enum_seo_settings_twitter_card_type";
  DROP TYPE "public"."enum_seo_settings_structured_data_organization_type";
  DROP TYPE "public"."enum_seo_settings_robots_sitemap_change_freq";
  DROP TYPE "public"."enum_seo_settings_advanced_www_redirect";
  DROP TYPE "public"."enum_cross_link_settings_display_defaults_default_display_mode";
  DROP TYPE "public"."enum_ai_pipeline_settings_relationships_enabled_types";
  DROP TYPE "public"."enum_ai_pipeline_settings_documentation_preserve_sections";
  DROP TYPE "public"."enum_ai_pipeline_settings_scheduling_preferred_days";
  DROP TYPE "public"."enum_ai_pipeline_settings_documentation_auto_rewrite_schedule";
  DROP TYPE "public"."enum_ai_pipeline_settings_model_config_preferred_model";
  DROP TYPE "public"."enum_ai_pipeline_settings_model_config_fallback_model";`)
}
