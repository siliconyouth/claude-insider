export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      _payload_resources_v: {
        Row: {
          created_at: string
          id: number
          latest: boolean | null
          parent_id: number | null
          published_locale:
            | Database["public"]["Enums"]["enum__payload_resources_v_published_locale"]
            | null
          snapshot: boolean | null
          updated_at: string
          version__status:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_status"]
            | null
          version_added_date: string | null
          version_ai_overview: Json | null
          version_ai_summary: string | null
          version_category_id: number | null
          version_content_hash: string | null
          version_created_at: string | null
          version_description: string | null
          version_difficulty_id: number | null
          version_discovery_ai_confidence_score: number | null
          version_discovery_ai_notes: string | null
          version_discovery_discovered_at: string | null
          version_discovery_discovered_by:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_discovery_discovered_by"]
            | null
          version_discovery_source_id: number | null
          version_enhancement_metadata_ai_enhanced_at: string | null
          version_enhancement_metadata_ai_model: string | null
          version_enhancement_metadata_enhancement_notes: string | null
          version_enhancement_status:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_enhancement_status"]
            | null
          version_featured: boolean | null
          version_featured_reason:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_featured_reason"]
            | null
          version_github_forks: number | null
          version_github_language_id: number | null
          version_github_last_updated: string | null
          version_github_owner: string | null
          version_github_repo: string | null
          version_github_stars: number | null
          version_last_verified: string | null
          version_meta_keywords: string | null
          version_meta_no_index: boolean | null
          version_namespace: string | null
          version_publish_status:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_publish_status"]
            | null
          version_relationship_count: number | null
          version_resource_type:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_resource_type"]
            | null
          version_review_rejection_reason: string | null
          version_review_review_notes: string | null
          version_review_reviewed_at: string | null
          version_review_reviewed_by_id: number | null
          version_subcategory_id: number | null
          version_title: string | null
          version_updated_at: string | null
          version_url: string | null
          version_version: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          latest?: boolean | null
          parent_id?: number | null
          published_locale?:
            | Database["public"]["Enums"]["enum__payload_resources_v_published_locale"]
            | null
          snapshot?: boolean | null
          updated_at?: string
          version__status?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_status"]
            | null
          version_added_date?: string | null
          version_ai_overview?: Json | null
          version_ai_summary?: string | null
          version_category_id?: number | null
          version_content_hash?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_difficulty_id?: number | null
          version_discovery_ai_confidence_score?: number | null
          version_discovery_ai_notes?: string | null
          version_discovery_discovered_at?: string | null
          version_discovery_discovered_by?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_discovery_discovered_by"]
            | null
          version_discovery_source_id?: number | null
          version_enhancement_metadata_ai_enhanced_at?: string | null
          version_enhancement_metadata_ai_model?: string | null
          version_enhancement_metadata_enhancement_notes?: string | null
          version_enhancement_status?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_enhancement_status"]
            | null
          version_featured?: boolean | null
          version_featured_reason?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_featured_reason"]
            | null
          version_github_forks?: number | null
          version_github_language_id?: number | null
          version_github_last_updated?: string | null
          version_github_owner?: string | null
          version_github_repo?: string | null
          version_github_stars?: number | null
          version_last_verified?: string | null
          version_meta_keywords?: string | null
          version_meta_no_index?: boolean | null
          version_namespace?: string | null
          version_publish_status?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_publish_status"]
            | null
          version_relationship_count?: number | null
          version_resource_type?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_resource_type"]
            | null
          version_review_rejection_reason?: string | null
          version_review_review_notes?: string | null
          version_review_reviewed_at?: string | null
          version_review_reviewed_by_id?: number | null
          version_subcategory_id?: number | null
          version_title?: string | null
          version_updated_at?: string | null
          version_url?: string | null
          version_version?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          latest?: boolean | null
          parent_id?: number | null
          published_locale?:
            | Database["public"]["Enums"]["enum__payload_resources_v_published_locale"]
            | null
          snapshot?: boolean | null
          updated_at?: string
          version__status?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_status"]
            | null
          version_added_date?: string | null
          version_ai_overview?: Json | null
          version_ai_summary?: string | null
          version_category_id?: number | null
          version_content_hash?: string | null
          version_created_at?: string | null
          version_description?: string | null
          version_difficulty_id?: number | null
          version_discovery_ai_confidence_score?: number | null
          version_discovery_ai_notes?: string | null
          version_discovery_discovered_at?: string | null
          version_discovery_discovered_by?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_discovery_discovered_by"]
            | null
          version_discovery_source_id?: number | null
          version_enhancement_metadata_ai_enhanced_at?: string | null
          version_enhancement_metadata_ai_model?: string | null
          version_enhancement_metadata_enhancement_notes?: string | null
          version_enhancement_status?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_enhancement_status"]
            | null
          version_featured?: boolean | null
          version_featured_reason?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_featured_reason"]
            | null
          version_github_forks?: number | null
          version_github_language_id?: number | null
          version_github_last_updated?: string | null
          version_github_owner?: string | null
          version_github_repo?: string | null
          version_github_stars?: number | null
          version_last_verified?: string | null
          version_meta_keywords?: string | null
          version_meta_no_index?: boolean | null
          version_namespace?: string | null
          version_publish_status?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_publish_status"]
            | null
          version_relationship_count?: number | null
          version_resource_type?:
            | Database["public"]["Enums"]["enum__payload_resources_v_version_resource_type"]
            | null
          version_review_rejection_reason?: string | null
          version_review_review_notes?: string | null
          version_review_reviewed_at?: string | null
          version_review_reviewed_by_id?: number | null
          version_subcategory_id?: number | null
          version_title?: string | null
          version_updated_at?: string | null
          version_url?: string | null
          version_version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_parent_id_payload_resources_id_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_version_category_id_categories_id_fk"
            columns: ["version_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_version_difficulty_id_difficulty_levels_id"
            columns: ["version_difficulty_id"]
            isOneToOne: false
            referencedRelation: "difficulty_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_version_discovery_source_id_payload_resour"
            columns: ["version_discovery_source_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_version_github_language_id_programming_lan"
            columns: ["version_github_language_id"]
            isOneToOne: false
            referencedRelation: "programming_languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_version_review_reviewed_by_id_users_id_fk"
            columns: ["version_review_reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_version_subcategory_id_subcategories_id_fk"
            columns: ["version_subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_locales: {
        Row: {
          _locale: unknown[]
          _parent_id: number
          id: number
          version_meta_description: string | null
          version_meta_image_id: number | null
          version_meta_title: string | null
        }
        Insert: {
          _locale: unknown[]
          _parent_id: number
          id?: number
          version_meta_description?: string | null
          version_meta_image_id?: number | null
          version_meta_title?: string | null
        }
        Update: {
          _locale?: unknown[]
          _parent_id?: number
          id?: number
          version_meta_description?: string | null
          version_meta_image_id?: number | null
          version_meta_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_locales_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_locales_version_meta_image_id_media_id_fk"
            columns: ["version_meta_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_rels: {
        Row: {
          documents_id: number | null
          id: number
          order: number | null
          parent_id: number
          path: string
          payload_resources_id: number | null
          tags_id: number | null
        }
        Insert: {
          documents_id?: number | null
          id?: number
          order?: number | null
          parent_id: number
          path: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Update: {
          documents_id?: number | null
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_rels_documents_fk"
            columns: ["documents_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_rels_resources_fk"
            columns: ["payload_resources_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "_payload_resources_v_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_version_ai_doc_relationships: {
        Row: {
          _order: number
          _parent_id: number
          _uuid: string | null
          confidence: number | null
          doc_slug: string | null
          doc_title: string | null
          id: number
          is_approved: boolean | null
          reasoning: string | null
          relationship_type:
            | Database["public"]["Enums"]["res_doc_rel_type"]
            | null
        }
        Insert: {
          _order: number
          _parent_id: number
          _uuid?: string | null
          confidence?: number | null
          doc_slug?: string | null
          doc_title?: string | null
          id?: number
          is_approved?: boolean | null
          reasoning?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["res_doc_rel_type"]
            | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          _uuid?: string | null
          confidence?: number | null
          doc_slug?: string | null
          doc_title?: string | null
          id?: number
          is_approved?: boolean | null
          reasoning?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["res_doc_rel_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_version_ai_doc_relationships_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_version_ai_resource_relationships: {
        Row: {
          _order: number
          _parent_id: number
          _uuid: string | null
          confidence: number | null
          id: number
          relationship_type:
            | Database["public"]["Enums"]["res_res_rel_type"]
            | null
          resource_id: string | null
          resource_title: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          _uuid?: string | null
          confidence?: number | null
          id?: number
          relationship_type?:
            | Database["public"]["Enums"]["res_res_rel_type"]
            | null
          resource_id?: string | null
          resource_title?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          _uuid?: string | null
          confidence?: number | null
          id?: number
          relationship_type?:
            | Database["public"]["Enums"]["res_res_rel_type"]
            | null
          resource_id?: string | null
          resource_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_version_ai_resource_relationships_parent_i"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_version_cons: {
        Row: {
          _order: number
          _parent_id: number
          _uuid: string | null
          con: string | null
          id: number
        }
        Insert: {
          _order: number
          _parent_id: number
          _uuid?: string | null
          con?: string | null
          id?: number
        }
        Update: {
          _order?: number
          _parent_id?: number
          _uuid?: string | null
          con?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_version_cons_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_version_key_features: {
        Row: {
          _order: number
          _parent_id: number
          _uuid: string | null
          description: string | null
          feature: string | null
          id: number
        }
        Insert: {
          _order: number
          _parent_id: number
          _uuid?: string | null
          description?: string | null
          feature?: string | null
          id?: number
        }
        Update: {
          _order?: number
          _parent_id?: number
          _uuid?: string | null
          description?: string | null
          feature?: string | null
          id?: number
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_version_key_features_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_version_pros: {
        Row: {
          _order: number
          _parent_id: number
          _uuid: string | null
          id: number
          pro: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          _uuid?: string | null
          id?: number
          pro?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          _uuid?: string | null
          id?: number
          pro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_version_pros_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
        ]
      }
      _payload_resources_v_version_use_cases: {
        Row: {
          _order: number
          _parent_id: number
          _uuid: string | null
          description: string | null
          id: number
          use_case: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          _uuid?: string | null
          description?: string | null
          id?: number
          use_case?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          _uuid?: string | null
          description?: string | null
          id?: number
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "_payload_resources_v_version_use_cases_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "_payload_resources_v"
            referencedColumns: ["id"]
          },
        ]
      }
      account: {
        Row: {
          accessToken: string | null
          accessTokenExpiresAt: string | null
          accountId: string
          createdAt: string
          id: string
          idToken: string | null
          password: string | null
          providerId: string
          refreshToken: string | null
          refreshTokenExpiresAt: string | null
          scope: string | null
          updatedAt: string
          userId: string
        }
        Insert: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId: string
          createdAt?: string
          id: string
          idToken?: string | null
          password?: string | null
          providerId: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId: string
        }
        Update: {
          accessToken?: string | null
          accessTokenExpiresAt?: string | null
          accountId?: string
          createdAt?: string
          id?: string
          idToken?: string | null
          password?: string | null
          providerId?: string
          refreshToken?: string | null
          refreshTokenExpiresAt?: string | null
          scope?: string | null
          updatedAt?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "account_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          icon: string
          id: number
          name: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon: string
          id?: number
          name: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          icon?: string
          id?: number
          name?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      achievement_progress: {
        Row: {
          achievement_slug: string
          current_value: number | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          achievement_slug: string
          current_value?: number | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          achievement_slug?: string
          current_value?: number | null
          id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "achievement_progress_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      achievement_tiers: {
        Row: {
          animation: Database["public"]["Enums"]["enum_achievement_tiers_animation"]
          color_gradient_from: string
          color_gradient_to: string
          color_gradient_via: string | null
          created_at: string
          description: string | null
          glow_color: string | null
          id: number
          name: string
          point_multiplier: number
          slug: string
          sort_order: number
          text_color: string | null
          updated_at: string
        }
        Insert: {
          animation?: Database["public"]["Enums"]["enum_achievement_tiers_animation"]
          color_gradient_from?: string
          color_gradient_to?: string
          color_gradient_via?: string | null
          created_at?: string
          description?: string | null
          glow_color?: string | null
          id?: number
          name: string
          point_multiplier?: number
          slug: string
          sort_order?: number
          text_color?: string | null
          updated_at?: string
        }
        Update: {
          animation?: Database["public"]["Enums"]["enum_achievement_tiers_animation"]
          color_gradient_from?: string
          color_gradient_to?: string
          color_gradient_via?: string | null
          created_at?: string
          description?: string | null
          glow_color?: string | null
          id?: number
          name?: string
          point_multiplier?: number
          slug?: string
          sort_order?: number
          text_color?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon: string
          id: string
          is_hidden: boolean | null
          name: string
          points: number
          requirement_type: string
          requirement_value: number
          slug: string
          tier: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon: string
          id?: string
          is_hidden?: boolean | null
          name: string
          points?: number
          requirement_type: string
          requirement_value?: number
          slug: string
          tier?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon?: string
          id?: string
          is_hidden?: boolean | null
          name?: string
          points?: number
          requirement_type?: string
          requirement_value?: number
          slug?: string
          tier?: string | null
        }
        Relationships: []
      }
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          target_id: string | null
          target_type: string | null
          user_agent: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          target_id?: string | null
          target_type?: string | null
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notification_deliveries: {
        Row: {
          created_at: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          error: string | null
          id: string
          in_app_sent: boolean | null
          in_app_sent_at: string | null
          notification_id: string
          push_sent: boolean | null
          push_sent_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          error?: string | null
          id?: string
          in_app_sent?: boolean | null
          in_app_sent_at?: string | null
          notification_id: string
          push_sent?: boolean | null
          push_sent_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          error?: string | null
          id?: string
          in_app_sent?: boolean | null
          in_app_sent_at?: string | null
          notification_id?: string
          push_sent?: boolean | null
          push_sent_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admin_notification_deliveries_notification_id_fkey"
            columns: ["notification_id"]
            isOneToOne: false
            referencedRelation: "admin_notifications"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_notification_deliveries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_notifications: {
        Row: {
          created_at: string | null
          created_by: string | null
          failed_deliveries: number | null
          id: string
          last_error: string | null
          link: string | null
          message: string | null
          scheduled_at: string | null
          send_email: boolean | null
          send_in_app: boolean | null
          send_push: boolean | null
          sent_at: string | null
          status: string
          successful_deliveries: number | null
          target_roles: string[] | null
          target_type: string
          target_user_ids: string[] | null
          title: string
          total_recipients: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          failed_deliveries?: number | null
          id?: string
          last_error?: string | null
          link?: string | null
          message?: string | null
          scheduled_at?: string | null
          send_email?: boolean | null
          send_in_app?: boolean | null
          send_push?: boolean | null
          sent_at?: string | null
          status?: string
          successful_deliveries?: number | null
          target_roles?: string[] | null
          target_type?: string
          target_user_ids?: string[] | null
          title: string
          total_recipients?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          failed_deliveries?: number | null
          id?: string
          last_error?: string | null
          link?: string | null
          message?: string | null
          scheduled_at?: string | null
          send_email?: boolean | null
          send_in_app?: boolean | null
          send_push?: boolean | null
          sent_at?: string | null
          status?: string
          successful_deliveries?: number | null
          target_roles?: string[] | null
          target_type?: string
          target_user_ids?: string[] | null
          title?: string
          total_recipients?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_notifications_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_conversations: {
        Row: {
          context_id: string | null
          context_type: string | null
          created_at: string | null
          id: string
          is_starred: boolean | null
          message_count: number | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_starred?: boolean | null
          message_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          context_id?: string | null
          context_type?: string | null
          created_at?: string | null
          id?: string
          is_starred?: boolean | null
          message_count?: number | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          role: string
          tokens_used: number | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          role: string
          tokens_used?: number | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          role?: string
          tokens_used?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "ai_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_operation_queue: {
        Row: {
          cli_command: string | null
          completed_at: string | null
          error_message: string | null
          id: string
          notes: string | null
          operation_type: string
          priority: number | null
          requested_at: string | null
          requested_by: string | null
          result: Json | null
          started_at: string | null
          status: string | null
          target_id: string
          target_type: string
        }
        Insert: {
          cli_command?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          operation_type: string
          priority?: number | null
          requested_at?: string | null
          requested_by?: string | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          target_id: string
          target_type: string
        }
        Update: {
          cli_command?: string | null
          completed_at?: string | null
          error_message?: string | null
          id?: string
          notes?: string | null
          operation_type?: string
          priority?: number | null
          requested_at?: string | null
          requested_by?: string | null
          result?: Json | null
          started_at?: string | null
          status?: string | null
          target_id?: string
          target_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_operation_queue_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pipeline_settings: {
        Row: {
          cli_commands_analyze_relationships_command: string | null
          cli_commands_bulk_analyze_command: string | null
          cli_commands_bulk_enhance_command: string | null
          cli_commands_enhance_resource_command: string | null
          cli_commands_rewrite_doc_command: string | null
          cost_tracking_cost_per_input_token: number | null
          cost_tracking_cost_per_output_token: number | null
          cost_tracking_enabled: boolean | null
          cost_tracking_monthly_budget_u_s_d: number | null
          cost_tracking_pause_on_budget_exceeded: boolean | null
          cost_tracking_warning_threshold_percent: number | null
          created_at: string | null
          documentation_auto_rewrite_schedule:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_documentation_auto_rewrite_schedule"]
            | null
          documentation_max_sources_per_doc: number | null
          documentation_require_source_urls: boolean | null
          enhancement_auto_enhance_new_resources: boolean | null
          enhancement_max_features_count: number | null
          enhancement_min_features_count: number | null
          enhancement_required_fields_require_key_features: boolean | null
          enhancement_required_fields_require_pros_and_cons: boolean | null
          enhancement_required_fields_require_summary: boolean | null
          enhancement_required_fields_require_use_cases: boolean | null
          id: number
          model_config_fallback_model:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_model_config_fallback_model"]
            | null
          model_config_max_tokens_per_operation: number | null
          model_config_preferred_model:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_model_config_preferred_model"]
            | null
          model_config_temperature: number | null
          operation_tracking_keep_completed_days: number | null
          operation_tracking_keep_failed_days: number | null
          operation_tracking_notify_on_completion: boolean | null
          operation_tracking_notify_on_failure: boolean | null
          rate_limits_cooldown_minutes: number | null
          rate_limits_max_concurrent_operations: number | null
          rate_limits_max_operations_per_day: number | null
          rate_limits_max_operations_per_hour: number | null
          rate_limits_prioritize_manual_requests: boolean | null
          relationships_auto_analyze_new_content: boolean | null
          relationships_max_relationships_per_doc: number
          relationships_min_confidence: number
          relationships_reanalyze_on_content_change: boolean | null
          scheduling_enable_scheduled_operations: boolean | null
          scheduling_max_batch_size: number | null
          scheduling_preferred_time_u_t_c: string | null
          updated_at: string | null
        }
        Insert: {
          cli_commands_analyze_relationships_command?: string | null
          cli_commands_bulk_analyze_command?: string | null
          cli_commands_bulk_enhance_command?: string | null
          cli_commands_enhance_resource_command?: string | null
          cli_commands_rewrite_doc_command?: string | null
          cost_tracking_cost_per_input_token?: number | null
          cost_tracking_cost_per_output_token?: number | null
          cost_tracking_enabled?: boolean | null
          cost_tracking_monthly_budget_u_s_d?: number | null
          cost_tracking_pause_on_budget_exceeded?: boolean | null
          cost_tracking_warning_threshold_percent?: number | null
          created_at?: string | null
          documentation_auto_rewrite_schedule?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_documentation_auto_rewrite_schedule"]
            | null
          documentation_max_sources_per_doc?: number | null
          documentation_require_source_urls?: boolean | null
          enhancement_auto_enhance_new_resources?: boolean | null
          enhancement_max_features_count?: number | null
          enhancement_min_features_count?: number | null
          enhancement_required_fields_require_key_features?: boolean | null
          enhancement_required_fields_require_pros_and_cons?: boolean | null
          enhancement_required_fields_require_summary?: boolean | null
          enhancement_required_fields_require_use_cases?: boolean | null
          id?: number
          model_config_fallback_model?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_model_config_fallback_model"]
            | null
          model_config_max_tokens_per_operation?: number | null
          model_config_preferred_model?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_model_config_preferred_model"]
            | null
          model_config_temperature?: number | null
          operation_tracking_keep_completed_days?: number | null
          operation_tracking_keep_failed_days?: number | null
          operation_tracking_notify_on_completion?: boolean | null
          operation_tracking_notify_on_failure?: boolean | null
          rate_limits_cooldown_minutes?: number | null
          rate_limits_max_concurrent_operations?: number | null
          rate_limits_max_operations_per_day?: number | null
          rate_limits_max_operations_per_hour?: number | null
          rate_limits_prioritize_manual_requests?: boolean | null
          relationships_auto_analyze_new_content?: boolean | null
          relationships_max_relationships_per_doc?: number
          relationships_min_confidence?: number
          relationships_reanalyze_on_content_change?: boolean | null
          scheduling_enable_scheduled_operations?: boolean | null
          scheduling_max_batch_size?: number | null
          scheduling_preferred_time_u_t_c?: string | null
          updated_at?: string | null
        }
        Update: {
          cli_commands_analyze_relationships_command?: string | null
          cli_commands_bulk_analyze_command?: string | null
          cli_commands_bulk_enhance_command?: string | null
          cli_commands_enhance_resource_command?: string | null
          cli_commands_rewrite_doc_command?: string | null
          cost_tracking_cost_per_input_token?: number | null
          cost_tracking_cost_per_output_token?: number | null
          cost_tracking_enabled?: boolean | null
          cost_tracking_monthly_budget_u_s_d?: number | null
          cost_tracking_pause_on_budget_exceeded?: boolean | null
          cost_tracking_warning_threshold_percent?: number | null
          created_at?: string | null
          documentation_auto_rewrite_schedule?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_documentation_auto_rewrite_schedule"]
            | null
          documentation_max_sources_per_doc?: number | null
          documentation_require_source_urls?: boolean | null
          enhancement_auto_enhance_new_resources?: boolean | null
          enhancement_max_features_count?: number | null
          enhancement_min_features_count?: number | null
          enhancement_required_fields_require_key_features?: boolean | null
          enhancement_required_fields_require_pros_and_cons?: boolean | null
          enhancement_required_fields_require_summary?: boolean | null
          enhancement_required_fields_require_use_cases?: boolean | null
          id?: number
          model_config_fallback_model?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_model_config_fallback_model"]
            | null
          model_config_max_tokens_per_operation?: number | null
          model_config_preferred_model?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_model_config_preferred_model"]
            | null
          model_config_temperature?: number | null
          operation_tracking_keep_completed_days?: number | null
          operation_tracking_keep_failed_days?: number | null
          operation_tracking_notify_on_completion?: boolean | null
          operation_tracking_notify_on_failure?: boolean | null
          rate_limits_cooldown_minutes?: number | null
          rate_limits_max_concurrent_operations?: number | null
          rate_limits_max_operations_per_day?: number | null
          rate_limits_max_operations_per_hour?: number | null
          rate_limits_prioritize_manual_requests?: boolean | null
          relationships_auto_analyze_new_content?: boolean | null
          relationships_max_relationships_per_doc?: number
          relationships_min_confidence?: number
          relationships_reanalyze_on_content_change?: boolean | null
          scheduling_enable_scheduled_operations?: boolean | null
          scheduling_max_batch_size?: number | null
          scheduling_preferred_time_u_t_c?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_pipeline_settings_documentation_preserve_sections: {
        Row: {
          id: number
          order: number
          parent_id: number
          value:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_documentation_preserve_sections"]
            | null
        }
        Insert: {
          id?: number
          order: number
          parent_id: number
          value?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_documentation_preserve_sections"]
            | null
        }
        Update: {
          id?: number
          order?: number
          parent_id?: number
          value?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_documentation_preserve_sections"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_pipeline_settings_documentation_preserve_sections_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ai_pipeline_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pipeline_settings_relationships_enabled_types: {
        Row: {
          id: number
          order: number
          parent_id: number
          value:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_relationships_enabled_types"]
            | null
        }
        Insert: {
          id?: number
          order: number
          parent_id: number
          value?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_relationships_enabled_types"]
            | null
        }
        Update: {
          id?: number
          order?: number
          parent_id?: number
          value?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_relationships_enabled_types"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_pipeline_settings_relationships_enabled_types_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ai_pipeline_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_pipeline_settings_scheduling_preferred_days: {
        Row: {
          id: number
          order: number
          parent_id: number
          value:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_scheduling_preferred_days"]
            | null
        }
        Insert: {
          id?: number
          order: number
          parent_id: number
          value?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_scheduling_preferred_days"]
            | null
        }
        Update: {
          id?: number
          order?: number
          parent_id?: number
          value?:
            | Database["public"]["Enums"]["enum_ai_pipeline_settings_scheduling_preferred_days"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_pipeline_settings_scheduling_preferred_days_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "ai_pipeline_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      api_key_usage_logs: {
        Row: {
          api_key_id: string
          created_at: string | null
          feature: string
          id: string
          input_tokens: number | null
          model: string
          output_tokens: number | null
          user_id: string
        }
        Insert: {
          api_key_id: string
          created_at?: string | null
          feature: string
          id?: string
          input_tokens?: number | null
          model: string
          output_tokens?: number | null
          user_id: string
        }
        Update: {
          api_key_id?: string
          created_at?: string | null
          feature?: string
          id?: string
          input_tokens?: number | null
          model?: string
          output_tokens?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_usage_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "user_api_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_key_usage_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_settings: {
        Row: {
          assistant_name: string | null
          auto_speak: boolean | null
          compact_mode: boolean | null
          created_at: string | null
          enable_code_highlighting: boolean | null
          enable_voice_input: boolean | null
          id: string
          selected_voice_id: string | null
          show_conversation_history: boolean | null
          show_suggested_questions: boolean | null
          sound_theme: string | null
          speech_rate: number | null
          updated_at: string | null
          user_display_name: string | null
          user_id: string
        }
        Insert: {
          assistant_name?: string | null
          auto_speak?: boolean | null
          compact_mode?: boolean | null
          created_at?: string | null
          enable_code_highlighting?: boolean | null
          enable_voice_input?: boolean | null
          id?: string
          selected_voice_id?: string | null
          show_conversation_history?: boolean | null
          show_suggested_questions?: boolean | null
          sound_theme?: string | null
          speech_rate?: number | null
          updated_at?: string | null
          user_display_name?: string | null
          user_id: string
        }
        Update: {
          assistant_name?: string | null
          auto_speak?: boolean | null
          compact_mode?: boolean | null
          created_at?: string | null
          enable_code_highlighting?: boolean | null
          enable_voice_input?: boolean | null
          id?: string
          selected_voice_id?: string | null
          show_conversation_history?: boolean | null
          show_suggested_questions?: boolean | null
          sound_theme?: string | null
          speech_rate?: number | null
          updated_at?: string | null
          user_display_name?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "assistant_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: Database["public"]["Enums"]["enum_audit_logs_action"]
          changes: Json | null
          collection: string | null
          context_affected_count: number | null
          context_notes: string | null
          context_reason: string | null
          context_source_url: string | null
          created_at: string
          document_id: string | null
          error_code: string | null
          error_message: string | null
          error_stack: string | null
          id: number
          metadata_duration: number | null
          metadata_endpoint: string | null
          metadata_ip_address: string | null
          metadata_method: string | null
          metadata_status_code: number | null
          metadata_user_agent: string | null
          status: Database["public"]["Enums"]["enum_audit_logs_status"]
          updated_at: string
          user_id: number
          user_snapshot_email: string | null
          user_snapshot_name: string | null
          user_snapshot_role: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["enum_audit_logs_action"]
          changes?: Json | null
          collection?: string | null
          context_affected_count?: number | null
          context_notes?: string | null
          context_reason?: string | null
          context_source_url?: string | null
          created_at?: string
          document_id?: string | null
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: number
          metadata_duration?: number | null
          metadata_endpoint?: string | null
          metadata_ip_address?: string | null
          metadata_method?: string | null
          metadata_status_code?: number | null
          metadata_user_agent?: string | null
          status?: Database["public"]["Enums"]["enum_audit_logs_status"]
          updated_at?: string
          user_id: number
          user_snapshot_email?: string | null
          user_snapshot_name?: string | null
          user_snapshot_role?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["enum_audit_logs_action"]
          changes?: Json | null
          collection?: string | null
          context_affected_count?: number | null
          context_notes?: string | null
          context_reason?: string | null
          context_source_url?: string | null
          created_at?: string
          document_id?: string | null
          error_code?: string | null
          error_message?: string | null
          error_stack?: string | null
          id?: number
          metadata_duration?: number | null
          metadata_endpoint?: string | null
          metadata_ip_address?: string | null
          metadata_method?: string | null
          metadata_status_code?: number | null
          metadata_user_agent?: string | null
          status?: Database["public"]["Enums"]["enum_audit_logs_status"]
          updated_at?: string
          user_id?: number
          user_snapshot_email?: string | null
          user_snapshot_name?: string | null
          user_snapshot_role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      badges: {
        Row: {
          achievement_required_id: number | null
          bg_color: string | null
          border_color: string | null
          created_at: string
          description: string | null
          donor_tier_required:
            | Database["public"]["Enums"]["enum_badges_donor_tier_required"]
            | null
          gradient_enabled: boolean | null
          gradient_from: string | null
          gradient_to: string | null
          gradient_via: string | null
          icon: string
          id: number
          is_active: boolean | null
          manual_only: boolean | null
          name: string
          priority: number
          role_required:
            | Database["public"]["Enums"]["enum_badges_role_required"]
            | null
          slug: string
          text_color: string | null
          type: Database["public"]["Enums"]["enum_badges_type"]
          updated_at: string
        }
        Insert: {
          achievement_required_id?: number | null
          bg_color?: string | null
          border_color?: string | null
          created_at?: string
          description?: string | null
          donor_tier_required?:
            | Database["public"]["Enums"]["enum_badges_donor_tier_required"]
            | null
          gradient_enabled?: boolean | null
          gradient_from?: string | null
          gradient_to?: string | null
          gradient_via?: string | null
          icon: string
          id?: number
          is_active?: boolean | null
          manual_only?: boolean | null
          name: string
          priority?: number
          role_required?:
            | Database["public"]["Enums"]["enum_badges_role_required"]
            | null
          slug: string
          text_color?: string | null
          type: Database["public"]["Enums"]["enum_badges_type"]
          updated_at?: string
        }
        Update: {
          achievement_required_id?: number | null
          bg_color?: string | null
          border_color?: string | null
          created_at?: string
          description?: string | null
          donor_tier_required?:
            | Database["public"]["Enums"]["enum_badges_donor_tier_required"]
            | null
          gradient_enabled?: boolean | null
          gradient_from?: string | null
          gradient_to?: string | null
          gradient_via?: string | null
          icon?: string
          id?: number
          is_active?: boolean | null
          manual_only?: boolean | null
          name?: string
          priority?: number
          role_required?:
            | Database["public"]["Enums"]["enum_badges_role_required"]
            | null
          slug?: string
          text_color?: string | null
          type?: Database["public"]["Enums"]["enum_badges_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "badges_achievement_required_id_payload_achievements_id_fk"
            columns: ["achievement_required_id"]
            isOneToOne: false
            referencedRelation: "payload_achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      ban_appeals: {
        Row: {
          additional_context: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          reason: string
          response_message: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          additional_context?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason: string
          response_message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          additional_context?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          reason?: string
          response_message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ban_appeals_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ban_appeals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ban_history: {
        Row: {
          action: string
          appeal_id: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          performed_by: string | null
          reason: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          appeal_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          appeal_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          performed_by?: string | null
          reason?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ban_history_appeal_id_fkey"
            columns: ["appeal_id"]
            isOneToOne: false
            referencedRelation: "ban_appeals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ban_history_performed_by_fkey"
            columns: ["performed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ban_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      beta_applications: {
        Row: {
          created_at: string | null
          experience_level: string
          id: string
          motivation: string
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          use_case: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          experience_level: string
          id?: string
          motivation: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          use_case?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          experience_level?: string
          id?: string
          motivation?: string
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          use_case?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "beta_applications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "beta_applications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: Database["public"]["Enums"]["enum_categories_color"]
          created_at: string
          description: string
          icon: string
          id: number
          name: string
          short_name: string
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["enum_categories_color"]
          created_at?: string
          description: string
          icon: string
          id?: number
          name: string
          short_name: string
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          color?: Database["public"]["Enums"]["enum_categories_color"]
          created_at?: string
          description?: string
          icon?: string
          id?: number
          name?: string
          short_name?: string
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      code_examples: {
        Row: {
          code_id: string
          code_preview: string | null
          created_at: string
          document_id: number
          filename: string | null
          id: number
          language_id: number | null
          metadata_line_count: number | null
          metadata_patterns: Json | null
          order: number
          section_id: number | null
          title: string | null
          updated_at: string
        }
        Insert: {
          code_id: string
          code_preview?: string | null
          created_at?: string
          document_id: number
          filename?: string | null
          id?: number
          language_id?: number | null
          metadata_line_count?: number | null
          metadata_patterns?: Json | null
          order: number
          section_id?: number | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          code_id?: string
          code_preview?: string | null
          created_at?: string
          document_id?: number
          filename?: string | null
          id?: number
          language_id?: number | null
          metadata_line_count?: number | null
          metadata_patterns?: Json | null
          order?: number
          section_id?: number | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "code_examples_document_id_documents_id_fk"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_examples_language_id_programming_languages_id_fk"
            columns: ["language_id"]
            isOneToOne: false
            referencedRelation: "programming_languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_examples_section_id_document_sections_id_fk"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
        ]
      }
      code_examples_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: number
          path: string
          payload_resources_id: number | null
          tags_id: number | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: number
          path: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "code_examples_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "code_examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_examples_rels_resources_fk"
            columns: ["payload_resources_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "code_examples_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      collection_items: {
        Row: {
          added_at: string | null
          collection_id: string
          id: string
          notes: string | null
          position: number | null
          resource_id: string
          resource_type: string
        }
        Insert: {
          added_at?: string | null
          collection_id: string
          id?: string
          notes?: string | null
          position?: number | null
          resource_id: string
          resource_type: string
        }
        Update: {
          added_at?: string | null
          collection_id?: string
          id?: string
          notes?: string | null
          position?: number | null
          resource_id?: string
          resource_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_items_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          cover_image_url: string | null
          created_at: string | null
          description: string | null
          featured_order: number | null
          id: string
          is_featured: boolean | null
          is_public: boolean | null
          item_count: number | null
          name: string
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          item_count?: number | null
          name: string
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string | null
          description?: string | null
          featured_order?: number | null
          id?: string
          is_featured?: boolean | null
          is_public?: boolean | null
          item_count?: number | null
          name?: string
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_votes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
          vote_type: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
          vote_type: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
          vote_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_votes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comment_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          content: string
          created_at: string | null
          downvotes: number | null
          edited_at: string | null
          id: string
          is_edited: boolean | null
          moderated_at: string | null
          moderation_notes: string | null
          moderator_id: string | null
          parent_id: string | null
          resource_id: string
          resource_type: string
          status: string | null
          updated_at: string | null
          upvotes: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          downvotes?: number | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          parent_id?: string | null
          resource_id: string
          resource_type: string
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          downvotes?: number | null
          edited_at?: string | null
          id?: string
          is_edited?: boolean | null
          moderated_at?: string | null
          moderation_notes?: string | null
          moderator_id?: string | null
          parent_id?: string | null
          resource_id?: string
          resource_type?: string
          status?: string | null
          updated_at?: string | null
          upvotes?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_moderated_by_fkey"
            columns: ["moderator_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_link_settings: {
        Row: {
          auto_matching_enabled: boolean | null
          auto_matching_max_auto_matches: number
          auto_matching_min_score_threshold: number
          auto_matching_min_tag_overlap: number
          created_at: string | null
          display_defaults_default_display_mode: Database["public"]["Enums"]["enum_cross_link_settings_display_defaults_default_display_mode"]
          display_defaults_hover_delay_ms: number
          display_defaults_max_cards_per_section: number | null
          display_defaults_show_resource_cards_after_section: boolean | null
          display_defaults_show_resource_cards_at_document_end: boolean | null
          features_enable_bidirectional_links: boolean | null
          features_enable_code_block_links: boolean | null
          features_enable_hover_cards: boolean | null
          features_enable_inline_cards: boolean | null
          features_enable_section_links: boolean | null
          id: number
          scoring_weights_category_mapping_weight: number
          scoring_weights_tag_overlap_weight: number
          scoring_weights_title_similarity_weight: number
          updated_at: string | null
        }
        Insert: {
          auto_matching_enabled?: boolean | null
          auto_matching_max_auto_matches?: number
          auto_matching_min_score_threshold?: number
          auto_matching_min_tag_overlap?: number
          created_at?: string | null
          display_defaults_default_display_mode?: Database["public"]["Enums"]["enum_cross_link_settings_display_defaults_default_display_mode"]
          display_defaults_hover_delay_ms?: number
          display_defaults_max_cards_per_section?: number | null
          display_defaults_show_resource_cards_after_section?: boolean | null
          display_defaults_show_resource_cards_at_document_end?: boolean | null
          features_enable_bidirectional_links?: boolean | null
          features_enable_code_block_links?: boolean | null
          features_enable_hover_cards?: boolean | null
          features_enable_inline_cards?: boolean | null
          features_enable_section_links?: boolean | null
          id?: number
          scoring_weights_category_mapping_weight?: number
          scoring_weights_tag_overlap_weight?: number
          scoring_weights_title_similarity_weight?: number
          updated_at?: string | null
        }
        Update: {
          auto_matching_enabled?: boolean | null
          auto_matching_max_auto_matches?: number
          auto_matching_min_score_threshold?: number
          auto_matching_min_tag_overlap?: number
          created_at?: string | null
          display_defaults_default_display_mode?: Database["public"]["Enums"]["enum_cross_link_settings_display_defaults_default_display_mode"]
          display_defaults_hover_delay_ms?: number
          display_defaults_max_cards_per_section?: number | null
          display_defaults_show_resource_cards_after_section?: boolean | null
          display_defaults_show_resource_cards_at_document_end?: boolean | null
          features_enable_bidirectional_links?: boolean | null
          features_enable_code_block_links?: boolean | null
          features_enable_hover_cards?: boolean | null
          features_enable_inline_cards?: boolean | null
          features_enable_section_links?: boolean | null
          id?: number
          scoring_weights_category_mapping_weight?: number
          scoring_weights_tag_overlap_weight?: number
          scoring_weights_title_similarity_weight?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      cross_link_settings_category_mappings: {
        Row: {
          _order: number
          _parent_id: number
          boost_weight: number
          doc_category: string
          id: string
        }
        Insert: {
          _order: number
          _parent_id: number
          boost_weight?: number
          doc_category: string
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          boost_weight?: number
          doc_category?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_link_settings_category_mappings_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "cross_link_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      cross_link_settings_rels: {
        Row: {
          categories_id: number | null
          id: number
          order: number | null
          parent_id: number
          path: string
        }
        Insert: {
          categories_id?: number | null
          id?: number
          order?: number | null
          parent_id: number
          path: string
        }
        Update: {
          categories_id?: number | null
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
        }
        Relationships: [
          {
            foreignKeyName: "cross_link_settings_rels_categories_fk"
            columns: ["categories_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cross_link_settings_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "cross_link_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      device_keys: {
        Row: {
          created_at: string
          cross_sign_signature: string | null
          device_id: string
          device_name: string | null
          device_type: string | null
          id: string
          identity_key: string
          is_verified: boolean | null
          last_seen_at: string
          signed_prekey: string
          signed_prekey_id: number
          signed_prekey_signature: string
          signing_key: string
          user_id: string
          verification_method: string | null
          verified_at: string | null
          verified_by_device_id: string | null
          verified_by_user_id: string | null
        }
        Insert: {
          created_at?: string
          cross_sign_signature?: string | null
          device_id: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          identity_key: string
          is_verified?: boolean | null
          last_seen_at?: string
          signed_prekey?: string
          signed_prekey_id?: number
          signed_prekey_signature?: string
          signing_key: string
          user_id: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by_device_id?: string | null
          verified_by_user_id?: string | null
        }
        Update: {
          created_at?: string
          cross_sign_signature?: string | null
          device_id?: string
          device_name?: string | null
          device_type?: string | null
          id?: string
          identity_key?: string
          is_verified?: boolean | null
          last_seen_at?: string
          signed_prekey?: string
          signed_prekey_id?: number
          signed_prekey_signature?: string
          signing_key?: string
          user_id?: string
          verification_method?: string | null
          verified_at?: string | null
          verified_by_device_id?: string | null
          verified_by_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "device_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "device_keys_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      difficulty_levels: {
        Row: {
          color: Database["public"]["Enums"]["enum_difficulty_levels_color"]
          created_at: string
          description: string | null
          icon: string | null
          id: number
          name: string
          resource_count: number | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: Database["public"]["Enums"]["enum_difficulty_levels_color"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          resource_count?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: Database["public"]["Enums"]["enum_difficulty_levels_color"]
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          resource_count?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      dm_conversations: {
        Row: {
          avatar_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          max_participants: number | null
          name: string | null
          type: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          max_participants?: number | null
          name?: string | null
          type?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          max_participants?: number | null
          name?: string | null
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_conversations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_group_invitations: {
        Row: {
          conversation_id: string
          created_at: string
          expires_at: string | null
          id: string
          invitee_id: string
          inviter_id: string
          message: string | null
          responded_at: string | null
          status: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_id: string
          inviter_id: string
          message?: string | null
          responded_at?: string | null
          status?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          invitee_id?: string
          inviter_id?: string
          message?: string | null
          responded_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_group_invitations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_group_invitations_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_group_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_group_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_message_read_receipts: {
        Row: {
          id: string
          message_id: string
          read_at: string
          user_id: string
        }
        Insert: {
          id?: string
          message_id: string
          read_at?: string
          user_id: string
        }
        Update: {
          id?: string
          message_id?: string
          read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_message_read_receipts_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_message_read_receipts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_messages: {
        Row: {
          ai_response_to: string | null
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string | null
          edited_at: string | null
          encrypted_content: string | null
          encryption_algorithm: string | null
          id: string
          is_ai_generated: boolean | null
          is_encrypted: boolean | null
          mentions: string[] | null
          metadata: Json | null
          reply_to_message_id: string | null
          sender_device_id: string | null
          sender_id: string
          sender_key: string | null
          session_id: string | null
        }
        Insert: {
          ai_response_to?: string | null
          content: string
          conversation_id: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          encrypted_content?: string | null
          encryption_algorithm?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_encrypted?: boolean | null
          mentions?: string[] | null
          metadata?: Json | null
          reply_to_message_id?: string | null
          sender_device_id?: string | null
          sender_id: string
          sender_key?: string | null
          session_id?: string | null
        }
        Update: {
          ai_response_to?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          deleted_at?: string | null
          edited_at?: string | null
          encrypted_content?: string | null
          encryption_algorithm?: string | null
          id?: string
          is_ai_generated?: boolean | null
          is_encrypted?: boolean | null
          mentions?: string[] | null
          metadata?: Json | null
          reply_to_message_id?: string | null
          sender_device_id?: string | null
          sender_id?: string
          sender_key?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_messages_ai_response_to_fkey"
            columns: ["ai_response_to"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_reply_to_message_id_fkey"
            columns: ["reply_to_message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_participants: {
        Row: {
          conversation_id: string
          e2ee_enabled: boolean | null
          e2ee_verified: boolean | null
          e2ee_verified_at: string | null
          id: string
          invited_by: string | null
          is_muted: boolean | null
          joined_at: string
          last_read_at: string | null
          role: string | null
          unread_count: number | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          e2ee_enabled?: boolean | null
          e2ee_verified?: boolean | null
          e2ee_verified_at?: string | null
          id?: string
          invited_by?: string | null
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          unread_count?: number | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          e2ee_enabled?: boolean | null
          e2ee_verified?: boolean | null
          e2ee_verified_at?: string | null
          id?: string
          invited_by?: string | null
          is_muted?: boolean | null
          joined_at?: string
          last_read_at?: string | null
          role?: string | null
          unread_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_participants_invited_by_fkey"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_participants_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      dm_typing_indicators: {
        Row: {
          conversation_id: string
          started_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          started_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          started_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dm_typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_typing_indicators_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dm_typing_indicators_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      doc_resource_relationships: {
        Row: {
          ai_model: string | null
          ai_reasoning: string | null
          analyzed_at: string | null
          confidence_score: number
          context_snippet: string | null
          created_at: string | null
          display_priority: number | null
          doc_section: string | null
          doc_slug: string
          id: string
          is_active: boolean | null
          is_manual: boolean | null
          relationship_type: string
          resource_id: string
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          confidence_score: number
          context_snippet?: string | null
          created_at?: string | null
          display_priority?: number | null
          doc_section?: string | null
          doc_slug: string
          id?: string
          is_active?: boolean | null
          is_manual?: boolean | null
          relationship_type?: string
          resource_id: string
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          confidence_score?: number
          context_snippet?: string | null
          created_at?: string | null
          display_priority?: number | null
          doc_section?: string | null
          doc_slug?: string
          id?: string
          is_active?: boolean | null
          is_manual?: boolean | null
          relationship_type?: string
          resource_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "doc_resource_relationships_doc_slug_fkey"
            columns: ["doc_slug"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "doc_resource_relationships_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sections: {
        Row: {
          content_preview: string | null
          created_at: string
          display_mode:
            | Database["public"]["Enums"]["enum_document_sections_display_mode"]
            | null
          document_id: number
          heading_id: string
          heading_level: number
          heading_text: string
          id: number
          order: number
          show_related_resources: boolean | null
          updated_at: string
        }
        Insert: {
          content_preview?: string | null
          created_at?: string
          display_mode?:
            | Database["public"]["Enums"]["enum_document_sections_display_mode"]
            | null
          document_id: number
          heading_id: string
          heading_level: number
          heading_text: string
          id?: number
          order: number
          show_related_resources?: boolean | null
          updated_at?: string
        }
        Update: {
          content_preview?: string | null
          created_at?: string
          display_mode?:
            | Database["public"]["Enums"]["enum_document_sections_display_mode"]
            | null
          document_id?: number
          heading_id?: string
          heading_level?: number
          heading_text?: string
          id?: number
          order?: number
          show_related_resources?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_document_id_documents_id_fk"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      document_sections_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: number
          path: string
          payload_resources_id: number | null
          tags_id: number | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: number
          path: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "document_sections_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sections_rels_resources_fk"
            columns: ["payload_resources_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "document_sections_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      documentation: {
        Row: {
          ai_model: string | null
          ai_summary: string | null
          category: string
          code_block_count: number | null
          content: string
          content_hash: string | null
          created_at: string | null
          description: string | null
          generated_date: string | null
          heading_count: number | null
          is_featured: boolean | null
          is_published: boolean | null
          last_scraped_at: string | null
          next_slug: string | null
          order_index: number | null
          parent_slug: string | null
          prev_slug: string | null
          reading_time_minutes: number | null
          scrape_status: string | null
          search_vector: unknown
          slug: string
          source_urls: string[] | null
          sources: Json | null
          subcategory: string | null
          title: string
          updated_at: string | null
          version: number | null
          word_count: number | null
        }
        Insert: {
          ai_model?: string | null
          ai_summary?: string | null
          category: string
          code_block_count?: number | null
          content: string
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          generated_date?: string | null
          heading_count?: number | null
          is_featured?: boolean | null
          is_published?: boolean | null
          last_scraped_at?: string | null
          next_slug?: string | null
          order_index?: number | null
          parent_slug?: string | null
          prev_slug?: string | null
          reading_time_minutes?: number | null
          scrape_status?: string | null
          search_vector?: unknown
          slug: string
          source_urls?: string[] | null
          sources?: Json | null
          subcategory?: string | null
          title: string
          updated_at?: string | null
          version?: number | null
          word_count?: number | null
        }
        Update: {
          ai_model?: string | null
          ai_summary?: string | null
          category?: string
          code_block_count?: number | null
          content?: string
          content_hash?: string | null
          created_at?: string | null
          description?: string | null
          generated_date?: string | null
          heading_count?: number | null
          is_featured?: boolean | null
          is_published?: boolean | null
          last_scraped_at?: string | null
          next_slug?: string | null
          order_index?: number | null
          parent_slug?: string | null
          prev_slug?: string | null
          reading_time_minutes?: number | null
          scrape_status?: string | null
          search_vector?: unknown
          slug?: string
          source_urls?: string[] | null
          sources?: Json | null
          subcategory?: string | null
          title?: string
          updated_at?: string | null
          version?: number | null
          word_count?: number | null
        }
        Relationships: []
      }
      documentation_history: {
        Row: {
          ai_confidence: number | null
          ai_model: string | null
          change_summary: string | null
          change_type: string
          changed_by: string | null
          content: string
          created_at: string | null
          description: string | null
          doc_slug: string
          id: string
          sources: Json | null
          title: string
          version: number
        }
        Insert: {
          ai_confidence?: number | null
          ai_model?: string | null
          change_summary?: string | null
          change_type: string
          changed_by?: string | null
          content: string
          created_at?: string | null
          description?: string | null
          doc_slug: string
          id?: string
          sources?: Json | null
          title: string
          version: number
        }
        Update: {
          ai_confidence?: number | null
          ai_model?: string | null
          change_summary?: string | null
          change_type?: string
          changed_by?: string | null
          content?: string
          created_at?: string | null
          description?: string | null
          doc_slug?: string
          id?: string
          sources?: Json | null
          title?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "documentation_history_changed_by_fkey"
            columns: ["changed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_history_doc_slug_fkey"
            columns: ["doc_slug"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["slug"]
          },
        ]
      }
      documentation_sections: {
        Row: {
          content_preview: string | null
          created_at: string | null
          doc_slug: string
          heading_id: string
          heading_level: number
          heading_text: string
          id: string
          order_index: number
          search_vector: unknown
          word_count: number | null
        }
        Insert: {
          content_preview?: string | null
          created_at?: string | null
          doc_slug: string
          heading_id: string
          heading_level: number
          heading_text: string
          id?: string
          order_index: number
          search_vector?: unknown
          word_count?: number | null
        }
        Update: {
          content_preview?: string | null
          created_at?: string | null
          doc_slug?: string
          heading_id?: string
          heading_level?: number
          heading_text?: string
          id?: string
          order_index?: number
          search_vector?: unknown
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_sections_doc_slug_fkey"
            columns: ["doc_slug"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["slug"]
          },
        ]
      }
      documentation_update_jobs: {
        Row: {
          ai_confidence: number | null
          ai_model: string | null
          ai_summary: string | null
          ai_warnings: string[] | null
          analyzed_at: string | null
          completed_at: string | null
          content_diff: string | null
          created_at: string | null
          current_content: string | null
          doc_slug: string
          error_details: Json | null
          error_message: string | null
          id: string
          key_changes: string[] | null
          proposed_content: string | null
          proposed_description: string | null
          proposed_sources: Json | null
          proposed_title: string | null
          retry_count: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scrape_errors: Json | null
          scraped_at: string | null
          scraped_content: Json | null
          status: string
          trigger_type: string
          triggered_by: string | null
          updated_at: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_model?: string | null
          ai_summary?: string | null
          ai_warnings?: string[] | null
          analyzed_at?: string | null
          completed_at?: string | null
          content_diff?: string | null
          created_at?: string | null
          current_content?: string | null
          doc_slug: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          key_changes?: string[] | null
          proposed_content?: string | null
          proposed_description?: string | null
          proposed_sources?: Json | null
          proposed_title?: string | null
          retry_count?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scrape_errors?: Json | null
          scraped_at?: string | null
          scraped_content?: Json | null
          status?: string
          trigger_type: string
          triggered_by?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_model?: string | null
          ai_summary?: string | null
          ai_warnings?: string[] | null
          analyzed_at?: string | null
          completed_at?: string | null
          content_diff?: string | null
          created_at?: string | null
          current_content?: string | null
          doc_slug?: string
          error_details?: Json | null
          error_message?: string | null
          id?: string
          key_changes?: string[] | null
          proposed_content?: string | null
          proposed_description?: string | null
          proposed_sources?: Json | null
          proposed_title?: string | null
          retry_count?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scrape_errors?: Json | null
          scraped_at?: string | null
          scraped_content?: Json | null
          status?: string
          trigger_type?: string
          triggered_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documentation_update_jobs_doc_slug_fkey"
            columns: ["doc_slug"]
            isOneToOne: false
            referencedRelation: "documentation"
            referencedColumns: ["slug"]
          },
          {
            foreignKeyName: "documentation_update_jobs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documentation_update_jobs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          analysis_metadata_ai_model: string | null
          analysis_metadata_analysis_content_hash: string | null
          analysis_metadata_analysis_duration: number | null
          analysis_metadata_analysis_notes: string | null
          analysis_metadata_relationships_found: number | null
          analysis_status:
            | Database["public"]["Enums"]["enum_documents_analysis_status"]
            | null
          auto_match_enabled: boolean | null
          created_at: string
          description: string | null
          display_mode:
            | Database["public"]["Enums"]["enum_documents_display_mode"]
            | null
          doc_category: string
          id: number
          last_analyzed_at: string | null
          meta_keywords: string | null
          meta_no_index: boolean | null
          metadata_code_block_count: number | null
          metadata_heading_count: number | null
          metadata_reading_time: string | null
          metadata_word_count: number | null
          relationship_count: number | null
          rewrite_info_last_rewrite_at: string | null
          rewrite_info_rewrite_status:
            | Database["public"]["Enums"]["enum_documents_rewrite_info_rewrite_status"]
            | null
          slug: string
          sync_info_content_hash: string | null
          sync_info_last_synced: string | null
          sync_info_mdx_path: string | null
          title: string
          updated_at: string
        }
        Insert: {
          analysis_metadata_ai_model?: string | null
          analysis_metadata_analysis_content_hash?: string | null
          analysis_metadata_analysis_duration?: number | null
          analysis_metadata_analysis_notes?: string | null
          analysis_metadata_relationships_found?: number | null
          analysis_status?:
            | Database["public"]["Enums"]["enum_documents_analysis_status"]
            | null
          auto_match_enabled?: boolean | null
          created_at?: string
          description?: string | null
          display_mode?:
            | Database["public"]["Enums"]["enum_documents_display_mode"]
            | null
          doc_category: string
          id?: number
          last_analyzed_at?: string | null
          meta_keywords?: string | null
          meta_no_index?: boolean | null
          metadata_code_block_count?: number | null
          metadata_heading_count?: number | null
          metadata_reading_time?: string | null
          metadata_word_count?: number | null
          relationship_count?: number | null
          rewrite_info_last_rewrite_at?: string | null
          rewrite_info_rewrite_status?:
            | Database["public"]["Enums"]["enum_documents_rewrite_info_rewrite_status"]
            | null
          slug: string
          sync_info_content_hash?: string | null
          sync_info_last_synced?: string | null
          sync_info_mdx_path?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          analysis_metadata_ai_model?: string | null
          analysis_metadata_analysis_content_hash?: string | null
          analysis_metadata_analysis_duration?: number | null
          analysis_metadata_analysis_notes?: string | null
          analysis_metadata_relationships_found?: number | null
          analysis_status?:
            | Database["public"]["Enums"]["enum_documents_analysis_status"]
            | null
          auto_match_enabled?: boolean | null
          created_at?: string
          description?: string | null
          display_mode?:
            | Database["public"]["Enums"]["enum_documents_display_mode"]
            | null
          doc_category?: string
          id?: number
          last_analyzed_at?: string | null
          meta_keywords?: string | null
          meta_no_index?: boolean | null
          metadata_code_block_count?: number | null
          metadata_heading_count?: number | null
          metadata_reading_time?: string | null
          metadata_word_count?: number | null
          relationship_count?: number | null
          rewrite_info_last_rewrite_at?: string | null
          rewrite_info_rewrite_status?:
            | Database["public"]["Enums"]["enum_documents_rewrite_info_rewrite_status"]
            | null
          slug?: string
          sync_info_content_hash?: string | null
          sync_info_last_synced?: string | null
          sync_info_mdx_path?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      documents_ai_relationships: {
        Row: {
          _order: number
          _parent_id: number
          confidence: number | null
          id: string
          is_approved: boolean | null
          reasoning: string | null
          relationship_type: Database["public"]["Enums"]["enum_documents_ai_relationships_relationship_type"]
          resource_id: string
          resource_title: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          confidence?: number | null
          id: string
          is_approved?: boolean | null
          reasoning?: string | null
          relationship_type: Database["public"]["Enums"]["enum_documents_ai_relationships_relationship_type"]
          resource_id: string
          resource_title?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          confidence?: number | null
          id?: string
          is_approved?: boolean | null
          reasoning?: string | null
          relationship_type?: Database["public"]["Enums"]["enum_documents_ai_relationships_relationship_type"]
          resource_id?: string
          resource_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_ai_relationships_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_locales: {
        Row: {
          _locale: unknown[]
          _parent_id: number
          id: number
          meta_description: string | null
          meta_image_id: number | null
          meta_title: string | null
        }
        Insert: {
          _locale: unknown[]
          _parent_id: number
          id?: number
          meta_description?: string | null
          meta_image_id?: number | null
          meta_title?: string | null
        }
        Update: {
          _locale?: unknown[]
          _parent_id?: number
          id?: number
          meta_description?: string | null
          meta_image_id?: number | null
          meta_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_locales_meta_image_id_media_id_fk"
            columns: ["meta_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_locales_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: number
          path: string
          payload_resources_id: number | null
          tags_id: number | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: number
          path: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_rels_resources_fk"
            columns: ["payload_resources_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      documents_rewrite_info_source_urls: {
        Row: {
          _order: number
          _parent_id: number
          id: string
          title: string | null
          url: string
        }
        Insert: {
          _order: number
          _parent_id: number
          id: string
          title?: string | null
          url: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          id?: string
          title?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_rewrite_info_source_urls_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_bank_info: {
        Row: {
          account_holder: string
          account_number: string | null
          bank_address: string | null
          bank_name: string
          created_at: string | null
          currency: string | null
          display_order: number | null
          iban: string | null
          id: string
          instructions: string | null
          is_active: boolean | null
          region: string | null
          routing_number: string | null
          swift_bic: string | null
          updated_at: string | null
        }
        Insert: {
          account_holder: string
          account_number?: string | null
          bank_address?: string | null
          bank_name: string
          created_at?: string | null
          currency?: string | null
          display_order?: number | null
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          region?: string | null
          routing_number?: string | null
          swift_bic?: string | null
          updated_at?: string | null
        }
        Update: {
          account_holder?: string
          account_number?: string | null
          bank_address?: string | null
          bank_name?: string
          created_at?: string | null
          currency?: string | null
          display_order?: number | null
          iban?: string | null
          id?: string
          instructions?: string | null
          is_active?: boolean | null
          region?: string | null
          routing_number?: string | null
          swift_bic?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      donation_receipts: {
        Row: {
          created_at: string | null
          donation_id: string
          download_count: number | null
          downloaded_at: string | null
          generated_at: string | null
          id: string
          pdf_url: string | null
          receipt_number: string
        }
        Insert: {
          created_at?: string | null
          donation_id: string
          download_count?: number | null
          downloaded_at?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          receipt_number: string
        }
        Update: {
          created_at?: string | null
          donation_id?: string
          download_count?: number | null
          downloaded_at?: string | null
          generated_at?: string | null
          id?: string
          pdf_url?: string | null
          receipt_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "donation_receipts_donation_id_fkey"
            columns: ["donation_id"]
            isOneToOne: false
            referencedRelation: "donations"
            referencedColumns: ["id"]
          },
        ]
      }
      donation_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "donation_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      donations: {
        Row: {
          admin_notes: string | null
          amount: number
          confirmed_at: string | null
          confirmed_by: string | null
          created_at: string | null
          currency: string
          donor_email: string | null
          donor_name: string | null
          id: string
          ip_address: unknown
          is_anonymous: boolean | null
          is_recurring: boolean | null
          message: string | null
          metadata: Json | null
          payment_method: string
          paypal_order_id: string | null
          paypal_payer_email: string | null
          paypal_payer_id: string | null
          paypal_payer_name: string | null
          recurring_frequency: string | null
          status: string
          subscription_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          ip_address?: unknown
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          message?: string | null
          metadata?: Json | null
          payment_method: string
          paypal_order_id?: string | null
          paypal_payer_email?: string | null
          paypal_payer_id?: string | null
          paypal_payer_name?: string | null
          recurring_frequency?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          confirmed_at?: string | null
          confirmed_by?: string | null
          created_at?: string | null
          currency?: string
          donor_email?: string | null
          donor_name?: string | null
          id?: string
          ip_address?: unknown
          is_anonymous?: boolean | null
          is_recurring?: boolean | null
          message?: string | null
          metadata?: Json | null
          payment_method?: string
          paypal_order_id?: string | null
          paypal_payer_email?: string | null
          paypal_payer_id?: string | null
          paypal_payer_name?: string | null
          recurring_frequency?: string | null
          status?: string
          subscription_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "donations_confirmed_by_fkey"
            columns: ["confirmed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "donations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      donor_badges: {
        Row: {
          created_at: string | null
          display_name: string | null
          donation_count: number
          first_donation_at: string | null
          has_active_subscription: boolean | null
          id: string
          last_donation_at: string | null
          show_badge_on_profile: boolean | null
          show_on_donor_wall: boolean | null
          tier: string
          total_donated: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          donation_count?: number
          first_donation_at?: string | null
          has_active_subscription?: boolean | null
          id?: string
          last_donation_at?: string | null
          show_badge_on_profile?: boolean | null
          show_on_donor_wall?: boolean | null
          tier: string
          total_donated?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          donation_count?: number
          first_donation_at?: string | null
          has_active_subscription?: boolean | null
          id?: string
          last_donation_at?: string | null
          show_badge_on_profile?: boolean | null
          show_on_donor_wall?: boolean | null
          tier?: string
          total_donated?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "donor_badges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_ai_access_log: {
        Row: {
          accessed_at: string
          ai_model_used: string | null
          authorizing_device_id: string
          authorizing_user_id: string
          content_hash: string | null
          conversation_id: string
          feature_used: string
          id: string
          message_id: string | null
        }
        Insert: {
          accessed_at?: string
          ai_model_used?: string | null
          authorizing_device_id: string
          authorizing_user_id: string
          content_hash?: string | null
          conversation_id: string
          feature_used: string
          id?: string
          message_id?: string | null
        }
        Update: {
          accessed_at?: string
          ai_model_used?: string | null
          authorizing_device_id?: string
          authorizing_user_id?: string
          content_hash?: string | null
          conversation_id?: string
          feature_used?: string
          id?: string
          message_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_ai_access_log_authorizing_user_id_fkey"
            columns: ["authorizing_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_ai_access_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_ai_access_log_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_ai_access_log_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_ai_consent: {
        Row: {
          allowed_features: Json
          consent_expires_at: string | null
          consent_given_at: string | null
          consent_reason: string | null
          consent_status: string
          conversation_id: string
          created_at: string
          device_id: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          allowed_features?: Json
          consent_expires_at?: string | null
          consent_given_at?: string | null
          consent_reason?: string | null
          consent_status?: string
          conversation_id: string
          created_at?: string
          device_id?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          allowed_features?: Json
          consent_expires_at?: string | null
          consent_given_at?: string | null
          consent_reason?: string | null
          consent_status?: string
          conversation_id?: string
          created_at?: string
          device_id?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_ai_consent_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_ai_consent_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_ai_consent_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_conversation_ai_settings: {
        Row: {
          ai_allowed: boolean
          consent_expiry_days: number | null
          conversation_id: string
          created_at: string
          enabled_features: Json
          require_unanimous_consent: boolean
          updated_at: string
        }
        Insert: {
          ai_allowed?: boolean
          consent_expiry_days?: number | null
          conversation_id: string
          created_at?: string
          enabled_features?: Json
          require_unanimous_consent?: boolean
          updated_at?: string
        }
        Update: {
          ai_allowed?: boolean
          consent_expiry_days?: number | null
          conversation_id?: string
          created_at?: string
          enabled_features?: Json
          require_unanimous_consent?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_conversation_ai_settings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_conversation_ai_settings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_conversation_settings: {
        Row: {
          conversation_id: string
          created_at: string
          current_session_created_at: string | null
          current_session_id: string | null
          e2ee_required: boolean
          session_message_count: number | null
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          current_session_created_at?: string | null
          current_session_id?: string | null
          e2ee_required?: boolean
          session_message_count?: number | null
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          current_session_created_at?: string | null
          current_session_id?: string | null
          e2ee_required?: boolean
          session_message_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_conversation_settings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_conversation_settings_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_cross_signing_keys: {
        Row: {
          created_at: string
          id: string
          is_active: boolean | null
          key_type: string
          public_key: string
          revoked_at: string | null
          signatures: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_type: string
          public_key: string
          revoked_at?: string | null
          signatures?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean | null
          key_type?: string
          public_key?: string
          revoked_at?: string | null
          signatures?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_cross_signing_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_device_signatures: {
        Row: {
          created_at: string
          device_key_id: string
          id: string
          signature: string
          signer_key_id: string
          signer_key_type: string
          signer_user_id: string
        }
        Insert: {
          created_at?: string
          device_key_id: string
          id?: string
          signature: string
          signer_key_id: string
          signer_key_type: string
          signer_user_id: string
        }
        Update: {
          created_at?: string
          device_key_id?: string
          id?: string
          signature?: string
          signer_key_id?: string
          signer_key_type?: string
          signer_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_device_signatures_device_key_id_fkey"
            columns: ["device_key_id"]
            isOneToOne: false
            referencedRelation: "device_keys"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_device_signatures_signer_user_id_fkey"
            columns: ["signer_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_key_backups: {
        Row: {
          backup_auth_tag: string
          backup_iv: string
          backup_version: number
          created_at: string
          device_count: number
          encrypted_backup: string
          id: string
          iterations: number
          salt: string
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_auth_tag: string
          backup_iv: string
          backup_version?: number
          created_at?: string
          device_count?: number
          encrypted_backup: string
          id?: string
          iterations?: number
          salt: string
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_auth_tag?: string
          backup_iv?: string
          backup_version?: number
          created_at?: string
          device_count?: number
          encrypted_backup?: string
          id?: string
          iterations?: number
          salt?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_key_backups_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_message_keys: {
        Row: {
          created_at: string
          encrypted_key: string
          id: string
          message_id: string
          olm_message_type: number
          recipient_device_id: string
        }
        Insert: {
          created_at?: string
          encrypted_key: string
          id?: string
          message_id: string
          olm_message_type?: number
          recipient_device_id: string
        }
        Update: {
          created_at?: string
          encrypted_key?: string
          id?: string
          message_id?: string
          olm_message_type?: number
          recipient_device_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_message_keys_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_sas_verifications: {
        Row: {
          completed_at: string | null
          created_at: string
          expires_at: string
          id: string
          initiator_commitment: string | null
          initiator_device_id: string
          initiator_public_key: string | null
          initiator_user_id: string
          sas_decimal: string | null
          sas_emoji_indices: string | null
          status: string
          target_device_id: string
          target_public_key: string | null
          target_user_id: string
          transaction_id: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          initiator_commitment?: string | null
          initiator_device_id: string
          initiator_public_key?: string | null
          initiator_user_id: string
          sas_decimal?: string | null
          sas_emoji_indices?: string | null
          status?: string
          target_device_id: string
          target_public_key?: string | null
          target_user_id: string
          transaction_id: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          initiator_commitment?: string | null
          initiator_device_id?: string
          initiator_public_key?: string | null
          initiator_user_id?: string
          sas_decimal?: string | null
          sas_emoji_indices?: string | null
          status?: string
          target_device_id?: string
          target_public_key?: string | null
          target_user_id?: string
          transaction_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_sas_verifications_initiator_user_id_fkey"
            columns: ["initiator_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_sas_verifications_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      e2ee_user_trust: {
        Row: {
          created_at: string
          id: string
          trust_level: string
          trusted_master_key: string
          trusted_user_id: string
          truster_user_id: string
          updated_at: string
          verification_method: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          trust_level?: string
          trusted_master_key: string
          trusted_user_id: string
          truster_user_id: string
          updated_at?: string
          verification_method?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          trust_level?: string
          trusted_master_key?: string
          trusted_user_id?: string
          truster_user_id?: string
          updated_at?: string
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "e2ee_user_trust_trusted_user_id_fkey"
            columns: ["trusted_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "e2ee_user_trust_truster_user_id_fkey"
            columns: ["truster_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      edit_suggestions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          resource_id: string
          resource_type: string
          reviewer_id: string | null
          reviewer_notes: string | null
          status: string | null
          suggested_changes: string
          suggestion_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          resource_id: string
          resource_type: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          suggested_changes: string
          suggestion_type: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          resource_id?: string
          resource_type?: string
          reviewer_id?: string | null
          reviewer_notes?: string | null
          status?: string | null
          suggested_changes?: string
          suggestion_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "edit_suggestions_reviewer_id_fkey"
            columns: ["reviewer_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "edit_suggestions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      email_2fa_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          max_attempts: number | null
          type: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          max_attempts?: number | null
          type?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          max_attempts?: number | null
          type?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_2fa_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      email_templates: {
        Row: {
          created_at: string
          html_content: Json
          id: number
          name: string
          notes: string | null
          plain_text_content: string | null
          preview_text: string | null
          slug: Database["public"]["Enums"]["enum_email_templates_slug"]
          status: Database["public"]["Enums"]["enum_email_templates_status"]
          styling_primary_color: string | null
          styling_show_footer: boolean | null
          styling_show_logo: boolean | null
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          html_content: Json
          id?: number
          name: string
          notes?: string | null
          plain_text_content?: string | null
          preview_text?: string | null
          slug: Database["public"]["Enums"]["enum_email_templates_slug"]
          status?: Database["public"]["Enums"]["enum_email_templates_status"]
          styling_primary_color?: string | null
          styling_show_footer?: boolean | null
          styling_show_logo?: boolean | null
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          html_content?: Json
          id?: number
          name?: string
          notes?: string | null
          plain_text_content?: string | null
          preview_text?: string | null
          slug?: Database["public"]["Enums"]["enum_email_templates_slug"]
          status?: Database["public"]["Enums"]["enum_email_templates_status"]
          styling_primary_color?: string | null
          styling_show_footer?: boolean | null
          styling_show_logo?: boolean | null
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_verification_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          max_attempts: number | null
          token: string | null
          user_id: string
          verified_at: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          max_attempts?: number | null
          token?: string | null
          user_id: string
          verified_at?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          max_attempts?: number | null
          token?: string | null
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_verification_codes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      export_jobs: {
        Row: {
          completed_at: string | null
          created_at: string
          created_by: string
          current_step: string | null
          error_details: Json | null
          error_message: string | null
          expires_at: string | null
          export_type: string
          file_path: string | null
          file_size: number | null
          format: string
          id: string
          options: Json
          progress: number | null
          row_count: number | null
          schedule_cron: string | null
          scheduled_for: string | null
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          created_by: string
          current_step?: string | null
          error_details?: Json | null
          error_message?: string | null
          expires_at?: string | null
          export_type: string
          file_path?: string | null
          file_size?: number | null
          format: string
          id?: string
          options?: Json
          progress?: number | null
          row_count?: number | null
          schedule_cron?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          created_by?: string
          current_step?: string | null
          error_details?: Json | null
          error_message?: string | null
          expires_at?: string | null
          export_type?: string
          file_path?: string | null
          file_size?: number | null
          format?: string
          id?: string
          options?: Json
          progress?: number | null
          row_count?: number | null
          schedule_cron?: string | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "export_jobs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string
          resource_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_id: string
          resource_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string
          resource_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback: {
        Row: {
          created_at: string | null
          description: string
          feedback_type: string
          id: string
          page_url: string | null
          screenshot_url: string | null
          severity: string | null
          status: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          feedback_type: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string | null
          status?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          feedback_type?: string
          id?: string
          page_url?: string | null
          screenshot_url?: string | null
          severity?: string | null
          status?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings: {
        Row: {
          achievements_enabled: boolean | null
          achievements_max_badges_displayed: number | null
          achievements_retroactive_awards: boolean | null
          achievements_show_hidden_progress: boolean | null
          achievements_showcase_limit: number | null
          created_at: string | null
          event_triggers_award_on_first_action: boolean | null
          event_triggers_award_on_quality: boolean | null
          event_triggers_delay_awards_minutes: number | null
          event_triggers_first_action_multiplier: number | null
          event_triggers_quality_bonus_points: number | null
          id: number
          leaderboard_display_limit: number | null
          leaderboard_enabled: boolean | null
          leaderboard_minimum_points_to_show: number | null
          leaderboard_refresh_interval: number | null
          leaderboard_show_anonymous_users: boolean | null
          levels_enabled: boolean | null
          moderation_auto_suspend_on_abuse: boolean | null
          moderation_enable_abuse_detection: boolean | null
          moderation_max_actions_per_hour: number | null
          moderation_max_points_adjustment: number | null
          moderation_moderator_can_adjust_points: boolean | null
          moderation_moderator_can_revoke_achievements: boolean | null
          moderation_require_adjustment_reason: boolean | null
          moderation_suspicious_threshold: number | null
          notifications_default_confetti_enabled: boolean | null
          notifications_default_sound_enabled: boolean | null
          notifications_show_achievement_popups: boolean | null
          notifications_show_level_up_popups: boolean | null
          notifications_show_points_toast: boolean | null
          points_system_daily_points_cap: number | null
          points_system_enabled: boolean | null
          points_system_points_per_comment: number | null
          points_system_points_per_edit_suggestion: number | null
          points_system_points_per_favorite: number | null
          points_system_points_per_login: number | null
          points_system_points_per_message: number | null
          points_system_points_per_rating: number | null
          points_system_points_per_review: number | null
          points_system_points_per_share: number | null
          streaks_enabled: boolean | null
          streaks_grace_period_hours: number | null
          updated_at: string | null
        }
        Insert: {
          achievements_enabled?: boolean | null
          achievements_max_badges_displayed?: number | null
          achievements_retroactive_awards?: boolean | null
          achievements_show_hidden_progress?: boolean | null
          achievements_showcase_limit?: number | null
          created_at?: string | null
          event_triggers_award_on_first_action?: boolean | null
          event_triggers_award_on_quality?: boolean | null
          event_triggers_delay_awards_minutes?: number | null
          event_triggers_first_action_multiplier?: number | null
          event_triggers_quality_bonus_points?: number | null
          id?: number
          leaderboard_display_limit?: number | null
          leaderboard_enabled?: boolean | null
          leaderboard_minimum_points_to_show?: number | null
          leaderboard_refresh_interval?: number | null
          leaderboard_show_anonymous_users?: boolean | null
          levels_enabled?: boolean | null
          moderation_auto_suspend_on_abuse?: boolean | null
          moderation_enable_abuse_detection?: boolean | null
          moderation_max_actions_per_hour?: number | null
          moderation_max_points_adjustment?: number | null
          moderation_moderator_can_adjust_points?: boolean | null
          moderation_moderator_can_revoke_achievements?: boolean | null
          moderation_require_adjustment_reason?: boolean | null
          moderation_suspicious_threshold?: number | null
          notifications_default_confetti_enabled?: boolean | null
          notifications_default_sound_enabled?: boolean | null
          notifications_show_achievement_popups?: boolean | null
          notifications_show_level_up_popups?: boolean | null
          notifications_show_points_toast?: boolean | null
          points_system_daily_points_cap?: number | null
          points_system_enabled?: boolean | null
          points_system_points_per_comment?: number | null
          points_system_points_per_edit_suggestion?: number | null
          points_system_points_per_favorite?: number | null
          points_system_points_per_login?: number | null
          points_system_points_per_message?: number | null
          points_system_points_per_rating?: number | null
          points_system_points_per_review?: number | null
          points_system_points_per_share?: number | null
          streaks_enabled?: boolean | null
          streaks_grace_period_hours?: number | null
          updated_at?: string | null
        }
        Update: {
          achievements_enabled?: boolean | null
          achievements_max_badges_displayed?: number | null
          achievements_retroactive_awards?: boolean | null
          achievements_show_hidden_progress?: boolean | null
          achievements_showcase_limit?: number | null
          created_at?: string | null
          event_triggers_award_on_first_action?: boolean | null
          event_triggers_award_on_quality?: boolean | null
          event_triggers_delay_awards_minutes?: number | null
          event_triggers_first_action_multiplier?: number | null
          event_triggers_quality_bonus_points?: number | null
          id?: number
          leaderboard_display_limit?: number | null
          leaderboard_enabled?: boolean | null
          leaderboard_minimum_points_to_show?: number | null
          leaderboard_refresh_interval?: number | null
          leaderboard_show_anonymous_users?: boolean | null
          levels_enabled?: boolean | null
          moderation_auto_suspend_on_abuse?: boolean | null
          moderation_enable_abuse_detection?: boolean | null
          moderation_max_actions_per_hour?: number | null
          moderation_max_points_adjustment?: number | null
          moderation_moderator_can_adjust_points?: boolean | null
          moderation_moderator_can_revoke_achievements?: boolean | null
          moderation_require_adjustment_reason?: boolean | null
          moderation_suspicious_threshold?: number | null
          notifications_default_confetti_enabled?: boolean | null
          notifications_default_sound_enabled?: boolean | null
          notifications_show_achievement_popups?: boolean | null
          notifications_show_level_up_popups?: boolean | null
          notifications_show_points_toast?: boolean | null
          points_system_daily_points_cap?: number | null
          points_system_enabled?: boolean | null
          points_system_points_per_comment?: number | null
          points_system_points_per_edit_suggestion?: number | null
          points_system_points_per_favorite?: number | null
          points_system_points_per_login?: number | null
          points_system_points_per_message?: number | null
          points_system_points_per_rating?: number | null
          points_system_points_per_review?: number | null
          points_system_points_per_share?: number | null
          streaks_enabled?: boolean | null
          streaks_grace_period_hours?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      gamification_settings_levels: {
        Row: {
          _order: number
          _parent_id: number
          color: string | null
          icon: string | null
          id: string
          level: number | null
          name: string | null
          points_required: number | null
        }
        Insert: {
          _order: number
          _parent_id: number
          color?: string | null
          icon?: string | null
          id: string
          level?: number | null
          name?: string | null
          points_required?: number | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          color?: string | null
          icon?: string | null
          id?: string
          level?: number | null
          name?: string | null
          points_required?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_settings_levels_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "gamification_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings_levels_perks: {
        Row: {
          _order: number
          _parent_id: string
          id: string
          perk: string | null
        }
        Insert: {
          _order: number
          _parent_id: string
          id: string
          perk?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: string
          id?: string
          perk?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gamification_settings_levels_perks_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "gamification_settings_levels"
            referencedColumns: ["id"]
          },
        ]
      }
      gamification_settings_streaks_milestones: {
        Row: {
          _order: number
          _parent_id: number
          achievement_slug: string | null
          bonus_points: number | null
          days: number | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: number
          achievement_slug?: string | null
          bonus_points?: number | null
          days?: number | null
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          achievement_slug?: string | null
          bonus_points?: number | null
          days?: number | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "gamification_settings_streaks_milestones_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "gamification_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      honeypot_configs: {
        Row: {
          created_at: string | null
          created_by: string | null
          description: string | null
          enabled: boolean | null
          id: string
          last_triggered_at: string | null
          method: string | null
          name: string
          path_pattern: string
          priority: number | null
          redirect_url: string | null
          response_data: Json | null
          response_delay_ms: number | null
          response_template: string | null
          response_type: string
          status_code: number | null
          target_blocked_visitors: boolean | null
          target_bots_only: boolean | null
          target_low_trust: boolean | null
          trigger_count: number | null
          trust_threshold: number | null
          unique_visitors_triggered: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_triggered_at?: string | null
          method?: string | null
          name: string
          path_pattern: string
          priority?: number | null
          redirect_url?: string | null
          response_data?: Json | null
          response_delay_ms?: number | null
          response_template?: string | null
          response_type: string
          status_code?: number | null
          target_blocked_visitors?: boolean | null
          target_bots_only?: boolean | null
          target_low_trust?: boolean | null
          trigger_count?: number | null
          trust_threshold?: number | null
          unique_visitors_triggered?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          enabled?: boolean | null
          id?: string
          last_triggered_at?: string | null
          method?: string | null
          name?: string
          path_pattern?: string
          priority?: number | null
          redirect_url?: string | null
          response_data?: Json | null
          response_delay_ms?: number | null
          response_template?: string | null
          response_type?: string
          status_code?: number | null
          target_blocked_visitors?: boolean | null
          target_bots_only?: boolean | null
          target_low_trust?: boolean | null
          trigger_count?: number | null
          trust_threshold?: number | null
          unique_visitors_triggered?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "honeypot_configs_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "honeypot_configs_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_count: number
          id: string
          last_error: string | null
          max_attempts: number
          payload: Json
          priority: number
          run_at: string
          started_at: string | null
          status: string
          type: string
        }
        Insert: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_count?: number
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          run_at?: string
          started_at?: string | null
          status?: string
          type: string
        }
        Update: {
          attempts?: number
          completed_at?: string | null
          created_at?: string
          error_count?: number
          id?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          run_at?: string
          started_at?: string | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      magic_login_links: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          ip_address: string | null
          token: string
          used_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          token: string
          used_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          token?: string
          used_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "magic_login_links_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          alt: string
          caption: string | null
          category: Database["public"]["Enums"]["enum_media_category"] | null
          created_at: string
          filename: string | null
          filesize: number | null
          focal_x: number | null
          focal_y: number | null
          height: number | null
          id: number
          mime_type: string | null
          sizes_avatar_filename: string | null
          sizes_avatar_filesize: number | null
          sizes_avatar_height: number | null
          sizes_avatar_mime_type: string | null
          sizes_avatar_url: string | null
          sizes_avatar_width: number | null
          sizes_card_filename: string | null
          sizes_card_filesize: number | null
          sizes_card_height: number | null
          sizes_card_mime_type: string | null
          sizes_card_url: string | null
          sizes_card_width: number | null
          sizes_feature_filename: string | null
          sizes_feature_filesize: number | null
          sizes_feature_height: number | null
          sizes_feature_mime_type: string | null
          sizes_feature_url: string | null
          sizes_feature_width: number | null
          sizes_thumbnail_filename: string | null
          sizes_thumbnail_filesize: number | null
          sizes_thumbnail_height: number | null
          sizes_thumbnail_mime_type: string | null
          sizes_thumbnail_url: string | null
          sizes_thumbnail_width: number | null
          thumbnail_u_r_l: string | null
          updated_at: string
          url: string | null
          width: number | null
        }
        Insert: {
          alt: string
          caption?: string | null
          category?: Database["public"]["Enums"]["enum_media_category"] | null
          created_at?: string
          filename?: string | null
          filesize?: number | null
          focal_x?: number | null
          focal_y?: number | null
          height?: number | null
          id?: number
          mime_type?: string | null
          sizes_avatar_filename?: string | null
          sizes_avatar_filesize?: number | null
          sizes_avatar_height?: number | null
          sizes_avatar_mime_type?: string | null
          sizes_avatar_url?: string | null
          sizes_avatar_width?: number | null
          sizes_card_filename?: string | null
          sizes_card_filesize?: number | null
          sizes_card_height?: number | null
          sizes_card_mime_type?: string | null
          sizes_card_url?: string | null
          sizes_card_width?: number | null
          sizes_feature_filename?: string | null
          sizes_feature_filesize?: number | null
          sizes_feature_height?: number | null
          sizes_feature_mime_type?: string | null
          sizes_feature_url?: string | null
          sizes_feature_width?: number | null
          sizes_thumbnail_filename?: string | null
          sizes_thumbnail_filesize?: number | null
          sizes_thumbnail_height?: number | null
          sizes_thumbnail_mime_type?: string | null
          sizes_thumbnail_url?: string | null
          sizes_thumbnail_width?: number | null
          thumbnail_u_r_l?: string | null
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Update: {
          alt?: string
          caption?: string | null
          category?: Database["public"]["Enums"]["enum_media_category"] | null
          created_at?: string
          filename?: string | null
          filesize?: number | null
          focal_x?: number | null
          focal_y?: number | null
          height?: number | null
          id?: number
          mime_type?: string | null
          sizes_avatar_filename?: string | null
          sizes_avatar_filesize?: number | null
          sizes_avatar_height?: number | null
          sizes_avatar_mime_type?: string | null
          sizes_avatar_url?: string | null
          sizes_avatar_width?: number | null
          sizes_card_filename?: string | null
          sizes_card_filesize?: number | null
          sizes_card_height?: number | null
          sizes_card_mime_type?: string | null
          sizes_card_url?: string | null
          sizes_card_width?: number | null
          sizes_feature_filename?: string | null
          sizes_feature_filesize?: number | null
          sizes_feature_height?: number | null
          sizes_feature_mime_type?: string | null
          sizes_feature_url?: string | null
          sizes_feature_width?: number | null
          sizes_thumbnail_filename?: string | null
          sizes_thumbnail_filesize?: number | null
          sizes_thumbnail_height?: number | null
          sizes_thumbnail_mime_type?: string | null
          sizes_thumbnail_url?: string | null
          sizes_thumbnail_width?: number | null
          thumbnail_u_r_l?: string | null
          updated_at?: string
          url?: string | null
          width?: number | null
        }
        Relationships: []
      }
      megolm_session_shares: {
        Row: {
          claimed_at: string | null
          conversation_id: string
          created_at: string
          encrypted_session_key: string
          first_known_index: number
          forwarded_count: number
          id: string
          key_algorithm: string
          recipient_device_id: string
          recipient_user_id: string
          sender_device_id: string
          sender_user_id: string
          session_id: string
        }
        Insert: {
          claimed_at?: string | null
          conversation_id: string
          created_at?: string
          encrypted_session_key: string
          first_known_index?: number
          forwarded_count?: number
          id?: string
          key_algorithm?: string
          recipient_device_id: string
          recipient_user_id: string
          sender_device_id: string
          sender_user_id: string
          session_id: string
        }
        Update: {
          claimed_at?: string | null
          conversation_id?: string
          created_at?: string
          encrypted_session_key?: string
          first_known_index?: number
          forwarded_count?: number
          id?: string
          key_algorithm?: string
          recipient_device_id?: string
          recipient_user_id?: string
          sender_device_id?: string
          sender_user_id?: string
          session_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "megolm_session_shares_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "megolm_session_shares_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "user_dm_conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "megolm_session_shares_recipient_user_id_fkey"
            columns: ["recipient_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "megolm_session_shares_sender_user_id_fkey"
            columns: ["sender_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dm_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_reactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          browser_notifications: boolean | null
          created_at: string | null
          email_comments: boolean | null
          email_digest: boolean | null
          email_digest_frequency: string | null
          email_follows: boolean | null
          email_replies: boolean | null
          email_suggestions: boolean | null
          email_version_updates: boolean | null
          id: string
          in_app_comments: boolean | null
          in_app_follows: boolean | null
          in_app_mentions: boolean | null
          in_app_replies: boolean | null
          in_app_suggestions: boolean | null
          in_app_version_updates: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_comments?: boolean | null
          email_digest?: boolean | null
          email_digest_frequency?: string | null
          email_follows?: boolean | null
          email_replies?: boolean | null
          email_suggestions?: boolean | null
          email_version_updates?: boolean | null
          id?: string
          in_app_comments?: boolean | null
          in_app_follows?: boolean | null
          in_app_mentions?: boolean | null
          in_app_replies?: boolean | null
          in_app_suggestions?: boolean | null
          in_app_version_updates?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          browser_notifications?: boolean | null
          created_at?: string | null
          email_comments?: boolean | null
          email_digest?: boolean | null
          email_digest_frequency?: string | null
          email_follows?: boolean | null
          email_replies?: boolean | null
          email_suggestions?: boolean | null
          email_version_updates?: boolean | null
          id?: string
          in_app_comments?: boolean | null
          in_app_follows?: boolean | null
          in_app_mentions?: boolean | null
          in_app_replies?: boolean | null
          in_app_suggestions?: boolean | null
          in_app_version_updates?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_preferences_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          actor_id: string | null
          created_at: string | null
          data: Json | null
          id: string
          message: string | null
          read: boolean | null
          read_at: string | null
          resource_id: string | null
          resource_type: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          data?: Json | null
          id?: string
          message?: string | null
          read?: boolean | null
          read_at?: string | null
          resource_id?: string | null
          resource_type?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_actor_id_fkey"
            columns: ["actor_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      one_time_prekeys: {
        Row: {
          claimed_at: string | null
          claimed_by_device: string | null
          claimed_by_user: string | null
          created_at: string
          device_key_id: string
          id: string
          key_id: string
          public_key: string
        }
        Insert: {
          claimed_at?: string | null
          claimed_by_device?: string | null
          claimed_by_user?: string | null
          created_at?: string
          device_key_id: string
          id?: string
          key_id: string
          public_key: string
        }
        Update: {
          claimed_at?: string | null
          claimed_by_device?: string | null
          claimed_by_user?: string | null
          created_at?: string
          device_key_id?: string
          id?: string
          key_id?: string
          public_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "one_time_prekeys_device_key_id_fkey"
            columns: ["device_key_id"]
            isOneToOne: false
            referencedRelation: "device_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      passkeys: {
        Row: {
          aaguid: string | null
          backed_up: boolean | null
          counter: number
          created_at: string | null
          credential_id: string
          device_type: string
          id: string
          last_used_at: string | null
          passkey_name: string
          public_key: string
          transports: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          aaguid?: string | null
          backed_up?: boolean | null
          counter?: number
          created_at?: string | null
          credential_id: string
          device_type?: string
          id?: string
          last_used_at?: string | null
          passkey_name?: string
          public_key: string
          transports?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          aaguid?: string | null
          backed_up?: boolean | null
          counter?: number
          created_at?: string | null
          credential_id?: string
          device_type?: string
          id?: string
          last_used_at?: string | null
          passkey_name?: string
          public_key?: string
          transports?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "passkeys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_achievements: {
        Row: {
          base_points: number
          category_id: number
          compound_conditions: Json | null
          compound_logic:
            | Database["public"]["Enums"]["enum_payload_achievements_compound_logic"]
            | null
          condition_type: Database["public"]["Enums"]["enum_payload_achievements_condition_type"]
          confetti_duration: number | null
          created_at: string
          description: string
          display_duration: number | null
          end_date: string | null
          icon: string
          id: number
          is_active: boolean | null
          is_hidden: boolean | null
          is_limited: boolean | null
          is_secret: boolean | null
          metric:
            | Database["public"]["Enums"]["enum_payload_achievements_metric"]
            | null
          name: string
          notification_message: string | null
          notification_sound:
            | Database["public"]["Enums"]["enum_payload_achievements_notification_sound"]
            | null
          notification_title: string | null
          show_confetti: boolean | null
          slug: string
          start_date: string | null
          threshold: number | null
          tier_id: number
          time_window: string | null
          updated_at: string
        }
        Insert: {
          base_points?: number
          category_id: number
          compound_conditions?: Json | null
          compound_logic?:
            | Database["public"]["Enums"]["enum_payload_achievements_compound_logic"]
            | null
          condition_type?: Database["public"]["Enums"]["enum_payload_achievements_condition_type"]
          confetti_duration?: number | null
          created_at?: string
          description: string
          display_duration?: number | null
          end_date?: string | null
          icon: string
          id?: number
          is_active?: boolean | null
          is_hidden?: boolean | null
          is_limited?: boolean | null
          is_secret?: boolean | null
          metric?:
            | Database["public"]["Enums"]["enum_payload_achievements_metric"]
            | null
          name: string
          notification_message?: string | null
          notification_sound?:
            | Database["public"]["Enums"]["enum_payload_achievements_notification_sound"]
            | null
          notification_title?: string | null
          show_confetti?: boolean | null
          slug: string
          start_date?: string | null
          threshold?: number | null
          tier_id: number
          time_window?: string | null
          updated_at?: string
        }
        Update: {
          base_points?: number
          category_id?: number
          compound_conditions?: Json | null
          compound_logic?:
            | Database["public"]["Enums"]["enum_payload_achievements_compound_logic"]
            | null
          condition_type?: Database["public"]["Enums"]["enum_payload_achievements_condition_type"]
          confetti_duration?: number | null
          created_at?: string
          description?: string
          display_duration?: number | null
          end_date?: string | null
          icon?: string
          id?: number
          is_active?: boolean | null
          is_hidden?: boolean | null
          is_limited?: boolean | null
          is_secret?: boolean | null
          metric?:
            | Database["public"]["Enums"]["enum_payload_achievements_metric"]
            | null
          name?: string
          notification_message?: string | null
          notification_sound?:
            | Database["public"]["Enums"]["enum_payload_achievements_notification_sound"]
            | null
          notification_title?: string | null
          show_confetti?: boolean | null
          slug?: string
          start_date?: string | null
          threshold?: number | null
          tier_id?: number
          time_window?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payload_achievements_category_id_achievement_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "achievement_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_achievements_tier_id_achievement_tiers_id_fk"
            columns: ["tier_id"]
            isOneToOne: false
            referencedRelation: "achievement_tiers"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_edit_suggestions: {
        Row: {
          created_at: string
          current_content: string | null
          id: number
          priority:
            | Database["public"]["Enums"]["enum_payload_edit_suggestions_priority"]
            | null
          reason: string | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by_id: number | null
          status: Database["public"]["Enums"]["enum_payload_edit_suggestions_status"]
          submitter_email: string | null
          submitter_name: string | null
          submitter_type:
            | Database["public"]["Enums"]["enum_payload_edit_suggestions_submitter_type"]
            | null
          submitter_user_id: string | null
          suggested_content: string
          target_id: string
          target_type: Database["public"]["Enums"]["enum_payload_edit_suggestions_target_type"]
          target_url: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_content?: string | null
          id?: number
          priority?:
            | Database["public"]["Enums"]["enum_payload_edit_suggestions_priority"]
            | null
          reason?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: number | null
          status?: Database["public"]["Enums"]["enum_payload_edit_suggestions_status"]
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_type?:
            | Database["public"]["Enums"]["enum_payload_edit_suggestions_submitter_type"]
            | null
          submitter_user_id?: string | null
          suggested_content: string
          target_id: string
          target_type: Database["public"]["Enums"]["enum_payload_edit_suggestions_target_type"]
          target_url?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_content?: string | null
          id?: number
          priority?:
            | Database["public"]["Enums"]["enum_payload_edit_suggestions_priority"]
            | null
          reason?: string | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: number | null
          status?: Database["public"]["Enums"]["enum_payload_edit_suggestions_status"]
          submitter_email?: string | null
          submitter_name?: string | null
          submitter_type?:
            | Database["public"]["Enums"]["enum_payload_edit_suggestions_submitter_type"]
            | null
          submitter_user_id?: string | null
          suggested_content?: string
          target_id?: string
          target_type?: Database["public"]["Enums"]["enum_payload_edit_suggestions_target_type"]
          target_url?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payload_edit_suggestions_reviewed_by_id_users_id_fk"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_kv: {
        Row: {
          data: Json
          id: number
          key: string
        }
        Insert: {
          data: Json
          id?: number
          key: string
        }
        Update: {
          data?: Json
          id?: number
          key?: string
        }
        Relationships: []
      }
      payload_locked_documents: {
        Row: {
          created_at: string
          global_slug: string | null
          id: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          global_slug?: string | null
          id?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          global_slug?: string | null
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      payload_locked_documents_rels: {
        Row: {
          achievement_categories_id: number | null
          achievement_tiers_id: number | null
          audit_logs_id: number | null
          badges_id: number | null
          categories_id: number | null
          code_examples_id: number | null
          difficulty_levels_id: number | null
          document_sections_id: number | null
          documents_id: number | null
          email_templates_id: number | null
          id: number
          media_id: number | null
          order: number | null
          parent_id: number
          path: string
          payload_achievements_id: number | null
          payload_edit_suggestions_id: number | null
          payload_resource_authors_id: number | null
          payload_resource_discovery_queue_id: number | null
          payload_resource_reviews_id: number | null
          payload_resource_sources_id: number | null
          payload_resources_id: number | null
          programming_languages_id: number | null
          subcategories_id: number | null
          tags_id: number | null
          translations_id: number | null
          users_id: number | null
        }
        Insert: {
          achievement_categories_id?: number | null
          achievement_tiers_id?: number | null
          audit_logs_id?: number | null
          badges_id?: number | null
          categories_id?: number | null
          code_examples_id?: number | null
          difficulty_levels_id?: number | null
          document_sections_id?: number | null
          documents_id?: number | null
          email_templates_id?: number | null
          id?: number
          media_id?: number | null
          order?: number | null
          parent_id: number
          path: string
          payload_achievements_id?: number | null
          payload_edit_suggestions_id?: number | null
          payload_resource_authors_id?: number | null
          payload_resource_discovery_queue_id?: number | null
          payload_resource_reviews_id?: number | null
          payload_resource_sources_id?: number | null
          payload_resources_id?: number | null
          programming_languages_id?: number | null
          subcategories_id?: number | null
          tags_id?: number | null
          translations_id?: number | null
          users_id?: number | null
        }
        Update: {
          achievement_categories_id?: number | null
          achievement_tiers_id?: number | null
          audit_logs_id?: number | null
          badges_id?: number | null
          categories_id?: number | null
          code_examples_id?: number | null
          difficulty_levels_id?: number | null
          document_sections_id?: number | null
          documents_id?: number | null
          email_templates_id?: number | null
          id?: number
          media_id?: number | null
          order?: number | null
          parent_id?: number
          path?: string
          payload_achievements_id?: number | null
          payload_edit_suggestions_id?: number | null
          payload_resource_authors_id?: number | null
          payload_resource_discovery_queue_id?: number | null
          payload_resource_reviews_id?: number | null
          payload_resource_sources_id?: number | null
          payload_resources_id?: number | null
          programming_languages_id?: number | null
          subcategories_id?: number | null
          tags_id?: number | null
          translations_id?: number | null
          users_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_locked_documents_rels_achievement_categories_fk"
            columns: ["achievement_categories_id"]
            isOneToOne: false
            referencedRelation: "achievement_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_achievement_tiers_fk"
            columns: ["achievement_tiers_id"]
            isOneToOne: false
            referencedRelation: "achievement_tiers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_achievements_fk"
            columns: ["payload_achievements_id"]
            isOneToOne: false
            referencedRelation: "payload_achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_audit_logs_fk"
            columns: ["audit_logs_id"]
            isOneToOne: false
            referencedRelation: "audit_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_badges_fk"
            columns: ["badges_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_categories_fk"
            columns: ["categories_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_code_examples_fk"
            columns: ["code_examples_id"]
            isOneToOne: false
            referencedRelation: "code_examples"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_difficulty_levels_fk"
            columns: ["difficulty_levels_id"]
            isOneToOne: false
            referencedRelation: "difficulty_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_document_sections_fk"
            columns: ["document_sections_id"]
            isOneToOne: false
            referencedRelation: "document_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_documents_fk"
            columns: ["documents_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_edit_suggestions_fk"
            columns: ["payload_edit_suggestions_id"]
            isOneToOne: false
            referencedRelation: "payload_edit_suggestions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_email_templates_fk"
            columns: ["email_templates_id"]
            isOneToOne: false
            referencedRelation: "email_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_media_fk"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_locked_documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_programming_languages_fk"
            columns: ["programming_languages_id"]
            isOneToOne: false
            referencedRelation: "programming_languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_resource_authors_fk"
            columns: ["payload_resource_authors_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_authors"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_resource_discovery_queue_fk"
            columns: ["payload_resource_discovery_queue_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_discovery_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_resource_reviews_fk"
            columns: ["payload_resource_reviews_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_resource_sources_fk"
            columns: ["payload_resource_sources_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_resources_fk"
            columns: ["payload_resources_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_subcategories_fk"
            columns: ["subcategories_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_translations_fk"
            columns: ["translations_id"]
            isOneToOne: false
            referencedRelation: "translations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_locked_documents_rels_users_fk"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_migrations: {
        Row: {
          batch: number | null
          created_at: string
          id: number
          name: string | null
          updated_at: string
        }
        Insert: {
          batch?: number | null
          created_at?: string
          id?: number
          name?: string | null
          updated_at?: string
        }
        Update: {
          batch?: number | null
          created_at?: string
          id?: number
          name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payload_preferences: {
        Row: {
          created_at: string
          id: number
          key: string | null
          updated_at: string
          value: Json | null
        }
        Insert: {
          created_at?: string
          id?: number
          key?: string | null
          updated_at?: string
          value?: Json | null
        }
        Update: {
          created_at?: string
          id?: number
          key?: string | null
          updated_at?: string
          value?: Json | null
        }
        Relationships: []
      }
      payload_preferences_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: number
          path: string
          users_id: number | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: number
          path: string
          users_id?: number | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          users_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_preferences_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_preferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_preferences_rels_users_fk"
            columns: ["users_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          github_username: string | null
          id: number
          is_primary: boolean | null
          name: string
          resource_id: number
          role: Database["public"]["Enums"]["enum_payload_resource_authors_role"]
          twitter_username: string | null
          updated_at: string
          user_id: number | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          github_username?: string | null
          id?: number
          is_primary?: boolean | null
          name: string
          resource_id: number
          role?: Database["public"]["Enums"]["enum_payload_resource_authors_role"]
          twitter_username?: string | null
          updated_at?: string
          user_id?: number | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          github_username?: string | null
          id?: number
          is_primary?: boolean | null
          name?: string
          resource_id?: number
          role?: Database["public"]["Enums"]["enum_payload_resource_authors_role"]
          twitter_username?: string | null
          updated_at?: string
          user_id?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_authors_resource_id_payload_resources_id_fk"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_authors_user_id_users_id_fk"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_discovery_queue: {
        Row: {
          ai_analysis_analyzed_at: string | null
          ai_analysis_confidence_score: number | null
          ai_analysis_quality_score: number | null
          ai_analysis_reasoning: string | null
          ai_analysis_relevance_score: number | null
          ai_analysis_suggested_improvements: string | null
          ai_analysis_warnings: string | null
          created_at: string
          created_resource_id: number | null
          description: string
          duplicate_of_id: number | null
          github_forks: number | null
          github_language: string | null
          github_last_commit: string | null
          github_license: string | null
          github_open_issues: number | null
          github_owner: string | null
          github_repo: string | null
          github_stars: number | null
          id: number
          package_name: string | null
          package_registry:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_package_registry"]
            | null
          package_version: string | null
          package_weekly_downloads: number | null
          priority:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_priority"]
            | null
          raw_data: Json | null
          rejection_reason: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by_id: number | null
          source_id: number | null
          source_url: string | null
          status: Database["public"]["Enums"]["enum_payload_resource_discovery_queue_status"]
          suggested_category_id: number | null
          suggested_difficulty_id: number | null
          suggested_status:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_suggested_status"]
            | null
          suggested_subcategory_id: number | null
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          ai_analysis_analyzed_at?: string | null
          ai_analysis_confidence_score?: number | null
          ai_analysis_quality_score?: number | null
          ai_analysis_reasoning?: string | null
          ai_analysis_relevance_score?: number | null
          ai_analysis_suggested_improvements?: string | null
          ai_analysis_warnings?: string | null
          created_at?: string
          created_resource_id?: number | null
          description: string
          duplicate_of_id?: number | null
          github_forks?: number | null
          github_language?: string | null
          github_last_commit?: string | null
          github_license?: string | null
          github_open_issues?: number | null
          github_owner?: string | null
          github_repo?: string | null
          github_stars?: number | null
          id?: number
          package_name?: string | null
          package_registry?:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_package_registry"]
            | null
          package_version?: string | null
          package_weekly_downloads?: number | null
          priority?:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_priority"]
            | null
          raw_data?: Json | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: number | null
          source_id?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["enum_payload_resource_discovery_queue_status"]
          suggested_category_id?: number | null
          suggested_difficulty_id?: number | null
          suggested_status?:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_suggested_status"]
            | null
          suggested_subcategory_id?: number | null
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          ai_analysis_analyzed_at?: string | null
          ai_analysis_confidence_score?: number | null
          ai_analysis_quality_score?: number | null
          ai_analysis_reasoning?: string | null
          ai_analysis_relevance_score?: number | null
          ai_analysis_suggested_improvements?: string | null
          ai_analysis_warnings?: string | null
          created_at?: string
          created_resource_id?: number | null
          description?: string
          duplicate_of_id?: number | null
          github_forks?: number | null
          github_language?: string | null
          github_last_commit?: string | null
          github_license?: string | null
          github_open_issues?: number | null
          github_owner?: string | null
          github_repo?: string | null
          github_stars?: number | null
          id?: number
          package_name?: string | null
          package_registry?:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_package_registry"]
            | null
          package_version?: string | null
          package_weekly_downloads?: number | null
          priority?:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_priority"]
            | null
          raw_data?: Json | null
          rejection_reason?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by_id?: number | null
          source_id?: number | null
          source_url?: string | null
          status?: Database["public"]["Enums"]["enum_payload_resource_discovery_queue_status"]
          suggested_category_id?: number | null
          suggested_difficulty_id?: number | null
          suggested_status?:
            | Database["public"]["Enums"]["enum_payload_resource_discovery_queue_suggested_status"]
            | null
          suggested_subcategory_id?: number | null
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_discovery_queue_created_resource_id_payload_re"
            columns: ["created_resource_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_discovery_queue_duplicate_of_id_payload_resour"
            columns: ["duplicate_of_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_discovery_queue_reviewed_by_id_users_id_fk"
            columns: ["reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_discovery_queue_source_id_payload_resource_sou"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_discovery_queue_suggested_category_id_categori"
            columns: ["suggested_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_discovery_queue_suggested_difficulty_id_diffic"
            columns: ["suggested_difficulty_id"]
            isOneToOne: false
            referencedRelation: "difficulty_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_discovery_queue_suggested_subcategory_id_subca"
            columns: ["suggested_subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_discovery_queue_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: number
          path: string
          tags_id: number | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: number
          path: string
          tags_id?: number | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          tags_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_discovery_queue_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_discovery_queue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_discovery_queue_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_reviews: {
        Row: {
          content: string
          created_at: string
          helpful_count: number | null
          id: number
          moderated_at: string | null
          moderated_by_id: number | null
          moderation_notes: string | null
          not_helpful_count: number | null
          rating: number
          rejection_reason:
            | Database["public"]["Enums"]["enum_payload_resource_reviews_rejection_reason"]
            | null
          resource_slug: string | null
          resource_title: string | null
          status: Database["public"]["Enums"]["enum_payload_resource_reviews_status"]
          submitted_at: string | null
          supabase_id: string
          title: string | null
          updated_at: string
          user_email: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          content: string
          created_at?: string
          helpful_count?: number | null
          id?: number
          moderated_at?: string | null
          moderated_by_id?: number | null
          moderation_notes?: string | null
          not_helpful_count?: number | null
          rating: number
          rejection_reason?:
            | Database["public"]["Enums"]["enum_payload_resource_reviews_rejection_reason"]
            | null
          resource_slug?: string | null
          resource_title?: string | null
          status?: Database["public"]["Enums"]["enum_payload_resource_reviews_status"]
          submitted_at?: string | null
          supabase_id: string
          title?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          content?: string
          created_at?: string
          helpful_count?: number | null
          id?: number
          moderated_at?: string | null
          moderated_by_id?: number | null
          moderation_notes?: string | null
          not_helpful_count?: number | null
          rating?: number
          rejection_reason?:
            | Database["public"]["Enums"]["enum_payload_resource_reviews_rejection_reason"]
            | null
          resource_slug?: string | null
          resource_title?: string | null
          status?: Database["public"]["Enums"]["enum_payload_resource_reviews_status"]
          submitted_at?: string | null
          supabase_id?: string
          title?: string | null
          updated_at?: string
          user_email?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_reviews_moderated_by_id_users_id_fk"
            columns: ["moderated_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_reviews_cons: {
        Row: {
          _order: number
          _parent_id: number
          id: string
          text: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          id: string
          text?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_reviews_cons_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_reviews_pros: {
        Row: {
          _order: number
          _parent_id: number
          id: string
          text: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          id: string
          text?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          id?: string
          text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_reviews_pros_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_sources: {
        Row: {
          created_at: string
          description: string | null
          discovery_settings_auto_approve: boolean | null
          discovery_settings_default_category_id: number | null
          discovery_settings_default_subcategory_id: number | null
          discovery_settings_exclude_patterns: string | null
          discovery_settings_include_patterns: string | null
          discovery_settings_min_downloads: number | null
          discovery_settings_min_stars: number | null
          github_branch: string | null
          github_owner: string | null
          github_path: string | null
          github_repo: string | null
          github_search_query: string | null
          github_topics: string | null
          id: number
          is_active: boolean | null
          last_scan_error: string | null
          last_scan_status:
            | Database["public"]["Enums"]["enum_payload_resource_sources_last_scan_status"]
            | null
          last_scanned_at: string | null
          name: string
          notes: string | null
          pending_count: number | null
          registry_keywords: string | null
          registry_scope: string | null
          registry_search_query: string | null
          resource_count: number | null
          scan_frequency:
            | Database["public"]["Enums"]["enum_payload_resource_sources_scan_frequency"]
            | null
          supabase_id: string | null
          type: Database["public"]["Enums"]["enum_payload_resource_sources_type"]
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          discovery_settings_auto_approve?: boolean | null
          discovery_settings_default_category_id?: number | null
          discovery_settings_default_subcategory_id?: number | null
          discovery_settings_exclude_patterns?: string | null
          discovery_settings_include_patterns?: string | null
          discovery_settings_min_downloads?: number | null
          discovery_settings_min_stars?: number | null
          github_branch?: string | null
          github_owner?: string | null
          github_path?: string | null
          github_repo?: string | null
          github_search_query?: string | null
          github_topics?: string | null
          id?: number
          is_active?: boolean | null
          last_scan_error?: string | null
          last_scan_status?:
            | Database["public"]["Enums"]["enum_payload_resource_sources_last_scan_status"]
            | null
          last_scanned_at?: string | null
          name: string
          notes?: string | null
          pending_count?: number | null
          registry_keywords?: string | null
          registry_scope?: string | null
          registry_search_query?: string | null
          resource_count?: number | null
          scan_frequency?:
            | Database["public"]["Enums"]["enum_payload_resource_sources_scan_frequency"]
            | null
          supabase_id?: string | null
          type: Database["public"]["Enums"]["enum_payload_resource_sources_type"]
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          description?: string | null
          discovery_settings_auto_approve?: boolean | null
          discovery_settings_default_category_id?: number | null
          discovery_settings_default_subcategory_id?: number | null
          discovery_settings_exclude_patterns?: string | null
          discovery_settings_include_patterns?: string | null
          discovery_settings_min_downloads?: number | null
          discovery_settings_min_stars?: number | null
          github_branch?: string | null
          github_owner?: string | null
          github_path?: string | null
          github_repo?: string | null
          github_search_query?: string | null
          github_topics?: string | null
          id?: number
          is_active?: boolean | null
          last_scan_error?: string | null
          last_scan_status?:
            | Database["public"]["Enums"]["enum_payload_resource_sources_last_scan_status"]
            | null
          last_scanned_at?: string | null
          name?: string
          notes?: string | null
          pending_count?: number | null
          registry_keywords?: string | null
          registry_scope?: string | null
          registry_search_query?: string | null
          resource_count?: number | null
          scan_frequency?:
            | Database["public"]["Enums"]["enum_payload_resource_sources_scan_frequency"]
            | null
          supabase_id?: string | null
          type?: Database["public"]["Enums"]["enum_payload_resource_sources_type"]
          updated_at?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_sources_discovery_settings_default_category_id"
            columns: ["discovery_settings_default_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_sources_discovery_settings_default_subcategory"
            columns: ["discovery_settings_default_subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resource_sources_rels: {
        Row: {
          id: number
          order: number | null
          parent_id: number
          path: string
          tags_id: number | null
        }
        Insert: {
          id?: number
          order?: number | null
          parent_id: number
          path: string
          tags_id?: number | null
        }
        Update: {
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          tags_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resource_sources_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resource_sources_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources: {
        Row: {
          _status:
            | Database["public"]["Enums"]["enum_payload_resources_status"]
            | null
          added_date: string | null
          ai_overview: Json | null
          ai_summary: string | null
          category_id: number | null
          content_hash: string | null
          created_at: string
          description: string | null
          difficulty_id: number | null
          discovery_ai_confidence_score: number | null
          discovery_ai_notes: string | null
          discovery_discovered_at: string | null
          discovery_discovered_by:
            | Database["public"]["Enums"]["enum_payload_resources_discovery_discovered_by"]
            | null
          discovery_source_id: number | null
          enhancement_metadata_ai_enhanced_at: string | null
          enhancement_metadata_ai_model: string | null
          enhancement_metadata_enhancement_notes: string | null
          enhancement_status:
            | Database["public"]["Enums"]["enum_payload_resources_enhancement_status"]
            | null
          featured: boolean | null
          featured_reason:
            | Database["public"]["Enums"]["enum_payload_resources_featured_reason"]
            | null
          github_forks: number | null
          github_language_id: number | null
          github_last_updated: string | null
          github_owner: string | null
          github_repo: string | null
          github_stars: number | null
          id: number
          last_verified: string | null
          meta_keywords: string | null
          meta_no_index: boolean | null
          namespace: string | null
          publish_status:
            | Database["public"]["Enums"]["enum_payload_resources_publish_status"]
            | null
          relationship_count: number | null
          resource_type:
            | Database["public"]["Enums"]["enum_payload_resources_resource_type"]
            | null
          review_rejection_reason: string | null
          review_review_notes: string | null
          review_reviewed_at: string | null
          review_reviewed_by_id: number | null
          subcategory_id: number | null
          title: string | null
          updated_at: string
          url: string | null
          version: string | null
        }
        Insert: {
          _status?:
            | Database["public"]["Enums"]["enum_payload_resources_status"]
            | null
          added_date?: string | null
          ai_overview?: Json | null
          ai_summary?: string | null
          category_id?: number | null
          content_hash?: string | null
          created_at?: string
          description?: string | null
          difficulty_id?: number | null
          discovery_ai_confidence_score?: number | null
          discovery_ai_notes?: string | null
          discovery_discovered_at?: string | null
          discovery_discovered_by?:
            | Database["public"]["Enums"]["enum_payload_resources_discovery_discovered_by"]
            | null
          discovery_source_id?: number | null
          enhancement_metadata_ai_enhanced_at?: string | null
          enhancement_metadata_ai_model?: string | null
          enhancement_metadata_enhancement_notes?: string | null
          enhancement_status?:
            | Database["public"]["Enums"]["enum_payload_resources_enhancement_status"]
            | null
          featured?: boolean | null
          featured_reason?:
            | Database["public"]["Enums"]["enum_payload_resources_featured_reason"]
            | null
          github_forks?: number | null
          github_language_id?: number | null
          github_last_updated?: string | null
          github_owner?: string | null
          github_repo?: string | null
          github_stars?: number | null
          id?: number
          last_verified?: string | null
          meta_keywords?: string | null
          meta_no_index?: boolean | null
          namespace?: string | null
          publish_status?:
            | Database["public"]["Enums"]["enum_payload_resources_publish_status"]
            | null
          relationship_count?: number | null
          resource_type?:
            | Database["public"]["Enums"]["enum_payload_resources_resource_type"]
            | null
          review_rejection_reason?: string | null
          review_review_notes?: string | null
          review_reviewed_at?: string | null
          review_reviewed_by_id?: number | null
          subcategory_id?: number | null
          title?: string | null
          updated_at?: string
          url?: string | null
          version?: string | null
        }
        Update: {
          _status?:
            | Database["public"]["Enums"]["enum_payload_resources_status"]
            | null
          added_date?: string | null
          ai_overview?: Json | null
          ai_summary?: string | null
          category_id?: number | null
          content_hash?: string | null
          created_at?: string
          description?: string | null
          difficulty_id?: number | null
          discovery_ai_confidence_score?: number | null
          discovery_ai_notes?: string | null
          discovery_discovered_at?: string | null
          discovery_discovered_by?:
            | Database["public"]["Enums"]["enum_payload_resources_discovery_discovered_by"]
            | null
          discovery_source_id?: number | null
          enhancement_metadata_ai_enhanced_at?: string | null
          enhancement_metadata_ai_model?: string | null
          enhancement_metadata_enhancement_notes?: string | null
          enhancement_status?:
            | Database["public"]["Enums"]["enum_payload_resources_enhancement_status"]
            | null
          featured?: boolean | null
          featured_reason?:
            | Database["public"]["Enums"]["enum_payload_resources_featured_reason"]
            | null
          github_forks?: number | null
          github_language_id?: number | null
          github_last_updated?: string | null
          github_owner?: string | null
          github_repo?: string | null
          github_stars?: number | null
          id?: number
          last_verified?: string | null
          meta_keywords?: string | null
          meta_no_index?: boolean | null
          namespace?: string | null
          publish_status?:
            | Database["public"]["Enums"]["enum_payload_resources_publish_status"]
            | null
          relationship_count?: number | null
          resource_type?:
            | Database["public"]["Enums"]["enum_payload_resources_resource_type"]
            | null
          review_rejection_reason?: string | null
          review_review_notes?: string | null
          review_reviewed_at?: string | null
          review_reviewed_by_id?: number | null
          subcategory_id?: number | null
          title?: string | null
          updated_at?: string
          url?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_category_id_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_difficulty_id_difficulty_levels_id_fk"
            columns: ["difficulty_id"]
            isOneToOne: false
            referencedRelation: "difficulty_levels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_discovery_source_id_payload_resource_sources_"
            columns: ["discovery_source_id"]
            isOneToOne: false
            referencedRelation: "payload_resource_sources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_github_language_id_programming_languages_id_f"
            columns: ["github_language_id"]
            isOneToOne: false
            referencedRelation: "programming_languages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_review_reviewed_by_id_users_id_fk"
            columns: ["review_reviewed_by_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_subcategory_id_subcategories_id_fk"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_ai_doc_relationships: {
        Row: {
          _order: number
          _parent_id: number
          confidence: number | null
          doc_slug: string | null
          doc_title: string | null
          id: string
          is_approved: boolean | null
          reasoning: string | null
          relationship_type:
            | Database["public"]["Enums"]["res_doc_rel_type"]
            | null
        }
        Insert: {
          _order: number
          _parent_id: number
          confidence?: number | null
          doc_slug?: string | null
          doc_title?: string | null
          id: string
          is_approved?: boolean | null
          reasoning?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["res_doc_rel_type"]
            | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          confidence?: number | null
          doc_slug?: string | null
          doc_title?: string | null
          id?: string
          is_approved?: boolean | null
          reasoning?: string | null
          relationship_type?:
            | Database["public"]["Enums"]["res_doc_rel_type"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_ai_doc_relationships_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_ai_resource_relationships: {
        Row: {
          _order: number
          _parent_id: number
          confidence: number | null
          id: string
          relationship_type:
            | Database["public"]["Enums"]["res_res_rel_type"]
            | null
          resource_id: string | null
          resource_title: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          confidence?: number | null
          id: string
          relationship_type?:
            | Database["public"]["Enums"]["res_res_rel_type"]
            | null
          resource_id?: string | null
          resource_title?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          confidence?: number | null
          id?: string
          relationship_type?:
            | Database["public"]["Enums"]["res_res_rel_type"]
            | null
          resource_id?: string | null
          resource_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_ai_resource_relationships_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_cons: {
        Row: {
          _order: number
          _parent_id: number
          con: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: number
          con?: string | null
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          con?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_cons_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_key_features: {
        Row: {
          _order: number
          _parent_id: number
          description: string | null
          feature: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: number
          description?: string | null
          feature?: string | null
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          description?: string | null
          feature?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_key_features_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_locales: {
        Row: {
          _locale: unknown[]
          _parent_id: number
          id: number
          meta_description: string | null
          meta_image_id: number | null
          meta_title: string | null
        }
        Insert: {
          _locale: unknown[]
          _parent_id: number
          id?: number
          meta_description?: string | null
          meta_image_id?: number | null
          meta_title?: string | null
        }
        Update: {
          _locale?: unknown[]
          _parent_id?: number
          id?: number
          meta_description?: string | null
          meta_image_id?: number | null
          meta_title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_locales_meta_image_id_media_id_fk"
            columns: ["meta_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_locales_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_pros: {
        Row: {
          _order: number
          _parent_id: number
          id: string
          pro: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          id: string
          pro?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          id?: string
          pro?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_pros_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_rels: {
        Row: {
          documents_id: number | null
          id: number
          order: number | null
          parent_id: number
          path: string
          payload_resources_id: number | null
          tags_id: number | null
        }
        Insert: {
          documents_id?: number | null
          id?: number
          order?: number | null
          parent_id: number
          path: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Update: {
          documents_id?: number | null
          id?: number
          order?: number | null
          parent_id?: number
          path?: string
          payload_resources_id?: number | null
          tags_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_rels_documents_fk"
            columns: ["documents_id"]
            isOneToOne: false
            referencedRelation: "documents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_rels_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_rels_resources_fk"
            columns: ["payload_resources_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payload_resources_rels_tags_fk"
            columns: ["tags_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      payload_resources_use_cases: {
        Row: {
          _order: number
          _parent_id: number
          description: string | null
          id: string
          use_case: string | null
        }
        Insert: {
          _order: number
          _parent_id: number
          description?: string | null
          id: string
          use_case?: string | null
        }
        Update: {
          _order?: number
          _parent_id?: number
          description?: string | null
          id?: string
          use_case?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payload_resources_use_cases_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "payload_resources"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          github_username: string | null
          id: string
          is_beta_tester: boolean | null
          is_verified: boolean | null
          twitter_handle: string | null
          updated_at: string | null
          user_id: string
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          github_username?: string | null
          id?: string
          is_beta_tester?: boolean | null
          is_verified?: boolean | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id: string
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          github_username?: string | null
          id?: string
          is_beta_tester?: boolean | null
          is_verified?: boolean | null
          twitter_handle?: string | null
          updated_at?: string | null
          user_id?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      programming_languages: {
        Row: {
          color: string
          created_at: string
          icon: string | null
          id: number
          name: string
          resource_count: number | null
          slug: string
          updated_at: string
          website: string | null
        }
        Insert: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: number
          name: string
          resource_count?: number | null
          slug: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          color?: string
          created_at?: string
          icon?: string | null
          id?: number
          name?: string
          resource_count?: number | null
          slug?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      programming_languages_aliases: {
        Row: {
          _order: number
          _parent_id: number
          alias: string | null
          id: string
        }
        Insert: {
          _order: number
          _parent_id: number
          alias?: string | null
          id: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          alias?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "programming_languages_aliases_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "programming_languages"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_categories: {
        Row: {
          created_at: string
          description: string | null
          display_order: number | null
          icon: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          display_order?: number | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      prompt_ratings: {
        Row: {
          created_at: string
          id: string
          prompt_id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          prompt_id: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          prompt_id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_ratings_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      prompt_usage: {
        Row: {
          context: string | null
          created_at: string
          fingerprint_hash: string | null
          id: string
          prompt_id: string
          user_id: string | null
          variables_used: Json | null
        }
        Insert: {
          context?: string | null
          created_at?: string
          fingerprint_hash?: string | null
          id?: string
          prompt_id: string
          user_id?: string | null
          variables_used?: Json | null
        }
        Update: {
          context?: string | null
          created_at?: string
          fingerprint_hash?: string | null
          id?: string
          prompt_id?: string
          user_id?: string | null
          variables_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "prompt_usage_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompt_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      prompts: {
        Row: {
          author_id: string | null
          avg_rating: number | null
          category_id: string | null
          content: string
          created_at: string
          description: string | null
          id: string
          is_featured: boolean | null
          is_system: boolean | null
          like_count: number | null
          moderation_notes: string | null
          rating_count: number | null
          save_count: number | null
          slug: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
          use_count: number | null
          variables: Json | null
          visibility: string
        }
        Insert: {
          author_id?: string | null
          avg_rating?: number | null
          category_id?: string | null
          content: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_system?: boolean | null
          like_count?: number | null
          moderation_notes?: string | null
          rating_count?: number | null
          save_count?: number | null
          slug: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
          use_count?: number | null
          variables?: Json | null
          visibility?: string
        }
        Update: {
          author_id?: string | null
          avg_rating?: number | null
          category_id?: string | null
          content?: string
          created_at?: string
          description?: string | null
          id?: string
          is_featured?: boolean | null
          is_system?: boolean | null
          like_count?: number | null
          moderation_notes?: string | null
          rating_count?: number | null
          save_count?: number | null
          slug?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          use_count?: number | null
          variables?: Json | null
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompts_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "prompts_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "prompt_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth_key: string
          created_at: string | null
          device_name: string | null
          endpoint: string
          id: string
          last_used_at: string | null
          p256dh_key: string
          updated_at: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          auth_key: string
          created_at?: string | null
          device_name?: string | null
          endpoint: string
          id?: string
          last_used_at?: string | null
          p256dh_key: string
          updated_at?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          auth_key?: string
          created_at?: string | null
          device_name?: string | null
          endpoint?: string
          id?: string
          last_used_at?: string | null
          p256dh_key?: string
          updated_at?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          resource_id: string
          resource_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          resource_id: string
          resource_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          resource_id?: string
          resource_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_list_items: {
        Row: {
          added_at: string | null
          completed_at: string | null
          id: string
          list_id: string
          notes: string | null
          progress: number | null
          resource_id: string
          resource_type: string
          started_at: string | null
          status: string | null
          title: string | null
          url: string | null
          user_id: string
        }
        Insert: {
          added_at?: string | null
          completed_at?: string | null
          id?: string
          list_id: string
          notes?: string | null
          progress?: number | null
          resource_id: string
          resource_type: string
          started_at?: string | null
          status?: string | null
          title?: string | null
          url?: string | null
          user_id: string
        }
        Update: {
          added_at?: string | null
          completed_at?: string | null
          id?: string
          list_id?: string
          notes?: string | null
          progress?: number | null
          resource_id?: string
          resource_type?: string
          started_at?: string | null
          status?: string | null
          title?: string | null
          url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "reading_lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reading_list_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      reading_lists: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_public: boolean | null
          item_count: number | null
          name: string
          slug: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          item_count?: number | null
          name: string
          slug: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_public?: boolean | null
          item_count?: number | null
          name?: string
          slug?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reading_lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      relationship_analysis_jobs: {
        Row: {
          ai_model: string | null
          completed_at: string | null
          cost_estimate: number | null
          created_at: string | null
          discovered_relationships: Json | null
          error_details: Json | null
          error_message: string | null
          id: string
          job_type: string
          progress_current: number | null
          progress_total: number | null
          relationships_created: number | null
          relationships_skipped: number | null
          relationships_updated: number | null
          started_at: string | null
          status: string
          target_id: string
          target_type: string
          tokens_used: number | null
          trigger_type: string | null
          triggered_by: string | null
        }
        Insert: {
          ai_model?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          discovered_relationships?: Json | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type: string
          progress_current?: number | null
          progress_total?: number | null
          relationships_created?: number | null
          relationships_skipped?: number | null
          relationships_updated?: number | null
          started_at?: string | null
          status?: string
          target_id: string
          target_type: string
          tokens_used?: number | null
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Update: {
          ai_model?: string | null
          completed_at?: string | null
          cost_estimate?: number | null
          created_at?: string | null
          discovered_relationships?: Json | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          job_type?: string
          progress_current?: number | null
          progress_total?: number | null
          relationships_created?: number | null
          relationships_skipped?: number | null
          relationships_updated?: number | null
          started_at?: string | null
          status?: string
          target_id?: string
          target_type?: string
          tokens_used?: number | null
          trigger_type?: string | null
          triggered_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "relationship_analysis_jobs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          action_taken: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          report_type: string
          reported_comment_id: string | null
          reported_user_id: string | null
          reporter_id: string
          reporter_message: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          action_taken?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          report_type: string
          reported_comment_id?: string | null
          reported_user_id?: string | null
          reporter_id: string
          reporter_message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          action_taken?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reported_comment_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string
          reporter_message?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_comment_id_fkey"
            columns: ["reported_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_alternatives: {
        Row: {
          alternative_resource_id: string
          created_at: string | null
          id: string
          notes: string | null
          relationship: string | null
          resource_id: string
        }
        Insert: {
          alternative_resource_id: string
          created_at?: string | null
          id?: string
          notes?: string | null
          relationship?: string | null
          resource_id: string
        }
        Update: {
          alternative_resource_id?: string
          created_at?: string | null
          id?: string
          notes?: string | null
          relationship?: string | null
          resource_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_alternatives_alternative_resource_id_fkey"
            columns: ["alternative_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_alternatives_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_authors: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          github_username: string | null
          id: string
          is_primary: boolean | null
          name: string
          resource_id: string
          role: string | null
          twitter_username: string | null
          user_id: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          github_username?: string | null
          id?: string
          is_primary?: boolean | null
          name: string
          resource_id: string
          role?: string | null
          twitter_username?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          github_username?: string | null
          id?: string
          is_primary?: boolean | null
          name?: string
          resource_id?: string
          role?: string | null
          twitter_username?: string | null
          user_id?: string | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_authors_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_authors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_changelog: {
        Row: {
          ai_summary: string | null
          applied_at: string | null
          applied_by: string | null
          changes: Json
          id: string
          resource_id: string
          source_type: string | null
          source_urls: string[] | null
          stats_snapshot: Json | null
          update_job_id: string | null
          version: number
        }
        Insert: {
          ai_summary?: string | null
          applied_at?: string | null
          applied_by?: string | null
          changes: Json
          id?: string
          resource_id: string
          source_type?: string | null
          source_urls?: string[] | null
          stats_snapshot?: Json | null
          update_job_id?: string | null
          version?: number
        }
        Update: {
          ai_summary?: string | null
          applied_at?: string | null
          applied_by?: string | null
          changes?: Json
          id?: string
          resource_id?: string
          source_type?: string | null
          source_urls?: string[] | null
          stats_snapshot?: Json | null
          update_job_id?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "resource_changelog_applied_by_fkey"
            columns: ["applied_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_changelog_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_changelog_update_job_id_fkey"
            columns: ["update_job_id"]
            isOneToOne: false
            referencedRelation: "resource_update_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "resource_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_comments: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          moderated_at: string | null
          moderated_by: string | null
          parent_id: string | null
          resource_id: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          parent_id?: string | null
          resource_id: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          moderated_at?: string | null
          moderated_by?: string | null
          parent_id?: string | null
          resource_id?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_comments_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "resource_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_comments_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_discovery_queue: {
        Row: {
          created_at: string | null
          discovered_at: string | null
          discovered_data: Json | null
          discovered_description: string | null
          discovered_title: string | null
          discovered_url: string
          id: string
          rejection_reason: string | null
          resource_id: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          source_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discovered_at?: string | null
          discovered_data?: Json | null
          discovered_description?: string | null
          discovered_title?: string | null
          discovered_url: string
          id?: string
          rejection_reason?: string | null
          resource_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discovered_at?: string | null
          discovered_data?: Json | null
          discovered_description?: string | null
          discovered_title?: string | null
          discovered_url?: string
          id?: string
          rejection_reason?: string | null
          resource_id?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          source_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_discovery_queue_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_discovery_queue_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_discovery_queue_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "resource_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_favorites: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_favorites_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_favorites_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_rating_stats: {
        Row: {
          average_rating: number | null
          id: string
          rating_1_count: number | null
          rating_2_count: number | null
          rating_3_count: number | null
          rating_4_count: number | null
          rating_5_count: number | null
          rating_count: number | null
          resource_id: string
          resource_type: string
          review_count: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          id?: string
          rating_1_count?: number | null
          rating_2_count?: number | null
          rating_3_count?: number | null
          rating_4_count?: number | null
          rating_5_count?: number | null
          rating_count?: number | null
          resource_id: string
          resource_type: string
          review_count?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          id?: string
          rating_1_count?: number | null
          rating_2_count?: number | null
          rating_3_count?: number | null
          rating_4_count?: number | null
          rating_5_count?: number | null
          rating_count?: number | null
          resource_id?: string
          resource_type?: string
          review_count?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resource_ratings: {
        Row: {
          created_at: string | null
          id: string
          rating: number
          resource_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          rating: number
          resource_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          rating?: number
          resource_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_ratings_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_relationships: {
        Row: {
          ai_model: string | null
          ai_reasoning: string | null
          analyzed_at: string | null
          confidence_score: number
          created_at: string | null
          display_priority: number | null
          id: string
          is_active: boolean | null
          is_bidirectional: boolean | null
          is_manual: boolean | null
          relationship_type: string
          shared_tags: string[] | null
          similarity_factors: Json | null
          source_resource_id: string
          target_resource_id: string
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          confidence_score: number
          created_at?: string | null
          display_priority?: number | null
          id?: string
          is_active?: boolean | null
          is_bidirectional?: boolean | null
          is_manual?: boolean | null
          relationship_type: string
          shared_tags?: string[] | null
          similarity_factors?: Json | null
          source_resource_id: string
          target_resource_id: string
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          confidence_score?: number
          created_at?: string | null
          display_priority?: number | null
          id?: string
          is_active?: boolean | null
          is_bidirectional?: boolean | null
          is_manual?: boolean | null
          relationship_type?: string
          shared_tags?: string[] | null
          similarity_factors?: Json | null
          source_resource_id?: string
          target_resource_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_relationships_source_resource_id_fkey"
            columns: ["source_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_relationships_target_resource_id_fkey"
            columns: ["target_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_resource_relationships: {
        Row: {
          ai_model: string | null
          ai_reasoning: string | null
          analyzed_at: string | null
          confidence_score: number
          created_at: string | null
          display_priority: number | null
          id: string
          is_active: boolean | null
          is_bidirectional: boolean | null
          is_manual: boolean | null
          relationship_type: string
          shared_tags: string[] | null
          similarity_factors: Json | null
          source_resource_id: string
          target_resource_id: string
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          confidence_score?: number
          created_at?: string | null
          display_priority?: number | null
          id?: string
          is_active?: boolean | null
          is_bidirectional?: boolean | null
          is_manual?: boolean | null
          relationship_type?: string
          shared_tags?: string[] | null
          similarity_factors?: Json | null
          source_resource_id: string
          target_resource_id: string
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_reasoning?: string | null
          analyzed_at?: string | null
          confidence_score?: number
          created_at?: string | null
          display_priority?: number | null
          id?: string
          is_active?: boolean | null
          is_bidirectional?: boolean | null
          is_manual?: boolean | null
          relationship_type?: string
          shared_tags?: string[] | null
          similarity_factors?: Json | null
          source_resource_id?: string
          target_resource_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_resource_relationships_source_resource_id_fkey"
            columns: ["source_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_resource_relationships_target_resource_id_fkey"
            columns: ["target_resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_review_votes: {
        Row: {
          created_at: string | null
          id: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_helpful: boolean
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_helpful?: boolean
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "resource_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_reviews: {
        Row: {
          cons: string[] | null
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          moderated_at: string | null
          moderated_by: string | null
          moderation_notes: string | null
          not_helpful_count: number | null
          pros: string[] | null
          rating: number
          resource_id: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cons?: string[] | null
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          not_helpful_count?: number | null
          pros?: string[] | null
          rating: number
          resource_id: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cons?: string[] | null
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          moderated_at?: string | null
          moderated_by?: string | null
          moderation_notes?: string | null
          not_helpful_count?: number | null
          pros?: string[] | null
          rating?: number
          resource_id?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_reviews_moderated_by_fkey"
            columns: ["moderated_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_reviews_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_sources: {
        Row: {
          auto_approve: boolean | null
          awesome_config: Json | null
          created_at: string | null
          created_by: string | null
          default_category: string | null
          default_subcategory: string | null
          default_tags: string[] | null
          description: string | null
          exclude_patterns: string[] | null
          github_config: Json | null
          id: string
          include_patterns: string[] | null
          is_active: boolean | null
          last_discovered_count: number | null
          last_scan_error: string | null
          last_scan_status: string | null
          last_scanned_at: string | null
          min_downloads: number | null
          min_stars: number | null
          name: string
          next_scan_at: string | null
          notes: string | null
          pending_count: number | null
          registry_config: Json | null
          resource_count: number | null
          scan_frequency: string | null
          type: string
          updated_at: string | null
          url: string
        }
        Insert: {
          auto_approve?: boolean | null
          awesome_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_category?: string | null
          default_subcategory?: string | null
          default_tags?: string[] | null
          description?: string | null
          exclude_patterns?: string[] | null
          github_config?: Json | null
          id?: string
          include_patterns?: string[] | null
          is_active?: boolean | null
          last_discovered_count?: number | null
          last_scan_error?: string | null
          last_scan_status?: string | null
          last_scanned_at?: string | null
          min_downloads?: number | null
          min_stars?: number | null
          name: string
          next_scan_at?: string | null
          notes?: string | null
          pending_count?: number | null
          registry_config?: Json | null
          resource_count?: number | null
          scan_frequency?: string | null
          type: string
          updated_at?: string | null
          url: string
        }
        Update: {
          auto_approve?: boolean | null
          awesome_config?: Json | null
          created_at?: string | null
          created_by?: string | null
          default_category?: string | null
          default_subcategory?: string | null
          default_tags?: string[] | null
          description?: string | null
          exclude_patterns?: string[] | null
          github_config?: Json | null
          id?: string
          include_patterns?: string[] | null
          is_active?: boolean | null
          last_discovered_count?: number | null
          last_scan_error?: string | null
          last_scan_status?: string | null
          last_scanned_at?: string | null
          min_downloads?: number | null
          min_stars?: number | null
          name?: string
          next_scan_at?: string | null
          notes?: string | null
          pending_count?: number | null
          registry_config?: Json | null
          resource_count?: number | null
          scan_frequency?: string | null
          type?: string
          updated_at?: string | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_sources_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_tags: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string
          tag: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_id: string
          tag: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_tags_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_update_jobs: {
        Row: {
          ai_model: string | null
          ai_summary: string | null
          analyzed_at: string | null
          completed_at: string | null
          created_at: string | null
          error_details: Json | null
          error_message: string | null
          id: string
          new_screenshots: string[] | null
          overall_confidence: number | null
          proposed_changes: Json | null
          resource_id: string
          retry_count: number | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          scrape_errors: Json | null
          scraped_at: string | null
          scraped_content: Json | null
          screenshot_errors: string[] | null
          selected_changes: Json | null
          status: string
          trigger_type: string
          triggered_by: string | null
          updated_at: string | null
        }
        Insert: {
          ai_model?: string | null
          ai_summary?: string | null
          analyzed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          new_screenshots?: string[] | null
          overall_confidence?: number | null
          proposed_changes?: Json | null
          resource_id: string
          retry_count?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scrape_errors?: Json | null
          scraped_at?: string | null
          scraped_content?: Json | null
          screenshot_errors?: string[] | null
          selected_changes?: Json | null
          status?: string
          trigger_type: string
          triggered_by?: string | null
          updated_at?: string | null
        }
        Update: {
          ai_model?: string | null
          ai_summary?: string | null
          analyzed_at?: string | null
          completed_at?: string | null
          created_at?: string | null
          error_details?: Json | null
          error_message?: string | null
          id?: string
          new_screenshots?: string[] | null
          overall_confidence?: number | null
          proposed_changes?: Json | null
          resource_id?: string
          retry_count?: number | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          scrape_errors?: Json | null
          scraped_at?: string | null
          scraped_content?: Json | null
          screenshot_errors?: string[] | null
          selected_changes?: Json | null
          status?: string
          trigger_type?: string
          triggered_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_update_jobs_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_update_jobs_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_update_jobs_triggered_by_fkey"
            columns: ["triggered_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_view_stats: {
        Row: {
          last_viewed_at: string | null
          resource_id: string
          resource_type: string
          total_views: number | null
          unique_views: number | null
          updated_at: string | null
          views_month: number | null
          views_today: number | null
          views_week: number | null
        }
        Insert: {
          last_viewed_at?: string | null
          resource_id: string
          resource_type: string
          total_views?: number | null
          unique_views?: number | null
          updated_at?: string | null
          views_month?: number | null
          views_today?: number | null
          views_week?: number | null
        }
        Update: {
          last_viewed_at?: string | null
          resource_id?: string
          resource_type?: string
          total_views?: number | null
          unique_views?: number | null
          updated_at?: string | null
          views_month?: number | null
          views_today?: number | null
          views_week?: number | null
        }
        Relationships: []
      }
      resource_view_stats_daily: {
        Row: {
          date: string
          id: string
          resource_id: string
          unique_visitors: number | null
          views: number | null
        }
        Insert: {
          date: string
          id?: string
          resource_id: string
          unique_visitors?: number | null
          views?: number | null
        }
        Update: {
          date?: string
          id?: string
          resource_id?: string
          unique_visitors?: number | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_view_stats_daily_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_views: {
        Row: {
          created_at: string | null
          id: string
          ip_hash: string | null
          referrer: string | null
          resource_id: string
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          resource_id: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_hash?: string | null
          referrer?: string | null
          resource_id?: string
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_views_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          added_at: string | null
          ai_analyzed_at: string | null
          ai_confidence: number | null
          ai_overview: string | null
          ai_summary: string | null
          auto_update_enabled: boolean | null
          average_rating: number | null
          banner_url: string | null
          category: string
          changelog_count: number | null
          changelog_url: string | null
          comments_count: number | null
          cons: string[] | null
          content_hash: string | null
          created_at: string | null
          description: string
          difficulty: string | null
          discord_url: string | null
          docs_url: string | null
          favorites_count: number | null
          featured_reason: string | null
          github_contributors: number | null
          github_forks: number | null
          github_issues: number | null
          github_language: string | null
          github_last_commit: string | null
          github_owner: string | null
          github_repo: string | null
          github_stars: number | null
          icon_url: string | null
          id: string
          is_featured: boolean | null
          is_published: boolean | null
          key_features: string[] | null
          last_auto_updated_at: string | null
          last_synced_at: string | null
          last_update_job_id: string | null
          last_verified_at: string | null
          license: string | null
          long_description: string | null
          meta_description: string | null
          meta_title: string | null
          namespace: string | null
          npm_downloads_weekly: number | null
          npm_package: string | null
          og_image_url: string | null
          platforms: string[] | null
          prerequisites: string[] | null
          price_details: Json | null
          pricing: string | null
          primary_screenshot_url: string | null
          pros: string[] | null
          pypi_downloads_monthly: number | null
          pypi_package: string | null
          ratings_count: number | null
          related_doc_slugs: string[] | null
          related_docs_count: number | null
          related_resource_slugs: string[] | null
          related_resources_count: number | null
          reviews_count: number | null
          screenshot_metadata: Json | null
          screenshots: string[] | null
          slug: string
          status: string | null
          subcategory: string | null
          target_audience: string[] | null
          thumbnail_url: string | null
          title: string
          trending_calculated_at: string | null
          trending_score: number | null
          twitter_url: string | null
          update_frequency: string | null
          update_notes: string | null
          updated_at: string | null
          url: string
          use_cases: string[] | null
          version: string | null
          video_url: string | null
          views_count: number | null
          views_this_week: number | null
          website_url: string | null
        }
        Insert: {
          added_at?: string | null
          ai_analyzed_at?: string | null
          ai_confidence?: number | null
          ai_overview?: string | null
          ai_summary?: string | null
          auto_update_enabled?: boolean | null
          average_rating?: number | null
          banner_url?: string | null
          category: string
          changelog_count?: number | null
          changelog_url?: string | null
          comments_count?: number | null
          cons?: string[] | null
          content_hash?: string | null
          created_at?: string | null
          description: string
          difficulty?: string | null
          discord_url?: string | null
          docs_url?: string | null
          favorites_count?: number | null
          featured_reason?: string | null
          github_contributors?: number | null
          github_forks?: number | null
          github_issues?: number | null
          github_language?: string | null
          github_last_commit?: string | null
          github_owner?: string | null
          github_repo?: string | null
          github_stars?: number | null
          icon_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          key_features?: string[] | null
          last_auto_updated_at?: string | null
          last_synced_at?: string | null
          last_update_job_id?: string | null
          last_verified_at?: string | null
          license?: string | null
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          namespace?: string | null
          npm_downloads_weekly?: number | null
          npm_package?: string | null
          og_image_url?: string | null
          platforms?: string[] | null
          prerequisites?: string[] | null
          price_details?: Json | null
          pricing?: string | null
          primary_screenshot_url?: string | null
          pros?: string[] | null
          pypi_downloads_monthly?: number | null
          pypi_package?: string | null
          ratings_count?: number | null
          related_doc_slugs?: string[] | null
          related_docs_count?: number | null
          related_resource_slugs?: string[] | null
          related_resources_count?: number | null
          reviews_count?: number | null
          screenshot_metadata?: Json | null
          screenshots?: string[] | null
          slug: string
          status?: string | null
          subcategory?: string | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title: string
          trending_calculated_at?: string | null
          trending_score?: number | null
          twitter_url?: string | null
          update_frequency?: string | null
          update_notes?: string | null
          updated_at?: string | null
          url: string
          use_cases?: string[] | null
          version?: string | null
          video_url?: string | null
          views_count?: number | null
          views_this_week?: number | null
          website_url?: string | null
        }
        Update: {
          added_at?: string | null
          ai_analyzed_at?: string | null
          ai_confidence?: number | null
          ai_overview?: string | null
          ai_summary?: string | null
          auto_update_enabled?: boolean | null
          average_rating?: number | null
          banner_url?: string | null
          category?: string
          changelog_count?: number | null
          changelog_url?: string | null
          comments_count?: number | null
          cons?: string[] | null
          content_hash?: string | null
          created_at?: string | null
          description?: string
          difficulty?: string | null
          discord_url?: string | null
          docs_url?: string | null
          favorites_count?: number | null
          featured_reason?: string | null
          github_contributors?: number | null
          github_forks?: number | null
          github_issues?: number | null
          github_language?: string | null
          github_last_commit?: string | null
          github_owner?: string | null
          github_repo?: string | null
          github_stars?: number | null
          icon_url?: string | null
          id?: string
          is_featured?: boolean | null
          is_published?: boolean | null
          key_features?: string[] | null
          last_auto_updated_at?: string | null
          last_synced_at?: string | null
          last_update_job_id?: string | null
          last_verified_at?: string | null
          license?: string | null
          long_description?: string | null
          meta_description?: string | null
          meta_title?: string | null
          namespace?: string | null
          npm_downloads_weekly?: number | null
          npm_package?: string | null
          og_image_url?: string | null
          platforms?: string[] | null
          prerequisites?: string[] | null
          price_details?: Json | null
          pricing?: string | null
          primary_screenshot_url?: string | null
          pros?: string[] | null
          pypi_downloads_monthly?: number | null
          pypi_package?: string | null
          ratings_count?: number | null
          related_doc_slugs?: string[] | null
          related_docs_count?: number | null
          related_resource_slugs?: string[] | null
          related_resources_count?: number | null
          reviews_count?: number | null
          screenshot_metadata?: Json | null
          screenshots?: string[] | null
          slug?: string
          status?: string | null
          subcategory?: string | null
          target_audience?: string[] | null
          thumbnail_url?: string | null
          title?: string
          trending_calculated_at?: string | null
          trending_score?: number | null
          twitter_url?: string | null
          update_frequency?: string | null
          update_notes?: string | null
          updated_at?: string | null
          url?: string
          use_cases?: string[] | null
          version?: string | null
          video_url?: string | null
          views_count?: number | null
          views_this_week?: number | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resources_last_update_job_id_fkey"
            columns: ["last_update_job_id"]
            isOneToOne: false
            referencedRelation: "resource_update_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      review_helpful_votes: {
        Row: {
          created_at: string | null
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_helpful_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_helpful_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          content: string
          created_at: string | null
          helpful_count: number | null
          id: string
          rating: number
          reported: boolean | null
          resource_id: string
          resource_type: string
          status: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating: number
          reported?: boolean | null
          resource_id: string
          resource_type: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          helpful_count?: number | null
          id?: string
          rating?: number
          reported?: boolean | null
          resource_id?: string
          resource_type?: string
          status?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_searches: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          last_used_at: string | null
          name: string
          query: string
          use_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_used_at?: string | null
          name: string
          query: string
          use_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          last_used_at?: string | null
          name?: string
          query?: string
          use_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_searches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      search_analytics: {
        Row: {
          id: string
          last_searched_at: string | null
          normalized_query: string
          query: string
          results_found_avg: number | null
          search_count: number | null
        }
        Insert: {
          id?: string
          last_searched_at?: string | null
          normalized_query: string
          query: string
          results_found_avg?: number | null
          search_count?: number | null
        }
        Update: {
          id?: string
          last_searched_at?: string | null
          normalized_query?: string
          query?: string
          results_found_avg?: number | null
          search_count?: number | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          filters: Json | null
          id: string
          query: string
          results_count: number | null
          searched_at: string | null
          user_id: string
        }
        Insert: {
          filters?: Json | null
          id?: string
          query: string
          results_count?: number | null
          searched_at?: string | null
          user_id: string
        }
        Update: {
          filters?: Json | null
          id?: string
          query?: string
          results_count?: number | null
          searched_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "search_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          bot_bypassed: boolean | null
          bot_category: string | null
          bot_name: string | null
          created_at: string | null
          endpoint: string | null
          event_type: string
          fingerprint_components: Json | null
          fingerprint_confidence: number | null
          geo_city: string | null
          geo_country: string | null
          honeypot_config_id: string | null
          honeypot_served: boolean | null
          id: string
          ip_address: unknown
          is_bot: boolean | null
          is_human: boolean | null
          is_verified_bot: boolean | null
          metadata: Json | null
          method: string | null
          origin: string | null
          referer: string | null
          request_id: string
          response_time_ms: number | null
          severity: string | null
          status_code: number | null
          user_agent: string | null
          user_id: string | null
          visitor_id: string | null
        }
        Insert: {
          bot_bypassed?: boolean | null
          bot_category?: string | null
          bot_name?: string | null
          created_at?: string | null
          endpoint?: string | null
          event_type: string
          fingerprint_components?: Json | null
          fingerprint_confidence?: number | null
          geo_city?: string | null
          geo_country?: string | null
          honeypot_config_id?: string | null
          honeypot_served?: boolean | null
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_human?: boolean | null
          is_verified_bot?: boolean | null
          metadata?: Json | null
          method?: string | null
          origin?: string | null
          referer?: string | null
          request_id: string
          response_time_ms?: number | null
          severity?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Update: {
          bot_bypassed?: boolean | null
          bot_category?: string | null
          bot_name?: string | null
          created_at?: string | null
          endpoint?: string | null
          event_type?: string
          fingerprint_components?: Json | null
          fingerprint_confidence?: number | null
          geo_city?: string | null
          geo_country?: string | null
          honeypot_config_id?: string | null
          honeypot_served?: boolean | null
          id?: string
          ip_address?: unknown
          is_bot?: boolean | null
          is_human?: boolean | null
          is_verified_bot?: boolean | null
          metadata?: Json | null
          method?: string | null
          origin?: string | null
          referer?: string | null
          request_id?: string
          response_time_ms?: number | null
          severity?: string | null
          status_code?: number | null
          user_agent?: string | null
          user_id?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      security_settings: {
        Row: {
          category: string | null
          created_at: string | null
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
          value_type: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
          value_type?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
          value_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "security_settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings: {
        Row: {
          advanced_canonical_domain: string | null
          advanced_default_hreflang: string | null
          advanced_hreflang_enabled: boolean | null
          advanced_trailing_slash: boolean | null
          advanced_www_redirect:
            | Database["public"]["Enums"]["enum_seo_settings_advanced_www_redirect"]
            | null
          analytics_enable_vercel_analytics: boolean | null
          analytics_google_analytics_id: string | null
          analytics_google_tag_manager_id: string | null
          analytics_plausible_domain: string | null
          created_at: string | null
          id: number
          index_now_api_key: string | null
          index_now_enabled: boolean | null
          meta_author: string | null
          meta_default_description: string | null
          meta_default_title: string | null
          meta_keywords: string | null
          meta_theme_color: string | null
          meta_title_template: string | null
          open_graph_default_image_id: number | null
          open_graph_image_alt: string | null
          open_graph_locale: string | null
          open_graph_site_name: string | null
          open_graph_type:
            | Database["public"]["Enums"]["enum_seo_settings_open_graph_type"]
            | null
          robots_follow_links: boolean | null
          robots_index_site: boolean | null
          robots_sitemap_change_freq:
            | Database["public"]["Enums"]["enum_seo_settings_robots_sitemap_change_freq"]
            | null
          robots_sitemap_enabled: boolean | null
          robots_sitemap_priority: number | null
          structured_data_contact_email: string | null
          structured_data_contact_type: string | null
          structured_data_logo_id: number | null
          structured_data_organization_name: string | null
          structured_data_organization_type:
            | Database["public"]["Enums"]["enum_seo_settings_structured_data_organization_type"]
            | null
          twitter_card_type:
            | Database["public"]["Enums"]["enum_seo_settings_twitter_card_type"]
            | null
          twitter_creator: string | null
          twitter_site: string | null
          updated_at: string | null
          verification_bing: string | null
          verification_google: string | null
          verification_pinterest: string | null
          verification_yandex: string | null
        }
        Insert: {
          advanced_canonical_domain?: string | null
          advanced_default_hreflang?: string | null
          advanced_hreflang_enabled?: boolean | null
          advanced_trailing_slash?: boolean | null
          advanced_www_redirect?:
            | Database["public"]["Enums"]["enum_seo_settings_advanced_www_redirect"]
            | null
          analytics_enable_vercel_analytics?: boolean | null
          analytics_google_analytics_id?: string | null
          analytics_google_tag_manager_id?: string | null
          analytics_plausible_domain?: string | null
          created_at?: string | null
          id?: number
          index_now_api_key?: string | null
          index_now_enabled?: boolean | null
          meta_author?: string | null
          meta_default_description?: string | null
          meta_default_title?: string | null
          meta_keywords?: string | null
          meta_theme_color?: string | null
          meta_title_template?: string | null
          open_graph_default_image_id?: number | null
          open_graph_image_alt?: string | null
          open_graph_locale?: string | null
          open_graph_site_name?: string | null
          open_graph_type?:
            | Database["public"]["Enums"]["enum_seo_settings_open_graph_type"]
            | null
          robots_follow_links?: boolean | null
          robots_index_site?: boolean | null
          robots_sitemap_change_freq?:
            | Database["public"]["Enums"]["enum_seo_settings_robots_sitemap_change_freq"]
            | null
          robots_sitemap_enabled?: boolean | null
          robots_sitemap_priority?: number | null
          structured_data_contact_email?: string | null
          structured_data_contact_type?: string | null
          structured_data_logo_id?: number | null
          structured_data_organization_name?: string | null
          structured_data_organization_type?:
            | Database["public"]["Enums"]["enum_seo_settings_structured_data_organization_type"]
            | null
          twitter_card_type?:
            | Database["public"]["Enums"]["enum_seo_settings_twitter_card_type"]
            | null
          twitter_creator?: string | null
          twitter_site?: string | null
          updated_at?: string | null
          verification_bing?: string | null
          verification_google?: string | null
          verification_pinterest?: string | null
          verification_yandex?: string | null
        }
        Update: {
          advanced_canonical_domain?: string | null
          advanced_default_hreflang?: string | null
          advanced_hreflang_enabled?: boolean | null
          advanced_trailing_slash?: boolean | null
          advanced_www_redirect?:
            | Database["public"]["Enums"]["enum_seo_settings_advanced_www_redirect"]
            | null
          analytics_enable_vercel_analytics?: boolean | null
          analytics_google_analytics_id?: string | null
          analytics_google_tag_manager_id?: string | null
          analytics_plausible_domain?: string | null
          created_at?: string | null
          id?: number
          index_now_api_key?: string | null
          index_now_enabled?: boolean | null
          meta_author?: string | null
          meta_default_description?: string | null
          meta_default_title?: string | null
          meta_keywords?: string | null
          meta_theme_color?: string | null
          meta_title_template?: string | null
          open_graph_default_image_id?: number | null
          open_graph_image_alt?: string | null
          open_graph_locale?: string | null
          open_graph_site_name?: string | null
          open_graph_type?:
            | Database["public"]["Enums"]["enum_seo_settings_open_graph_type"]
            | null
          robots_follow_links?: boolean | null
          robots_index_site?: boolean | null
          robots_sitemap_change_freq?:
            | Database["public"]["Enums"]["enum_seo_settings_robots_sitemap_change_freq"]
            | null
          robots_sitemap_enabled?: boolean | null
          robots_sitemap_priority?: number | null
          structured_data_contact_email?: string | null
          structured_data_contact_type?: string | null
          structured_data_logo_id?: number | null
          structured_data_organization_name?: string | null
          structured_data_organization_type?:
            | Database["public"]["Enums"]["enum_seo_settings_structured_data_organization_type"]
            | null
          twitter_card_type?:
            | Database["public"]["Enums"]["enum_seo_settings_twitter_card_type"]
            | null
          twitter_creator?: string | null
          twitter_site?: string | null
          updated_at?: string | null
          verification_bing?: string | null
          verification_google?: string | null
          verification_pinterest?: string | null
          verification_yandex?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_settings_open_graph_default_image_id_media_id_fk"
            columns: ["open_graph_default_image_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seo_settings_structured_data_logo_id_media_id_fk"
            columns: ["structured_data_logo_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings_index_now_search_engines: {
        Row: {
          id: number
          order: number
          parent_id: number
          value:
            | Database["public"]["Enums"]["enum_seo_settings_index_now_search_engines"]
            | null
        }
        Insert: {
          id?: number
          order: number
          parent_id: number
          value?:
            | Database["public"]["Enums"]["enum_seo_settings_index_now_search_engines"]
            | null
        }
        Update: {
          id?: number
          order?: number
          parent_id?: number
          value?:
            | Database["public"]["Enums"]["enum_seo_settings_index_now_search_engines"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "seo_settings_index_now_search_engines_parent_fk"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "seo_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings_open_graph_alternate_locales: {
        Row: {
          _order: number
          _parent_id: number
          id: string
          locale: string
        }
        Insert: {
          _order: number
          _parent_id: number
          id: string
          locale: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          id?: string
          locale?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_settings_open_graph_alternate_locales_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "seo_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_settings_structured_data_same_as: {
        Row: {
          _order: number
          _parent_id: number
          id: string
          url: string
        }
        Insert: {
          _order: number
          _parent_id: number
          id: string
          url: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "seo_settings_structured_data_same_as_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "seo_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      session: {
        Row: {
          createdAt: string
          expiresAt: string
          id: string
          ipAddress: string | null
          token: string
          updatedAt: string
          userAgent: string | null
          userId: string
        }
        Insert: {
          createdAt?: string
          expiresAt: string
          id: string
          ipAddress?: string | null
          token: string
          updatedAt?: string
          userAgent?: string | null
          userId: string
        }
        Update: {
          createdAt?: string
          expiresAt?: string
          id?: string
          ipAddress?: string | null
          token?: string
          updatedAt?: string
          userAgent?: string | null
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          announcement_dismissible: boolean | null
          announcement_enabled: boolean | null
          announcement_expires_at: string | null
          announcement_link: string | null
          announcement_message: string | null
          announcement_type:
            | Database["public"]["Enums"]["enum_site_settings_announcement_type"]
            | null
          api_api_cors_origins: string | null
          api_api_rate_limit: number | null
          api_api_version: string | null
          api_enable_public_a_p_i: boolean | null
          contact_email: string | null
          contact_privacy_email: string | null
          contact_support_url: string | null
          created_at: string | null
          features_enable_achievements: boolean | null
          features_enable_analytics: boolean | null
          features_enable_chat: boolean | null
          features_enable_donations: boolean | null
          features_enable_search: boolean | null
          features_enable_sound_effects: boolean | null
          features_enable_user_registration: boolean | null
          features_enable_voice_assistant: boolean | null
          features_maintenance_allowed_i_ps: string | null
          features_maintenance_message: string | null
          features_maintenance_mode: boolean | null
          footer_copyright_text: string | null
          footer_show_build_info: boolean | null
          footer_show_version: boolean | null
          general_description: string
          general_favicon_id: number | null
          general_logo_id: number | null
          general_site_name: string
          general_tagline: string
          general_version: string | null
          id: number
          notifications_digest_frequency:
            | Database["public"]["Enums"]["enum_site_settings_notifications_digest_frequency"]
            | null
          notifications_email_from_address: string | null
          notifications_email_from_name: string | null
          notifications_enable_email_notifications: boolean | null
          notifications_enable_push_notifications: boolean | null
          notifications_notification_types_achievements: boolean | null
          notifications_notification_types_marketing: boolean | null
          notifications_notification_types_mentions: boolean | null
          notifications_notification_types_messages: boolean | null
          notifications_notification_types_security: boolean | null
          notifications_notification_types_updates: boolean | null
          performance_cache_revalidate_seconds: number | null
          performance_enable_i_s_r: boolean | null
          performance_enable_image_optimization: boolean | null
          performance_enable_lazy_providers: boolean | null
          performance_enable_prefetching: boolean | null
          performance_static_page_paths: string | null
          security_blocked_i_ps: string | null
          security_enable_bot_challenge: boolean | null
          security_enable_e2_e_e: boolean | null
          security_enable_fingerprinting: boolean | null
          security_enable_honeypots: boolean | null
          security_rate_limit_per_minute: number | null
          security_trusted_domains: string | null
          seo_google_analytics_id: string | null
          seo_og_image: string | null
          seo_twitter_handle: string | null
          social_bluesky: string | null
          social_discord: string | null
          social_github: string | null
          social_linkedin: string | null
          social_twitter: string | null
          social_youtube: string | null
          updated_at: string | null
        }
        Insert: {
          announcement_dismissible?: boolean | null
          announcement_enabled?: boolean | null
          announcement_expires_at?: string | null
          announcement_link?: string | null
          announcement_message?: string | null
          announcement_type?:
            | Database["public"]["Enums"]["enum_site_settings_announcement_type"]
            | null
          api_api_cors_origins?: string | null
          api_api_rate_limit?: number | null
          api_api_version?: string | null
          api_enable_public_a_p_i?: boolean | null
          contact_email?: string | null
          contact_privacy_email?: string | null
          contact_support_url?: string | null
          created_at?: string | null
          features_enable_achievements?: boolean | null
          features_enable_analytics?: boolean | null
          features_enable_chat?: boolean | null
          features_enable_donations?: boolean | null
          features_enable_search?: boolean | null
          features_enable_sound_effects?: boolean | null
          features_enable_user_registration?: boolean | null
          features_enable_voice_assistant?: boolean | null
          features_maintenance_allowed_i_ps?: string | null
          features_maintenance_message?: string | null
          features_maintenance_mode?: boolean | null
          footer_copyright_text?: string | null
          footer_show_build_info?: boolean | null
          footer_show_version?: boolean | null
          general_description?: string
          general_favicon_id?: number | null
          general_logo_id?: number | null
          general_site_name?: string
          general_tagline?: string
          general_version?: string | null
          id?: number
          notifications_digest_frequency?:
            | Database["public"]["Enums"]["enum_site_settings_notifications_digest_frequency"]
            | null
          notifications_email_from_address?: string | null
          notifications_email_from_name?: string | null
          notifications_enable_email_notifications?: boolean | null
          notifications_enable_push_notifications?: boolean | null
          notifications_notification_types_achievements?: boolean | null
          notifications_notification_types_marketing?: boolean | null
          notifications_notification_types_mentions?: boolean | null
          notifications_notification_types_messages?: boolean | null
          notifications_notification_types_security?: boolean | null
          notifications_notification_types_updates?: boolean | null
          performance_cache_revalidate_seconds?: number | null
          performance_enable_i_s_r?: boolean | null
          performance_enable_image_optimization?: boolean | null
          performance_enable_lazy_providers?: boolean | null
          performance_enable_prefetching?: boolean | null
          performance_static_page_paths?: string | null
          security_blocked_i_ps?: string | null
          security_enable_bot_challenge?: boolean | null
          security_enable_e2_e_e?: boolean | null
          security_enable_fingerprinting?: boolean | null
          security_enable_honeypots?: boolean | null
          security_rate_limit_per_minute?: number | null
          security_trusted_domains?: string | null
          seo_google_analytics_id?: string | null
          seo_og_image?: string | null
          seo_twitter_handle?: string | null
          social_bluesky?: string | null
          social_discord?: string | null
          social_github?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          updated_at?: string | null
        }
        Update: {
          announcement_dismissible?: boolean | null
          announcement_enabled?: boolean | null
          announcement_expires_at?: string | null
          announcement_link?: string | null
          announcement_message?: string | null
          announcement_type?:
            | Database["public"]["Enums"]["enum_site_settings_announcement_type"]
            | null
          api_api_cors_origins?: string | null
          api_api_rate_limit?: number | null
          api_api_version?: string | null
          api_enable_public_a_p_i?: boolean | null
          contact_email?: string | null
          contact_privacy_email?: string | null
          contact_support_url?: string | null
          created_at?: string | null
          features_enable_achievements?: boolean | null
          features_enable_analytics?: boolean | null
          features_enable_chat?: boolean | null
          features_enable_donations?: boolean | null
          features_enable_search?: boolean | null
          features_enable_sound_effects?: boolean | null
          features_enable_user_registration?: boolean | null
          features_enable_voice_assistant?: boolean | null
          features_maintenance_allowed_i_ps?: string | null
          features_maintenance_message?: string | null
          features_maintenance_mode?: boolean | null
          footer_copyright_text?: string | null
          footer_show_build_info?: boolean | null
          footer_show_version?: boolean | null
          general_description?: string
          general_favicon_id?: number | null
          general_logo_id?: number | null
          general_site_name?: string
          general_tagline?: string
          general_version?: string | null
          id?: number
          notifications_digest_frequency?:
            | Database["public"]["Enums"]["enum_site_settings_notifications_digest_frequency"]
            | null
          notifications_email_from_address?: string | null
          notifications_email_from_name?: string | null
          notifications_enable_email_notifications?: boolean | null
          notifications_enable_push_notifications?: boolean | null
          notifications_notification_types_achievements?: boolean | null
          notifications_notification_types_marketing?: boolean | null
          notifications_notification_types_mentions?: boolean | null
          notifications_notification_types_messages?: boolean | null
          notifications_notification_types_security?: boolean | null
          notifications_notification_types_updates?: boolean | null
          performance_cache_revalidate_seconds?: number | null
          performance_enable_i_s_r?: boolean | null
          performance_enable_image_optimization?: boolean | null
          performance_enable_lazy_providers?: boolean | null
          performance_enable_prefetching?: boolean | null
          performance_static_page_paths?: string | null
          security_blocked_i_ps?: string | null
          security_enable_bot_challenge?: boolean | null
          security_enable_e2_e_e?: boolean | null
          security_enable_fingerprinting?: boolean | null
          security_enable_honeypots?: boolean | null
          security_rate_limit_per_minute?: number | null
          security_trusted_domains?: string | null
          seo_google_analytics_id?: string | null
          seo_og_image?: string | null
          seo_twitter_handle?: string | null
          social_bluesky?: string | null
          social_discord?: string | null
          social_github?: string | null
          social_linkedin?: string | null
          social_twitter?: string | null
          social_youtube?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_general_favicon_id_media_id_fk"
            columns: ["general_favicon_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "site_settings_general_logo_id_media_id_fk"
            columns: ["general_logo_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings_footer_custom_footer_links: {
        Row: {
          _order: number
          _parent_id: number
          external: boolean | null
          id: string
          label: string
          url: string
        }
        Insert: {
          _order: number
          _parent_id: number
          external?: boolean | null
          id: string
          label: string
          url: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          external?: boolean | null
          id?: string
          label?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "site_settings_footer_custom_footer_links_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "site_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: number
          created_at: string
          description: string | null
          icon: string | null
          id: number
          name: string
          resource_count: number | null
          slug: string
          sort_order: number | null
          updated_at: string
        }
        Insert: {
          category_id: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name: string
          resource_count?: number | null
          slug: string
          sort_order?: number | null
          updated_at?: string
        }
        Update: {
          category_id?: number
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: number
          name?: string
          resource_count?: number | null
          slug?: string
          sort_order?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_categories_id_fk"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      superadmin_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          id: string
          ip_address: string | null
          superadmin_id: string
          target_id: string
          target_type: string
          user_agent: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          superadmin_id: string
          target_id: string
          target_type: string
          user_agent?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          ip_address?: string | null
          superadmin_id?: string
          target_id?: string
          target_type?: string
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "superadmin_logs_superadmin_id_fkey"
            columns: ["superadmin_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          description: string | null
          id: number
          name: string
          resource_count: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: number
          name: string
          resource_count?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: number
          name?: string
          resource_count?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      translations: {
        Row: {
          context: string | null
          created_at: string
          id: number
          key: string
          namespace: Database["public"]["Enums"]["enum_translations_namespace"]
          updated_at: string
        }
        Insert: {
          context?: string | null
          created_at?: string
          id?: number
          key: string
          namespace: Database["public"]["Enums"]["enum_translations_namespace"]
          updated_at?: string
        }
        Update: {
          context?: string | null
          created_at?: string
          id?: number
          key?: string
          namespace?: Database["public"]["Enums"]["enum_translations_namespace"]
          updated_at?: string
        }
        Relationships: []
      }
      translations_locales: {
        Row: {
          _locale: unknown[]
          _parent_id: number
          id: number
          value: string
        }
        Insert: {
          _locale: unknown[]
          _parent_id: number
          id?: number
          value: string
        }
        Update: {
          _locale?: unknown[]
          _parent_id?: number
          id?: number
          value?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_locales_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "translations"
            referencedColumns: ["id"]
          },
        ]
      }
      translations_placeholders: {
        Row: {
          _order: number
          _parent_id: number
          description: string | null
          id: string
          name: string
        }
        Insert: {
          _order: number
          _parent_id: number
          description?: string | null
          id: string
          name: string
        }
        Update: {
          _order?: number
          _parent_id?: number
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "translations_placeholders_parent_id_fk"
            columns: ["_parent_id"]
            isOneToOne: false
            referencedRelation: "translations"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_devices: {
        Row: {
          created_at: string | null
          device_name: string
          device_type: string
          id: string
          is_primary: boolean | null
          is_verified: boolean | null
          last_used_at: string | null
          secret: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          device_name?: string
          device_type?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          secret: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          device_name?: string
          device_type?: string
          id?: string
          is_primary?: boolean | null
          is_verified?: boolean | null
          last_used_at?: string | null
          secret?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "two_factor_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      two_factor_sessions: {
        Row: {
          created_at: string | null
          expires_at: string
          id: string
          session_token: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expires_at: string
          id?: string
          session_token: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          expires_at?: string
          id?: string
          session_token?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "two_factor_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user: {
        Row: {
          achievement_points: number | null
          achievements_count: number | null
          ai_preferences: Json | null
          avatarUrl: string | null
          ban_expires_at: string | null
          banned: boolean | null
          banned_at: string | null
          banned_by: string | null
          banned_reason: string | null
          bannedAt: string | null
          bannedBy: string | null
          banReason: string | null
          bio: string | null
          blocked_count: number | null
          country_code: string | null
          coverPhotoPath: string | null
          coverPhotoUrl: string | null
          createdAt: string
          displayName: string | null
          email: string
          email2FAEnabled: boolean | null
          emailVerified: boolean
          followers_count: number | null
          following_count: number | null
          hasCompletedOnboarding: boolean | null
          hasPassword: boolean | null
          id: string
          image: string | null
          isBetaTester: boolean | null
          isVerified: boolean | null
          items_read_count: number | null
          location: string | null
          mfaSetupRequired: boolean | null
          name: string
          onboardingStep: number | null
          profilePrivacy: Json | null
          reading_list_count: number | null
          review_count: number | null
          role: string | null
          saved_search_count: number | null
          socialLinks: Json | null
          timezone: string | null
          twoFactorBackupCodes: string[] | null
          twoFactorEnabled: boolean | null
          twoFactorSecret: string | null
          twoFactorVerifiedAt: string | null
          updatedAt: string
          username: string | null
        }
        Insert: {
          achievement_points?: number | null
          achievements_count?: number | null
          ai_preferences?: Json | null
          avatarUrl?: string | null
          ban_expires_at?: string | null
          banned?: boolean | null
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          bannedAt?: string | null
          bannedBy?: string | null
          banReason?: string | null
          bio?: string | null
          blocked_count?: number | null
          country_code?: string | null
          coverPhotoPath?: string | null
          coverPhotoUrl?: string | null
          createdAt?: string
          displayName?: string | null
          email: string
          email2FAEnabled?: boolean | null
          emailVerified?: boolean
          followers_count?: number | null
          following_count?: number | null
          hasCompletedOnboarding?: boolean | null
          hasPassword?: boolean | null
          id: string
          image?: string | null
          isBetaTester?: boolean | null
          isVerified?: boolean | null
          items_read_count?: number | null
          location?: string | null
          mfaSetupRequired?: boolean | null
          name: string
          onboardingStep?: number | null
          profilePrivacy?: Json | null
          reading_list_count?: number | null
          review_count?: number | null
          role?: string | null
          saved_search_count?: number | null
          socialLinks?: Json | null
          timezone?: string | null
          twoFactorBackupCodes?: string[] | null
          twoFactorEnabled?: boolean | null
          twoFactorSecret?: string | null
          twoFactorVerifiedAt?: string | null
          updatedAt?: string
          username?: string | null
        }
        Update: {
          achievement_points?: number | null
          achievements_count?: number | null
          ai_preferences?: Json | null
          avatarUrl?: string | null
          ban_expires_at?: string | null
          banned?: boolean | null
          banned_at?: string | null
          banned_by?: string | null
          banned_reason?: string | null
          bannedAt?: string | null
          bannedBy?: string | null
          banReason?: string | null
          bio?: string | null
          blocked_count?: number | null
          country_code?: string | null
          coverPhotoPath?: string | null
          coverPhotoUrl?: string | null
          createdAt?: string
          displayName?: string | null
          email?: string
          email2FAEnabled?: boolean | null
          emailVerified?: boolean
          followers_count?: number | null
          following_count?: number | null
          hasCompletedOnboarding?: boolean | null
          hasPassword?: boolean | null
          id?: string
          image?: string | null
          isBetaTester?: boolean | null
          isVerified?: boolean | null
          items_read_count?: number | null
          location?: string | null
          mfaSetupRequired?: boolean | null
          name?: string
          onboardingStep?: number | null
          profilePrivacy?: Json | null
          reading_list_count?: number | null
          review_count?: number | null
          role?: string | null
          saved_search_count?: number | null
          socialLinks?: Json | null
          timezone?: string | null
          twoFactorBackupCodes?: string[] | null
          twoFactorEnabled?: boolean | null
          twoFactorSecret?: string | null
          twoFactorVerifiedAt?: string | null
          updatedAt?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_banned_by_fkey"
            columns: ["banned_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_bannedBy_fkey"
            columns: ["bannedBy"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string | null
          id: string
          is_featured: boolean | null
          progress: number | null
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string | null
          id?: string
          is_featured?: boolean | null
          progress?: number | null
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string | null
          id?: string
          is_featured?: boolean | null
          progress?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity: {
        Row: {
          activity_type: string
          created_at: string | null
          id: string
          metadata: Json | null
          resource_id: string | null
          resource_type: string | null
          user_id: string
        }
        Insert: {
          activity_type: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id: string
        }
        Update: {
          activity_type?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          resource_id?: string | null
          resource_type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_api_keys: {
        Row: {
          api_key_encrypted: string
          api_key_hint: string | null
          available_models: Json | null
          created_at: string | null
          id: string
          is_valid: boolean | null
          last_validated_at: string | null
          preferred_model: string | null
          provider: string
          updated_at: string | null
          usage_this_month: Json | null
          user_id: string
          validation_error: string | null
        }
        Insert: {
          api_key_encrypted: string
          api_key_hint?: string | null
          available_models?: Json | null
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          preferred_model?: string | null
          provider?: string
          updated_at?: string | null
          usage_this_month?: Json | null
          user_id: string
          validation_error?: string | null
        }
        Update: {
          api_key_encrypted?: string
          api_key_hint?: string | null
          available_models?: Json | null
          created_at?: string | null
          id?: string
          is_valid?: boolean | null
          last_validated_at?: string | null
          preferred_model?: string | null
          provider?: string
          updated_at?: string | null
          usage_this_month?: Json | null
          user_id?: string
          validation_error?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_api_keys_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string | null
          id: string
          reason: string | null
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string | null
          id?: string
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_chat_settings: {
        Row: {
          created_at: string
          sound_enabled: boolean | null
          sound_invitation: boolean | null
          sound_mention: boolean | null
          sound_new_message: string | null
          sound_typing: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          sound_enabled?: boolean | null
          sound_invitation?: boolean | null
          sound_mention?: boolean | null
          sound_new_message?: string | null
          sound_typing?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          sound_enabled?: boolean | null
          sound_invitation?: boolean | null
          sound_mention?: boolean | null
          sound_new_message?: string | null
          sound_typing?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_chat_settings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_presence: {
        Row: {
          last_active_at: string
          last_seen_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          last_active_at?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          last_active_at?: string
          last_seen_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_presence_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      user_prompt_saves: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          prompt_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          prompt_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          prompt_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_prompt_saves_prompt_id_fkey"
            columns: ["prompt_id"]
            isOneToOne: false
            referencedRelation: "prompts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_prompt_saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bio: string | null
          created_at: string
          email: string
          hash: string | null
          id: number
          is_active: boolean | null
          last_login_at: string | null
          lock_until: string | null
          login_attempts: number | null
          login_count: number | null
          name: string
          permissions_can_approve_comments: boolean | null
          permissions_can_approve_edits: boolean | null
          permissions_can_manage_resources: boolean | null
          permissions_can_view_analytics: boolean | null
          reset_password_expiration: string | null
          reset_password_token: string | null
          role: Database["public"]["Enums"]["enum_users_role"]
          salt: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          created_at?: string
          email: string
          hash?: string | null
          id?: number
          is_active?: boolean | null
          last_login_at?: string | null
          lock_until?: string | null
          login_attempts?: number | null
          login_count?: number | null
          name: string
          permissions_can_approve_comments?: boolean | null
          permissions_can_approve_edits?: boolean | null
          permissions_can_manage_resources?: boolean | null
          permissions_can_view_analytics?: boolean | null
          reset_password_expiration?: string | null
          reset_password_token?: string | null
          role?: Database["public"]["Enums"]["enum_users_role"]
          salt?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          created_at?: string
          email?: string
          hash?: string | null
          id?: number
          is_active?: boolean | null
          last_login_at?: string | null
          lock_until?: string | null
          login_attempts?: number | null
          login_count?: number | null
          name?: string
          permissions_can_approve_comments?: boolean | null
          permissions_can_approve_edits?: boolean | null
          permissions_can_manage_resources?: boolean | null
          permissions_can_view_analytics?: boolean | null
          reset_password_expiration?: string | null
          reset_password_token?: string | null
          role?: Database["public"]["Enums"]["enum_users_role"]
          salt?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      verification: {
        Row: {
          createdAt: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt: string | null
          value: string
        }
        Insert: {
          createdAt?: string | null
          expiresAt: string
          id: string
          identifier: string
          updatedAt?: string | null
          value: string
        }
        Update: {
          createdAt?: string | null
          expiresAt?: string
          id?: string
          identifier?: string
          updatedAt?: string | null
          value?: string
        }
        Relationships: []
      }
      view_history: {
        Row: {
          id: string
          resource_id: string
          resource_type: string
          time_spent_seconds: number | null
          title: string | null
          url: string | null
          user_id: string
          view_count: number | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          resource_id: string
          resource_type: string
          time_spent_seconds?: number | null
          title?: string | null
          url?: string | null
          user_id: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          resource_id?: string
          resource_type?: string
          time_spent_seconds?: number | null
          title?: string | null
          url?: string | null
          user_id?: string
          view_count?: number | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "view_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_fingerprints: {
        Row: {
          auto_block_rule: string | null
          auto_blocked: boolean | null
          block_reason: string | null
          blocked_at: string | null
          blocked_by: string | null
          bot_requests: number | null
          components: Json | null
          created_at: string | null
          first_endpoint: string | null
          first_ip: unknown
          first_seen_at: string | null
          first_user_agent: string | null
          honeypot_triggers: number | null
          human_requests: number | null
          id: string
          is_blocked: boolean | null
          last_endpoint: string | null
          last_ip: unknown
          last_seen_at: string | null
          last_user_agent: string | null
          linked_at: string | null
          linked_user_id: string | null
          notes: string | null
          tags: string[] | null
          total_requests: number | null
          trust_level: string | null
          trust_score: number | null
          updated_at: string | null
          visitor_id: string
        }
        Insert: {
          auto_block_rule?: string | null
          auto_blocked?: boolean | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          bot_requests?: number | null
          components?: Json | null
          created_at?: string | null
          first_endpoint?: string | null
          first_ip?: unknown
          first_seen_at?: string | null
          first_user_agent?: string | null
          honeypot_triggers?: number | null
          human_requests?: number | null
          id?: string
          is_blocked?: boolean | null
          last_endpoint?: string | null
          last_ip?: unknown
          last_seen_at?: string | null
          last_user_agent?: string | null
          linked_at?: string | null
          linked_user_id?: string | null
          notes?: string | null
          tags?: string[] | null
          total_requests?: number | null
          trust_level?: string | null
          trust_score?: number | null
          updated_at?: string | null
          visitor_id: string
        }
        Update: {
          auto_block_rule?: string | null
          auto_blocked?: boolean | null
          block_reason?: string | null
          blocked_at?: string | null
          blocked_by?: string | null
          bot_requests?: number | null
          components?: Json | null
          created_at?: string | null
          first_endpoint?: string | null
          first_ip?: unknown
          first_seen_at?: string | null
          first_user_agent?: string | null
          honeypot_triggers?: number | null
          human_requests?: number | null
          id?: string
          is_blocked?: boolean | null
          last_endpoint?: string | null
          last_ip?: unknown
          last_seen_at?: string | null
          last_user_agent?: string | null
          linked_at?: string | null
          linked_user_id?: string | null
          notes?: string | null
          tags?: string[] | null
          total_requests?: number | null
          trust_level?: string | null
          trust_score?: number | null
          updated_at?: string | null
          visitor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "visitor_fingerprints_blocked_by_fkey"
            columns: ["blocked_by"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visitor_fingerprints_linked_user_id_fkey"
            columns: ["linked_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      webauthn_challenges: {
        Row: {
          challenge: string
          challenge_type: string
          created_at: string | null
          email: string | null
          expires_at: string
          id: string
          used_at: string | null
          user_id: string | null
        }
        Insert: {
          challenge: string
          challenge_type: string
          created_at?: string | null
          email?: string | null
          expires_at: string
          id?: string
          used_at?: string | null
          user_id?: string | null
        }
        Update: {
          challenge?: string
          challenge_type?: string
          created_at?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          used_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "webauthn_challenges_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      ai_pipeline_stats: {
        Row: {
          analyzed_docs: number | null
          avg_confidence: number | null
          completed_operations: number | null
          enhanced_resources: number | null
          failed_operations: number | null
          in_progress_operations: number | null
          linked_resources: number | null
          manual_relationships: number | null
          pending_operations: number | null
          total_docs: number | null
          total_relationships: number | null
          total_resources: number | null
        }
        Relationships: []
      }
      honeypot_stats: {
        Row: {
          enabled: boolean | null
          id: string | null
          last_triggered_at: string | null
          name: string | null
          path_pattern: string | null
          response_type: string | null
          trigger_count: number | null
          triggers_24h: number | null
          triggers_7d: number | null
          unique_visitors: number | null
        }
        Relationships: []
      }
      mv_dashboard_stats: {
        Row: {
          approved_beta_applications: number | null
          banned_users: number | null
          in_progress_feedback: number | null
          last_refreshed: string | null
          new_feedback: number | null
          new_users_24h: number | null
          new_users_30d: number | null
          new_users_7d: number | null
          pending_beta_applications: number | null
          rejected_beta_applications: number | null
          resolved_feedback: number | null
          total_users: number | null
        }
        Relationships: []
      }
      mv_popular_resources: {
        Row: {
          average_rating: number | null
          comment_count: number | null
          favorite_count: number | null
          last_refreshed: string | null
          popularity_score: number | null
          rating_count: number | null
          resource_id: string | null
          resource_type: string | null
        }
        Relationships: []
      }
      mv_rating_stats: {
        Row: {
          average_rating: number | null
          five_star: number | null
          four_star: number | null
          last_refreshed: string | null
          latest_rating: string | null
          one_star: number | null
          resource_id: string | null
          resource_type: string | null
          three_star: number | null
          total_ratings: number | null
          two_star: number | null
        }
        Relationships: []
      }
      mv_user_activity_summary: {
        Row: {
          activity_24h: number | null
          activity_30d: number | null
          activity_7d: number | null
          last_activity: string | null
          last_refreshed: string | null
          total_activity: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      rating_stats: {
        Row: {
          average_rating: number | null
          rating_count: number | null
          resource_id: string | null
          resource_type: string | null
        }
        Insert: {
          average_rating?: number | null
          rating_count?: number | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Update: {
          average_rating?: number | null
          rating_count?: number | null
          resource_id?: string | null
          resource_type?: string | null
        }
        Relationships: []
      }
      report_counts: {
        Row: {
          actioned_reports: number | null
          last_report_at: string | null
          pending_reports: number | null
          report_type: string | null
          reported_comment_id: string | null
          reported_user_id: string | null
          total_reports: number | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_comment_id_fkey"
            columns: ["reported_comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      security_stats: {
        Row: {
          bots_24h: number | null
          critical_events: number | null
          error_events: number | null
          honeypots_24h: number | null
          logs_24h: number | null
          logs_7d: number | null
          total_bot_detections: number | null
          total_honeypot_triggers: number | null
          total_logs: number | null
          verified_bots: number | null
          warning_events: number | null
        }
        Relationships: []
      }
      user_dm_conversations: {
        Row: {
          created_at: string | null
          current_user_id: string | null
          id: string | null
          is_muted: boolean | null
          last_message_at: string | null
          last_message_preview: string | null
          last_read_at: string | null
          name: string | null
          other_participants: Json | null
          type: string | null
          unread_count: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dm_participants_user_id_fkey"
            columns: ["current_user_id"]
            isOneToOne: false
            referencedRelation: "user"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_stats: {
        Row: {
          average_trust_score: number | null
          blocked_visitors: number | null
          suspicious_visitors: number | null
          total_visitors: number | null
          trusted_visitors: number | null
          untrusted_visitors: number | null
          visitors_with_accounts: number | null
          visitors_with_bot_activity: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_group_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: undefined
      }
      accept_sas_verification: {
        Args: { p_target_public_key: string; p_verification_id: string }
        Returns: boolean
      }
      add_job: {
        Args: {
          p_max_attempts?: number
          p_payload?: Json
          p_priority?: number
          p_run_at?: string
          p_type: string
        }
        Returns: string
      }
      aggregate_resource_views_daily: { Args: never; Returns: undefined }
      calculate_next_scan: {
        Args: { p_frequency: string; p_last_scan?: string }
        Returns: string
      }
      calculate_trending_score: {
        Args: {
          p_added_at: string
          p_average_rating: number
          p_favorites: number
          p_github_stars: number
          p_ratings_count: number
          p_views_total: number
          p_views_week: number
        }
        Returns: number
      }
      check_ai_consent: {
        Args: { p_conversation_id: string; p_feature?: string }
        Returns: boolean
      }
      claim_jobs: {
        Args: { p_limit?: number; p_types?: string[] }
        Returns: {
          attempts: number
          completed_at: string | null
          created_at: string
          error_count: number
          id: string
          last_error: string | null
          max_attempts: number
          payload: Json
          priority: number
          run_at: string
          started_at: string | null
          status: string
          type: string
        }[]
        SetofOptions: {
          from: "*"
          to: "job_queue"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_megolm_sessions: {
        Args: { p_device_id: string; p_user_id: string }
        Returns: {
          conversation_id: string
          encrypted_session_key: string
          first_known_index: number
          sender_device_id: string
          session_id: string
        }[]
      }
      claim_one_time_prekey: {
        Args: {
          p_claimer_device_id: string
          p_claimer_user_id: string
          p_target_device_id: string
          p_target_user_id: string
        }
        Returns: {
          key_id: string
          public_key: string
        }[]
      }
      cleanup_expired_2fa_codes: { Args: never; Returns: undefined }
      cleanup_expired_sas_verifications: { Args: never; Returns: number }
      cleanup_old_jobs: { Args: { p_days?: number }; Returns: number }
      cleanup_stale_push_subscriptions: { Args: never; Returns: undefined }
      cleanup_typing_indicators: { Args: never; Returns: undefined }
      complete_ai_operation: {
        Args: { p_error?: string; p_operation_id: string; p_result?: Json }
        Returns: boolean
      }
      complete_job: { Args: { p_job_id: string }; Returns: undefined }
      complete_sas_verification: {
        Args: {
          p_is_match: boolean
          p_sas_emoji_indices: string
          p_verification_id: string
        }
        Returns: boolean
      }
      count_available_prekeys: {
        Args: { p_device_key_id: string }
        Returns: number
      }
      create_group_conversation: {
        Args: {
          p_avatar_url?: string
          p_creator_id: string
          p_description?: string
          p_name: string
        }
        Returns: string
      }
      create_verification_code: {
        Args: {
          p_email: string
          p_expires_hours?: number
          p_token?: string
          p_user_id: string
        }
        Returns: {
          code: string
          expires_at: string
        }[]
      }
      create_webauthn_challenge: {
        Args: {
          p_challenge: string
          p_challenge_type: string
          p_email: string
          p_expires_minutes?: number
          p_user_id: string
        }
        Returns: string
      }
      decline_group_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: undefined
      }
      fail_job: {
        Args: { p_error?: string; p_job_id: string }
        Returns: undefined
      }
      generate_collection_slug: {
        Args: { p_name: string; p_user_id: string }
        Returns: string
      }
      generate_receipt_number: { Args: never; Returns: string }
      generate_username: {
        Args: { p_name: string; p_user_id: string }
        Returns: string
      }
      generate_verification_code: { Args: never; Returns: string }
      get_ai_pipeline_setting: { Args: { p_key: string }; Returns: Json }
      get_category_toc: {
        Args: { p_category: string }
        Returns: {
          description: string
          heading_count: number
          order_index: number
          reading_time_minutes: number
          slug: string
          title: string
        }[]
      }
      get_conversation_consent_status: {
        Args: { p_conversation_id: string }
        Returns: {
          allowed_features: Json
          consent_given_at: string
          consent_status: string
          user_id: string
        }[]
      }
      get_conversations_optimized: {
        Args: { p_user_id: string }
        Returns: {
          created_at: string
          group_avatar: string
          group_name: string
          id: string
          is_group: boolean
          last_message_at: string
          last_message_preview: string
          participant_avatars: string[]
          participant_ids: string[]
          participant_names: string[]
          participant_statuses: string[]
          participant_usernames: string[]
          unread_count: number
          updated_at: string
        }[]
      }
      get_device_keys_for_users: {
        Args: { p_user_ids: string[] }
        Returns: {
          device_id: string
          identity_key: string
          signed_prekey: string
          signed_prekey_signature: string
          signing_key: string
          user_id: string
        }[]
      }
      get_doc_related_resources: {
        Args: {
          p_doc_slug: string
          p_limit?: number
          p_min_confidence?: number
        }
        Returns: {
          ai_reasoning: string
          confidence_score: number
          relationship_type: string
          resource_category: string
          resource_description: string
          resource_id: string
          resource_slug: string
          resource_title: string
        }[]
      }
      get_doc_with_sections: {
        Args: { p_slug: string }
        Returns: {
          category: string
          content: string
          description: string
          reading_time_minutes: number
          sections: Json
          slug: string
          sources: Json
          title: string
        }[]
      }
      get_enhanced_resource: {
        Args: { p_slug: string }
        Returns: {
          related_docs: Json
          related_resources: Json
          resource: Json
          tags: string[]
        }[]
      }
      get_favorites_count: { Args: { p_user_id: string }; Returns: number }
      get_homepage_resources: {
        Args: { p_featured_limit?: number; p_trending_limit?: number }
        Returns: {
          featured: Json
          trending: Json
        }[]
      }
      get_job_queue_stats: {
        Args: never
        Returns: {
          count: number
          oldest: string
          status: string
        }[]
      }
      get_message_read_receipts: {
        Args: { p_message_ids: string[] }
        Returns: {
          message_id: string
          read_at: string
          user_id: string
          user_image: string
          user_name: string
          user_username: string
        }[]
      }
      get_messages_paginated: {
        Args: {
          p_before_id?: string
          p_conversation_id: string
          p_limit?: number
          p_user_id: string
        }
        Returns: {
          ai_response_to: string
          content: string
          conversation_id: string
          created_at: string
          deleted_at: string
          edited_at: string
          encrypted_content: string
          encryption_algorithm: string
          has_more: boolean
          id: string
          is_ai_generated: boolean
          is_encrypted: boolean
          mentions: Json
          metadata: Json
          sender_avatar: string
          sender_device_id: string
          sender_id: string
          sender_key: string
          sender_name: string
          sender_username: string
          session_id: string
        }[]
      }
      get_notification_target_users: {
        Args: { notification_id: string }
        Returns: {
          email: string
          name: string
          role: string
          user_id: string
        }[]
      }
      get_or_create_assistant_settings: {
        Args: { p_user_id: string }
        Returns: {
          assistant_name: string | null
          auto_speak: boolean | null
          compact_mode: boolean | null
          created_at: string | null
          enable_code_highlighting: boolean | null
          enable_voice_input: boolean | null
          id: string
          selected_voice_id: string | null
          show_conversation_history: boolean | null
          show_suggested_questions: boolean | null
          sound_theme: string | null
          speech_rate: number | null
          updated_at: string | null
          user_display_name: string | null
          user_id: string
        }[]
        SetofOptions: {
          from: "*"
          to: "assistant_settings"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      get_or_create_dm_conversation: {
        Args: { p_user1: string; p_user2: string }
        Returns: string
      }
      get_pending_analysis_jobs: {
        Args: { p_limit?: number }
        Returns: {
          created_at: string
          id: string
          job_type: string
          target_id: string
          target_type: string
          triggered_by: string
        }[]
      }
      get_pending_invitations: {
        Args: { p_user_id: string }
        Returns: {
          conversation_id: string
          conversation_name: string
          created_at: string
          expires_at: string
          id: string
          inviter_id: string
          inviter_name: string
          message: string
        }[]
      }
      get_pending_operations: {
        Args: { p_target_id?: string; p_target_type?: string }
        Returns: {
          cli_command: string
          id: string
          operation_type: string
          priority: number
          requested_at: string
          status: string
          target_id: string
          target_type: string
        }[]
      }
      get_related_resources: {
        Args: {
          p_limit?: number
          p_min_confidence?: number
          p_relationship_types?: string[]
          p_resource_id: string
        }
        Returns: {
          ai_reasoning: string
          confidence_score: number
          direction: string
          relationship_type: string
          resource_category: string
          resource_description: string
          resource_id: string
          resource_slug: string
          resource_title: string
        }[]
      }
      get_relationship_stats: {
        Args: never
        Returns: {
          avg_doc_resource_confidence: number
          avg_resource_resource_confidence: number
          docs_with_relationships: number
          resources_with_doc_relationships: number
          resources_with_resource_relationships: number
          total_doc_resource_relationships: number
          total_resource_resource_relationships: number
        }[]
      }
      get_resource_related_docs: {
        Args: {
          p_limit?: number
          p_min_confidence?: number
          p_resource_id: string
        }
        Returns: {
          ai_reasoning: string
          confidence_score: number
          doc_category: string
          doc_description: string
          doc_slug: string
          doc_title: string
          relationship_type: string
        }[]
      }
      get_sources_due_for_scan: {
        Args: never
        Returns: {
          awesome_config: Json
          default_category: string
          default_tags: string[]
          github_config: Json
          id: string
          name: string
          registry_config: Json
          type: string
          url: string
        }[]
      }
      get_total_unread_dm_count: {
        Args: { p_user_id: string }
        Returns: number
      }
      grant_ai_consent: {
        Args: {
          p_conversation_id: string
          p_device_id: string
          p_features?: Json
          p_user_id: string
        }
        Returns: boolean
      }
      invite_to_group: {
        Args: {
          p_conversation_id: string
          p_invitee_id: string
          p_inviter_id: string
          p_message?: string
        }
        Returns: string
      }
      is_favorited: {
        Args: {
          p_resource_id: string
          p_resource_type: string
          p_user_id: string
        }
        Returns: boolean
      }
      is_following: {
        Args: { p_follower_id: string; p_following_id: string }
        Returns: boolean
      }
      is_user_blocked: {
        Args: { p_blocked_id: string; p_blocker_id: string }
        Returns: boolean
      }
      leave_group_conversation: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      log_ai_access: {
        Args: {
          p_ai_model?: string
          p_content_hash: string
          p_conversation_id: string
          p_device_id: string
          p_feature: string
          p_message_id: string
          p_user_id: string
        }
        Returns: string
      }
      log_superadmin_action: {
        Args: {
          p_action: string
          p_details?: Json
          p_ip_address?: string
          p_superadmin_id: string
          p_target_id: string
          p_target_type: string
          p_user_agent?: string
        }
        Returns: string
      }
      mark_dm_conversation_read: {
        Args: { p_conversation_id: string; p_user_id: string }
        Returns: undefined
      }
      mark_messages_read: {
        Args: {
          p_conversation_id: string
          p_up_to_message_id?: string
          p_user_id: string
        }
        Returns: number
      }
      mark_source_scanned: {
        Args: {
          p_discovered_count?: number
          p_error?: string
          p_source_id: string
          p_status: string
        }
        Returns: boolean
      }
      queue_ai_operation: {
        Args: {
          p_notes?: string
          p_operation_type: string
          p_priority?: number
          p_target_id: string
          p_target_type: string
          p_user_id?: string
        }
        Returns: string
      }
      refresh_all_materialized_views: { Args: never; Returns: undefined }
      refresh_dashboard_stats: { Args: never; Returns: undefined }
      refresh_rating_stats: { Args: never; Returns: undefined }
      refresh_trending_scores: { Args: never; Returns: number }
      register_passkey: {
        Args: {
          p_aaguid?: string
          p_backed_up?: boolean
          p_credential_id: string
          p_device_type?: string
          p_passkey_name: string
          p_public_key: string
          p_transports?: string[]
          p_user_id: string
        }
        Returns: string
      }
      remove_from_group: {
        Args: {
          p_admin_id: string
          p_conversation_id: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      remove_passkey: {
        Args: { p_passkey_id: string; p_user_id: string }
        Returns: boolean
      }
      rename_passkey: {
        Args: { p_new_name: string; p_passkey_id: string; p_user_id: string }
        Returns: boolean
      }
      revoke_ai_consent: {
        Args: {
          p_conversation_id: string
          p_reason?: string
          p_user_id: string
        }
        Returns: boolean
      }
      rotate_megolm_session: {
        Args: { p_conversation_id: string; p_new_session_id: string }
        Returns: undefined
      }
      search_documentation: {
        Args: { p_category?: string; p_limit?: number; p_query: string }
        Returns: {
          category: string
          description: string
          headline: string
          rank: number
          slug: string
          title: string
        }[]
      }
      share_megolm_session: {
        Args: {
          p_conversation_id: string
          p_sender_device_id: string
          p_sender_user_id: string
          p_session_id: string
          p_shares: Json
        }
        Returns: undefined
      }
      start_ai_operation: { Args: { p_operation_id: string }; Returns: boolean }
      start_sas_verification: {
        Args: {
          p_initiator_commitment: string
          p_initiator_device_id: string
          p_initiator_public_key: string
          p_initiator_user_id: string
          p_target_device_id: string
          p_target_user_id: string
        }
        Returns: string
      }
      sync_follow_counts: { Args: never; Returns: undefined }
      update_ai_pipeline_setting: {
        Args: { p_key: string; p_user_id?: string; p_value: Json }
        Returns: boolean
      }
      update_group_member_role: {
        Args: {
          p_admin_id: string
          p_conversation_id: string
          p_new_role: string
          p_target_user_id: string
        }
        Returns: undefined
      }
      update_idle_users: { Args: never; Returns: undefined }
      update_passkey_counter: {
        Args: { p_credential_id: string; p_new_counter: number }
        Returns: boolean
      }
      update_user_presence: {
        Args: { p_status: string; p_user_id: string }
        Returns: undefined
      }
      user_has_role: {
        Args: { required_role: string; user_id: string }
        Returns: boolean
      }
      verify_email_code: {
        Args: { p_code: string; p_email: string }
        Returns: {
          error_message: string
          success: boolean
          user_id: string
        }[]
      }
      verify_webauthn_challenge: {
        Args: { p_challenge: string }
        Returns: {
          challenge_type: string
          email: string
          user_id: string
          valid: boolean
        }[]
      }
    }
    Enums: {
      _locales:
        | "en"
        | "es"
        | "fr"
        | "de"
        | "ja"
        | "zh"
        | "ko"
        | "pt"
        | "sr"
        | "ru"
        | "it"
        | "nl"
        | "pl"
        | "sv"
        | "no"
        | "da"
        | "fi"
        | "el"
      enum__payload_resources_v_published_locale:
        | "en"
        | "es"
        | "fr"
        | "de"
        | "ja"
        | "zh"
        | "ko"
        | "pt"
        | "sr"
        | "ru"
        | "it"
        | "nl"
        | "pl"
        | "sv"
        | "no"
        | "da"
        | "fi"
        | "el"
      enum__payload_resources_v_version_discovery_discovered_by:
        | "ai"
        | "manual"
        | "import"
        | "suggestion"
      enum__payload_resources_v_version_enhancement_status:
        | "not_enhanced"
        | "pending"
        | "enhanced"
        | "needs_update"
        | "failed"
      enum__payload_resources_v_version_featured_reason:
        | "editors-pick"
        | "most-popular"
        | "popular"
        | "new"
        | "trending"
        | "essential"
        | "official"
        | "official-source"
        | "official-repository"
        | "official-community"
        | "official-courses"
        | "official-examples"
        | "active-community"
        | "built-with-claude"
        | "industry-standard"
        | "industry-example"
      enum__payload_resources_v_version_publish_status:
        | "published"
        | "hidden"
        | "pending_review"
        | "rejected"
        | "draft"
      enum__payload_resources_v_version_resource_type:
        | "official"
        | "community"
        | "beta"
        | "deprecated"
        | "archived"
      enum__payload_resources_v_version_status: "draft" | "published"
      enum_achievement_tiers_animation:
        | "none"
        | "pulse"
        | "glow"
        | "shine"
        | "rainbow"
      enum_ai_pipeline_settings_documentation_auto_rewrite_schedule:
        | "disabled"
        | "weekly"
        | "monthly"
      enum_ai_pipeline_settings_documentation_preserve_sections:
        | "code_examples"
        | "content_meta"
        | "custom_components"
      enum_ai_pipeline_settings_model_config_fallback_model:
        | "claude-opus-4-5-20251101"
        | "claude-sonnet-4-20250514"
        | "claude-3-5-haiku-20241022"
      enum_ai_pipeline_settings_model_config_preferred_model:
        | "claude-opus-4-5-20251101"
        | "claude-sonnet-4-20250514"
        | "claude-3-5-haiku-20241022"
      enum_ai_pipeline_settings_relationships_enabled_types:
        | "required"
        | "recommended"
        | "related"
        | "example"
        | "alternative"
        | "extends"
        | "implements"
      enum_ai_pipeline_settings_scheduling_preferred_days:
        | "monday"
        | "tuesday"
        | "wednesday"
        | "thursday"
        | "friday"
        | "saturday"
        | "sunday"
      enum_audit_logs_action:
        | "create"
        | "update"
        | "delete"
        | "approve"
        | "reject"
        | "discover"
        | "scrape"
        | "analyze"
        | "import"
        | "export"
        | "login"
        | "logout"
        | "settings"
        | "bulk"
      enum_audit_logs_status: "success" | "failed" | "partial"
      enum_badges_donor_tier_required:
        | ""
        | "bronze"
        | "silver"
        | "gold"
        | "platinum"
      enum_badges_role_required:
        | ""
        | "editor"
        | "moderator"
        | "admin"
        | "superadmin"
      enum_badges_type:
        | "role"
        | "donor"
        | "special"
        | "event"
        | "verified"
        | "achievement"
      enum_categories_color:
        | "violet"
        | "blue"
        | "cyan"
        | "green"
        | "yellow"
        | "purple"
        | "pink"
        | "indigo"
        | "amber"
        | "rose"
      enum_cross_link_settings_display_defaults_default_display_mode:
        | "hover"
        | "cards"
        | "both"
      enum_difficulty_levels_color:
        | "green"
        | "blue"
        | "yellow"
        | "orange"
        | "red"
        | "purple"
        | "gray"
      enum_document_sections_display_mode: "inherit" | "hover" | "cards"
      enum_documents_ai_relationships_relationship_type:
        | "required"
        | "recommended"
        | "related"
        | "example"
        | "alternative"
        | "extends"
        | "implements"
      enum_documents_analysis_status:
        | "pending"
        | "analyzed"
        | "needs_update"
        | "failed"
      enum_documents_display_mode: "hover" | "cards" | "both"
      enum_documents_rewrite_info_rewrite_status:
        | "none"
        | "queued"
        | "in_progress"
        | "completed"
      enum_email_templates_slug:
        | "verification"
        | "verification-code"
        | "password-reset"
        | "welcome"
        | "notification"
        | "digest"
        | "mention"
        | "follow"
        | "comment-reply"
        | "donation-receipt"
        | "donation-thank-you"
        | "feedback-confirmation"
        | "admin-alert"
        | "import-complete"
        | "discovery-complete"
      enum_email_templates_status: "draft" | "active"
      enum_media_category: "avatar" | "resource" | "doc" | "general"
      enum_payload_achievements_compound_logic: "and" | "or"
      enum_payload_achievements_condition_type:
        | "special"
        | "count"
        | "streak"
        | "time"
        | "first"
        | "compound"
      enum_payload_achievements_metric:
        | "messages_sent"
        | "messages_received"
        | "conversations_started"
        | "groups_created"
        | "followers_count"
        | "following_count"
        | "profile_views"
        | "reviews_written"
        | "comments_posted"
        | "favorites_count"
        | "ratings_count"
        | "login_days"
        | "account_age_days"
        | "streak_days"
        | "2fa_enabled"
        | "passkeys_count"
        | "ai_conversations"
        | "ai_messages"
      enum_payload_achievements_notification_sound:
        | "achievement"
        | "level_up"
        | "fanfare"
        | "subtle"
        | "none"
      enum_payload_edit_suggestions_priority:
        | "low"
        | "normal"
        | "high"
        | "critical"
      enum_payload_edit_suggestions_status:
        | "pending"
        | "reviewing"
        | "approved"
        | "rejected"
        | "merged"
      enum_payload_edit_suggestions_submitter_type:
        | "public"
        | "cms"
        | "anonymous"
      enum_payload_edit_suggestions_target_type: "doc" | "resource"
      enum_payload_resource_authors_role:
        | "creator"
        | "maintainer"
        | "contributor"
        | "author"
        | "organization"
      enum_payload_resource_discovery_queue_package_registry: "npm" | "pypi"
      enum_payload_resource_discovery_queue_priority: "high" | "normal" | "low"
      enum_payload_resource_discovery_queue_status:
        | "pending"
        | "approved"
        | "rejected"
        | "duplicate"
        | "needs_info"
      enum_payload_resource_discovery_queue_suggested_status:
        | "official"
        | "community"
        | "beta"
        | "deprecated"
      enum_payload_resource_reviews_rejection_reason:
        | "spam"
        | "inappropriate"
        | "off-topic"
        | "fake"
        | "duplicate"
        | "other"
      enum_payload_resource_reviews_status:
        | "pending"
        | "approved"
        | "rejected"
        | "flagged"
      enum_payload_resource_sources_last_scan_status:
        | "success"
        | "partial"
        | "failed"
        | "never"
      enum_payload_resource_sources_scan_frequency:
        | "daily"
        | "weekly"
        | "monthly"
        | "manual"
      enum_payload_resource_sources_type:
        | "github_repo"
        | "github_search"
        | "awesome_list"
        | "npm"
        | "pypi"
        | "website"
        | "rss"
        | "api"
        | "manual"
      enum_payload_resources_discovery_discovered_by:
        | "ai"
        | "manual"
        | "import"
        | "suggestion"
      enum_payload_resources_enhancement_status:
        | "not_enhanced"
        | "pending"
        | "enhanced"
        | "needs_update"
        | "failed"
      enum_payload_resources_featured_reason:
        | "editors-pick"
        | "most-popular"
        | "popular"
        | "new"
        | "trending"
        | "essential"
        | "official"
        | "official-source"
        | "official-repository"
        | "official-community"
        | "official-courses"
        | "official-examples"
        | "active-community"
        | "built-with-claude"
        | "industry-standard"
        | "industry-example"
      enum_payload_resources_publish_status:
        | "published"
        | "hidden"
        | "pending_review"
        | "rejected"
        | "draft"
      enum_payload_resources_resource_type:
        | "official"
        | "community"
        | "beta"
        | "deprecated"
        | "archived"
      enum_payload_resources_status: "draft" | "published"
      enum_seo_settings_advanced_www_redirect: "www" | "non-www" | "none"
      enum_seo_settings_index_now_search_engines:
        | "bing"
        | "yandex"
        | "seznam"
        | "naver"
      enum_seo_settings_open_graph_type: "website" | "article" | "product"
      enum_seo_settings_robots_sitemap_change_freq:
        | "always"
        | "hourly"
        | "daily"
        | "weekly"
        | "monthly"
        | "yearly"
        | "never"
      enum_seo_settings_structured_data_organization_type:
        | "Organization"
        | "Corporation"
        | "EducationalOrganization"
        | "LocalBusiness"
      enum_seo_settings_twitter_card_type:
        | "summary"
        | "summary_large_image"
        | "app"
        | "player"
      enum_site_settings_announcement_type:
        | "info"
        | "success"
        | "warning"
        | "feature"
        | "critical"
      enum_site_settings_notifications_digest_frequency:
        | "immediate"
        | "daily"
        | "weekly"
        | "never"
      enum_translations_namespace:
        | "common"
        | "navigation"
        | "home"
        | "search"
        | "favorites"
        | "collections"
        | "readingLists"
        | "notifications"
        | "profile"
        | "settings"
        | "auth"
        | "pwa"
        | "errors"
        | "footer"
      enum_users_role: "superadmin" | "admin" | "editor" | "moderator"
      res_doc_rel_type:
        | "required"
        | "recommended"
        | "related"
        | "example"
        | "alternative"
        | "extends"
        | "implements"
      res_res_rel_type:
        | "alternative"
        | "complement"
        | "dependency"
        | "fork"
        | "successor"
        | "related"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      _locales: [
        "en",
        "es",
        "fr",
        "de",
        "ja",
        "zh",
        "ko",
        "pt",
        "sr",
        "ru",
        "it",
        "nl",
        "pl",
        "sv",
        "no",
        "da",
        "fi",
        "el",
      ],
      enum__payload_resources_v_published_locale: [
        "en",
        "es",
        "fr",
        "de",
        "ja",
        "zh",
        "ko",
        "pt",
        "sr",
        "ru",
        "it",
        "nl",
        "pl",
        "sv",
        "no",
        "da",
        "fi",
        "el",
      ],
      enum__payload_resources_v_version_discovery_discovered_by: [
        "ai",
        "manual",
        "import",
        "suggestion",
      ],
      enum__payload_resources_v_version_enhancement_status: [
        "not_enhanced",
        "pending",
        "enhanced",
        "needs_update",
        "failed",
      ],
      enum__payload_resources_v_version_featured_reason: [
        "editors-pick",
        "most-popular",
        "popular",
        "new",
        "trending",
        "essential",
        "official",
        "official-source",
        "official-repository",
        "official-community",
        "official-courses",
        "official-examples",
        "active-community",
        "built-with-claude",
        "industry-standard",
        "industry-example",
      ],
      enum__payload_resources_v_version_publish_status: [
        "published",
        "hidden",
        "pending_review",
        "rejected",
        "draft",
      ],
      enum__payload_resources_v_version_resource_type: [
        "official",
        "community",
        "beta",
        "deprecated",
        "archived",
      ],
      enum__payload_resources_v_version_status: ["draft", "published"],
      enum_achievement_tiers_animation: [
        "none",
        "pulse",
        "glow",
        "shine",
        "rainbow",
      ],
      enum_ai_pipeline_settings_documentation_auto_rewrite_schedule: [
        "disabled",
        "weekly",
        "monthly",
      ],
      enum_ai_pipeline_settings_documentation_preserve_sections: [
        "code_examples",
        "content_meta",
        "custom_components",
      ],
      enum_ai_pipeline_settings_model_config_fallback_model: [
        "claude-opus-4-5-20251101",
        "claude-sonnet-4-20250514",
        "claude-3-5-haiku-20241022",
      ],
      enum_ai_pipeline_settings_model_config_preferred_model: [
        "claude-opus-4-5-20251101",
        "claude-sonnet-4-20250514",
        "claude-3-5-haiku-20241022",
      ],
      enum_ai_pipeline_settings_relationships_enabled_types: [
        "required",
        "recommended",
        "related",
        "example",
        "alternative",
        "extends",
        "implements",
      ],
      enum_ai_pipeline_settings_scheduling_preferred_days: [
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ],
      enum_audit_logs_action: [
        "create",
        "update",
        "delete",
        "approve",
        "reject",
        "discover",
        "scrape",
        "analyze",
        "import",
        "export",
        "login",
        "logout",
        "settings",
        "bulk",
      ],
      enum_audit_logs_status: ["success", "failed", "partial"],
      enum_badges_donor_tier_required: [
        "",
        "bronze",
        "silver",
        "gold",
        "platinum",
      ],
      enum_badges_role_required: [
        "",
        "editor",
        "moderator",
        "admin",
        "superadmin",
      ],
      enum_badges_type: [
        "role",
        "donor",
        "special",
        "event",
        "verified",
        "achievement",
      ],
      enum_categories_color: [
        "violet",
        "blue",
        "cyan",
        "green",
        "yellow",
        "purple",
        "pink",
        "indigo",
        "amber",
        "rose",
      ],
      enum_cross_link_settings_display_defaults_default_display_mode: [
        "hover",
        "cards",
        "both",
      ],
      enum_difficulty_levels_color: [
        "green",
        "blue",
        "yellow",
        "orange",
        "red",
        "purple",
        "gray",
      ],
      enum_document_sections_display_mode: ["inherit", "hover", "cards"],
      enum_documents_ai_relationships_relationship_type: [
        "required",
        "recommended",
        "related",
        "example",
        "alternative",
        "extends",
        "implements",
      ],
      enum_documents_analysis_status: [
        "pending",
        "analyzed",
        "needs_update",
        "failed",
      ],
      enum_documents_display_mode: ["hover", "cards", "both"],
      enum_documents_rewrite_info_rewrite_status: [
        "none",
        "queued",
        "in_progress",
        "completed",
      ],
      enum_email_templates_slug: [
        "verification",
        "verification-code",
        "password-reset",
        "welcome",
        "notification",
        "digest",
        "mention",
        "follow",
        "comment-reply",
        "donation-receipt",
        "donation-thank-you",
        "feedback-confirmation",
        "admin-alert",
        "import-complete",
        "discovery-complete",
      ],
      enum_email_templates_status: ["draft", "active"],
      enum_media_category: ["avatar", "resource", "doc", "general"],
      enum_payload_achievements_compound_logic: ["and", "or"],
      enum_payload_achievements_condition_type: [
        "special",
        "count",
        "streak",
        "time",
        "first",
        "compound",
      ],
      enum_payload_achievements_metric: [
        "messages_sent",
        "messages_received",
        "conversations_started",
        "groups_created",
        "followers_count",
        "following_count",
        "profile_views",
        "reviews_written",
        "comments_posted",
        "favorites_count",
        "ratings_count",
        "login_days",
        "account_age_days",
        "streak_days",
        "2fa_enabled",
        "passkeys_count",
        "ai_conversations",
        "ai_messages",
      ],
      enum_payload_achievements_notification_sound: [
        "achievement",
        "level_up",
        "fanfare",
        "subtle",
        "none",
      ],
      enum_payload_edit_suggestions_priority: [
        "low",
        "normal",
        "high",
        "critical",
      ],
      enum_payload_edit_suggestions_status: [
        "pending",
        "reviewing",
        "approved",
        "rejected",
        "merged",
      ],
      enum_payload_edit_suggestions_submitter_type: [
        "public",
        "cms",
        "anonymous",
      ],
      enum_payload_edit_suggestions_target_type: ["doc", "resource"],
      enum_payload_resource_authors_role: [
        "creator",
        "maintainer",
        "contributor",
        "author",
        "organization",
      ],
      enum_payload_resource_discovery_queue_package_registry: ["npm", "pypi"],
      enum_payload_resource_discovery_queue_priority: ["high", "normal", "low"],
      enum_payload_resource_discovery_queue_status: [
        "pending",
        "approved",
        "rejected",
        "duplicate",
        "needs_info",
      ],
      enum_payload_resource_discovery_queue_suggested_status: [
        "official",
        "community",
        "beta",
        "deprecated",
      ],
      enum_payload_resource_reviews_rejection_reason: [
        "spam",
        "inappropriate",
        "off-topic",
        "fake",
        "duplicate",
        "other",
      ],
      enum_payload_resource_reviews_status: [
        "pending",
        "approved",
        "rejected",
        "flagged",
      ],
      enum_payload_resource_sources_last_scan_status: [
        "success",
        "partial",
        "failed",
        "never",
      ],
      enum_payload_resource_sources_scan_frequency: [
        "daily",
        "weekly",
        "monthly",
        "manual",
      ],
      enum_payload_resource_sources_type: [
        "github_repo",
        "github_search",
        "awesome_list",
        "npm",
        "pypi",
        "website",
        "rss",
        "api",
        "manual",
      ],
      enum_payload_resources_discovery_discovered_by: [
        "ai",
        "manual",
        "import",
        "suggestion",
      ],
      enum_payload_resources_enhancement_status: [
        "not_enhanced",
        "pending",
        "enhanced",
        "needs_update",
        "failed",
      ],
      enum_payload_resources_featured_reason: [
        "editors-pick",
        "most-popular",
        "popular",
        "new",
        "trending",
        "essential",
        "official",
        "official-source",
        "official-repository",
        "official-community",
        "official-courses",
        "official-examples",
        "active-community",
        "built-with-claude",
        "industry-standard",
        "industry-example",
      ],
      enum_payload_resources_publish_status: [
        "published",
        "hidden",
        "pending_review",
        "rejected",
        "draft",
      ],
      enum_payload_resources_resource_type: [
        "official",
        "community",
        "beta",
        "deprecated",
        "archived",
      ],
      enum_payload_resources_status: ["draft", "published"],
      enum_seo_settings_advanced_www_redirect: ["www", "non-www", "none"],
      enum_seo_settings_index_now_search_engines: [
        "bing",
        "yandex",
        "seznam",
        "naver",
      ],
      enum_seo_settings_open_graph_type: ["website", "article", "product"],
      enum_seo_settings_robots_sitemap_change_freq: [
        "always",
        "hourly",
        "daily",
        "weekly",
        "monthly",
        "yearly",
        "never",
      ],
      enum_seo_settings_structured_data_organization_type: [
        "Organization",
        "Corporation",
        "EducationalOrganization",
        "LocalBusiness",
      ],
      enum_seo_settings_twitter_card_type: [
        "summary",
        "summary_large_image",
        "app",
        "player",
      ],
      enum_site_settings_announcement_type: [
        "info",
        "success",
        "warning",
        "feature",
        "critical",
      ],
      enum_site_settings_notifications_digest_frequency: [
        "immediate",
        "daily",
        "weekly",
        "never",
      ],
      enum_translations_namespace: [
        "common",
        "navigation",
        "home",
        "search",
        "favorites",
        "collections",
        "readingLists",
        "notifications",
        "profile",
        "settings",
        "auth",
        "pwa",
        "errors",
        "footer",
      ],
      enum_users_role: ["superadmin", "admin", "editor", "moderator"],
      res_doc_rel_type: [
        "required",
        "recommended",
        "related",
        "example",
        "alternative",
        "extends",
        "implements",
      ],
      res_res_rel_type: [
        "alternative",
        "complement",
        "dependency",
        "fork",
        "successor",
        "related",
      ],
    },
  },
} as const

// ============================================================
// Convenience Type Exports
// ============================================================
// Auto-generated from Supabase. Regenerate with: pnpm db:types
// ============================================================

// Core User Tables
export type User = Tables<'user'>
export type Account = Tables<'account'>
export type Session = Tables<'session'>
export type Profile = Tables<'profiles'>

// Content Interaction Tables
export type Favorite = Tables<'favorites'>
export type Rating = Tables<'ratings'>
export type Comment = Tables<'comments'>
export type CommentVote = Tables<'comment_votes'>
export type Collection = Tables<'collections'>
export type CollectionItem = Tables<'collection_items'>

// Activity & Analytics
export type UserActivity = Tables<'user_activity'>
export type ViewHistory = Tables<'view_history'>
export type SearchHistory = Tables<'search_history'>

// Notifications
export type Notification = Tables<'notifications'>
export type NotificationPreference = Tables<'notification_preferences'>
export type AdminNotification = Tables<'admin_notifications'>
export type PushSubscription = Tables<'push_subscriptions'>

// Gamification
export type Achievement = Tables<'achievements'>
export type UserAchievement = Tables<'user_achievements'>
export type AchievementProgress = Tables<'achievement_progress'>

// Social Features
export type UserFollow = Tables<'user_follows'>
export type UserBlock = Tables<'user_blocks'>

// AI & Assistant
export type AiConversation = Tables<'ai_conversations'>
export type AiMessage = Tables<'ai_messages'>
export type AssistantSettings = Tables<'assistant_settings'>
export type UserApiKey = Tables<'user_api_keys'>
export type ApiKeyUsageLog = Tables<'api_key_usage_logs'>

// Security & Auth
export type Passkey = Tables<'passkeys'>
export type WebauthnChallenge = Tables<'webauthn_challenges'>
export type EmailVerificationCode = Tables<'email_verification_codes'>
export type TwoFactorSession = Tables<'two_factor_sessions'>

// Admin
export type AdminLog = Tables<'admin_logs'>
export type Feedback = Tables<'feedback'>
export type EditSuggestion = Tables<'edit_suggestions'>

// Views
export type RatingStats = Tables<'rating_stats'>
