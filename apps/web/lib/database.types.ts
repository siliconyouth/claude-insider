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
          id: string
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
          id?: string
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
          moderated_by: string | null
          moderation_reason: string | null
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
          moderated_by?: string | null
          moderation_reason?: string | null
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
          moderated_by?: string | null
          moderation_reason?: string | null
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
            columns: ["moderated_by"]
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
          id: string
          page_url: string | null
          priority: string | null
          screenshot_url: string | null
          status: string | null
          title: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          page_url?: string | null
          priority?: string | null
          screenshot_url?: string | null
          status?: string | null
          title: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          page_url?: string | null
          priority?: string | null
          screenshot_url?: string | null
          status?: string | null
          title?: string
          type?: string
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
      resource_views: {
        Row: {
          id: string
          referrer: string | null
          resource_id: string
          resource_type: string
          session_id: string | null
          user_agent: string | null
          user_id: string | null
          viewed_at: string | null
        }
        Insert: {
          id?: string
          referrer?: string | null
          resource_id: string
          resource_type: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Update: {
          id?: string
          referrer?: string | null
          resource_id?: string
          resource_type?: string
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          viewed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user"
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
          bio: string | null
          blocked_count: number | null
          createdAt: string
          displayName: string | null
          email: string
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
          name: string
          onboardingStep: number | null
          profilePrivacy: Json | null
          reading_list_count: number | null
          review_count: number | null
          role: string | null
          saved_search_count: number | null
          socialLinks: Json | null
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
          bio?: string | null
          blocked_count?: number | null
          createdAt?: string
          displayName?: string | null
          email: string
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
          name: string
          onboardingStep?: number | null
          profilePrivacy?: Json | null
          reading_list_count?: number | null
          review_count?: number | null
          role?: string | null
          saved_search_count?: number | null
          socialLinks?: Json | null
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
          bio?: string | null
          blocked_count?: number | null
          createdAt?: string
          displayName?: string | null
          email?: string
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
          name?: string
          onboardingStep?: number | null
          profilePrivacy?: Json | null
          reading_list_count?: number | null
          review_count?: number | null
          role?: string | null
          saved_search_count?: number | null
          socialLinks?: Json | null
          twoFactorBackupCodes?: string[] | null
          twoFactorEnabled?: boolean | null
          twoFactorSecret?: string | null
          twoFactorVerifiedAt?: string | null
          updatedAt?: string
          username?: string | null
        }
        Relationships: []
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
    }
    Functions: {
      cleanup_stale_push_subscriptions: { Args: never; Returns: undefined }
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
      generate_collection_slug: {
        Args: { p_name: string; p_user_id: string }
        Returns: string
      }
      generate_username: {
        Args: { p_name: string; p_user_id: string }
        Returns: string
      }
      generate_verification_code: { Args: never; Returns: string }
      get_favorites_count: { Args: { p_user_id: string }; Returns: number }
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
      remove_passkey: {
        Args: { p_passkey_id: string; p_user_id: string }
        Returns: boolean
      }
      rename_passkey: {
        Args: { p_new_name: string; p_passkey_id: string; p_user_id: string }
        Returns: boolean
      }
      update_passkey_counter: {
        Args: { p_credential_id: string; p_new_counter: number }
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
      enum_difficulty_levels_color:
        | "green"
        | "blue"
        | "yellow"
        | "orange"
        | "red"
        | "purple"
        | "gray"
      enum_resources_featured_reason:
        | "editors-pick"
        | "most-popular"
        | "new"
        | "trending"
        | "essential"
      enum_resources_status:
        | "official"
        | "community"
        | "beta"
        | "deprecated"
        | "archived"
      enum_site_settings_announcement_type:
        | "info"
        | "success"
        | "warning"
        | "feature"
      enum_users_role: "admin" | "editor"
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
      enum_difficulty_levels_color: [
        "green",
        "blue",
        "yellow",
        "orange",
        "red",
        "purple",
        "gray",
      ],
      enum_resources_featured_reason: [
        "editors-pick",
        "most-popular",
        "new",
        "trending",
        "essential",
      ],
      enum_resources_status: [
        "official",
        "community",
        "beta",
        "deprecated",
        "archived",
      ],
      enum_site_settings_announcement_type: [
        "info",
        "success",
        "warning",
        "feature",
      ],
      enum_users_role: ["admin", "editor"],
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
