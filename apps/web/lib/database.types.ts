/**
 * Database Types
 *
 * TypeScript types for Supabase database tables.
 * These match the schema defined in supabase/migrations/001_user_data.sql
 *
 * Note: In production, generate these types automatically using:
 * npx supabase gen types typescript --project-id YOUR_PROJECT_ID > lib/database.types.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          bio: string | null;
          avatar_url: string | null;
          website_url: string | null;
          github_username: string | null;
          twitter_handle: string | null;
          is_beta_tester: boolean;
          is_verified: boolean;
          notification_preferences: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          github_username?: string | null;
          twitter_handle?: string | null;
          is_beta_tester?: boolean;
          is_verified?: boolean;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          display_name?: string | null;
          bio?: string | null;
          avatar_url?: string | null;
          website_url?: string | null;
          github_username?: string | null;
          twitter_handle?: string | null;
          is_beta_tester?: boolean;
          is_verified?: boolean;
          notification_preferences?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      favorites: {
        Row: {
          id: string;
          user_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resource_type?: 'resource' | 'doc';
          resource_id?: string;
          created_at?: string;
        };
      };
      ratings: {
        Row: {
          id: string;
          user_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          rating: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resource_type?: 'resource' | 'doc';
          resource_id?: string;
          rating?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          user_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          parent_id: string | null;
          content: string;
          status: 'pending' | 'approved' | 'rejected' | 'flagged';
          is_edited: boolean;
          edited_at: string | null;
          moderated_by: string | null;
          moderated_at: string | null;
          moderation_reason: string | null;
          upvotes: number;
          downvotes: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          parent_id?: string | null;
          content: string;
          status?: 'pending' | 'approved' | 'rejected' | 'flagged';
          is_edited?: boolean;
          edited_at?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          moderation_reason?: string | null;
          upvotes?: number;
          downvotes?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          resource_type?: 'resource' | 'doc';
          resource_id?: string;
          parent_id?: string | null;
          content?: string;
          status?: 'pending' | 'approved' | 'rejected' | 'flagged';
          is_edited?: boolean;
          edited_at?: string | null;
          moderated_by?: string | null;
          moderated_at?: string | null;
          moderation_reason?: string | null;
          upvotes?: number;
          downvotes?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      comment_votes: {
        Row: {
          id: string;
          user_id: string;
          comment_id: string;
          vote_type: 'up' | 'down';
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          comment_id: string;
          vote_type: 'up' | 'down';
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          comment_id?: string;
          vote_type?: 'up' | 'down';
          created_at?: string;
        };
      };
      collections: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          is_public: boolean;
          slug: string | null;
          cover_image_url: string | null;
          item_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          is_public?: boolean;
          slug?: string | null;
          cover_image_url?: string | null;
          item_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          is_public?: boolean;
          slug?: string | null;
          cover_image_url?: string | null;
          item_count?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      collection_items: {
        Row: {
          id: string;
          collection_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          notes: string | null;
          position: number;
          added_at: string;
        };
        Insert: {
          id?: string;
          collection_id: string;
          resource_type: 'resource' | 'doc';
          resource_id: string;
          notes?: string | null;
          position?: number;
          added_at?: string;
        };
        Update: {
          id?: string;
          collection_id?: string;
          resource_type?: 'resource' | 'doc';
          resource_id?: string;
          notes?: string | null;
          position?: number;
          added_at?: string;
        };
      };
      user_activity: {
        Row: {
          id: string;
          user_id: string;
          activity_type:
            | 'view_resource'
            | 'view_doc'
            | 'search'
            | 'favorite'
            | 'unfavorite'
            | 'rate'
            | 'comment'
            | 'collection_create'
            | 'collection_add';
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          activity_type:
            | 'view_resource'
            | 'view_doc'
            | 'search'
            | 'favorite'
            | 'unfavorite'
            | 'rate'
            | 'comment'
            | 'collection_create'
            | 'collection_add';
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          activity_type?:
            | 'view_resource'
            | 'view_doc'
            | 'search'
            | 'favorite'
            | 'unfavorite'
            | 'rate'
            | 'comment'
            | 'collection_create'
            | 'collection_add';
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          created_at?: string;
        };
      };
    };
    Views: {
      rating_stats: {
        Row: {
          resource_type: string;
          resource_id: string;
          total_ratings: number;
          average_rating: number;
          five_star: number;
          four_star: number;
          three_star: number;
          two_star: number;
          one_star: number;
        };
      };
    };
    Functions: {
      get_favorites_count: {
        Args: { p_user_id: string };
        Returns: number;
      };
      is_favorited: {
        Args: { p_user_id: string; p_resource_type: string; p_resource_id: string };
        Returns: boolean;
      };
      get_user_rating: {
        Args: { p_user_id: string; p_resource_type: string; p_resource_id: string };
        Returns: number | null;
      };
    };
    Enums: {
      [key: string]: never;
    };
  };
}

// Convenience type exports
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Favorite = Database['public']['Tables']['favorites']['Row'];
export type Rating = Database['public']['Tables']['ratings']['Row'];
export type Comment = Database['public']['Tables']['comments']['Row'];
export type CommentVote = Database['public']['Tables']['comment_votes']['Row'];
export type Collection = Database['public']['Tables']['collections']['Row'];
export type CollectionItem = Database['public']['Tables']['collection_items']['Row'];
export type UserActivity = Database['public']['Tables']['user_activity']['Row'];
export type RatingStats = Database['public']['Views']['rating_stats']['Row'];
