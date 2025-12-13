"use server";

/**
 * Profile Server Actions
 *
 * Aggregate functions for the user profile page.
 * Combines favorites, ratings, and collections data.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  joinedAt: string;
  stats: {
    favorites: number;
    ratings: number;
    collections: number;
    comments: number;
  };
}

export interface FavoriteWithResource {
  id: string;
  resourceType: "resource" | "doc";
  resourceId: string;
  createdAt: string;
  // Resource metadata (loaded separately)
  title?: string;
  description?: string;
  url?: string;
}

export interface RatingWithResource {
  id: string;
  resourceType: "resource" | "doc";
  resourceId: string;
  rating: number;
  createdAt: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  url?: string;
}

export interface CollectionWithItems {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<{
  data?: UserProfile;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to view your profile" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const userId = session.user.id;

    // Get stats in parallel
    const [favoritesCount, ratingsCount, collectionsCount, commentsCount] =
      await Promise.all([
        supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("ratings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("collections")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    // Get user profile data
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("bio, website, avatar_url")
      .eq("user_id", userId)
      .single();

    return {
      data: {
        id: userId,
        name: session.user.name || "Anonymous",
        email: session.user.email || "",
        avatarUrl: profile?.avatar_url || session.user.image || undefined,
        bio: profile?.bio || undefined,
        website: profile?.website || undefined,
        joinedAt: session.user.createdAt instanceof Date
          ? session.user.createdAt.toISOString()
          : (session.user.createdAt || new Date().toISOString()),
        stats: {
          favorites: favoritesCount.count || 0,
          ratings: ratingsCount.count || 0,
          collections: collectionsCount.count || 0,
          comments: commentsCount.count || 0,
        },
      },
    };
  } catch (error) {
    console.error("[Profile] Get profile error:", error);
    return { error: "Failed to load profile" };
  }
}

/**
 * Get user's favorites with pagination
 */
export async function getUserFavoritesWithDetails(
  page = 1,
  limit = 20
): Promise<{
  data?: FavoriteWithResource[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("favorites")
      .select("id, resource_type, resource_id, created_at", { count: "exact" })
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Profile] Favorites fetch error:", error);
      return { error: "Failed to load favorites" };
    }

    return {
      data:
        data?.map(
          (f: {
            id: string;
            resource_type: "resource" | "doc";
            resource_id: string;
            created_at: string;
          }) => ({
            id: f.id,
            resourceType: f.resource_type,
            resourceId: f.resource_id,
            createdAt: f.created_at,
          })
        ) || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's ratings with pagination
 */
export async function getUserRatingsWithDetails(
  page = 1,
  limit = 20
): Promise<{
  data?: RatingWithResource[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("ratings")
      .select("id, resource_type, resource_id, rating, created_at, updated_at", {
        count: "exact",
      })
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Profile] Ratings fetch error:", error);
      return { error: "Failed to load ratings" };
    }

    return {
      data:
        data?.map(
          (r: {
            id: string;
            resource_type: "resource" | "doc";
            resource_id: string;
            rating: number;
            created_at: string;
            updated_at?: string;
          }) => ({
            id: r.id,
            resourceType: r.resource_type,
            resourceId: r.resource_id,
            rating: r.rating,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          })
        ) || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's collections with item counts
 */
export async function getUserCollectionsWithCounts(): Promise<{
  data?: CollectionWithItems[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("collections")
      .select("id, name, description, is_public, item_count, created_at, updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Profile] Collections fetch error:", error);
      return { error: "Failed to load collections" };
    }

    return {
      data:
        data?.map(
          (c: {
            id: string;
            name: string;
            description?: string;
            is_public: boolean;
            item_count: number;
            created_at: string;
            updated_at: string;
          }) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            isPublic: c.is_public,
            itemCount: c.item_count,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          })
        ) || [],
    };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(data: {
  name?: string;
  bio?: string;
  website?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Validate website URL if provided
    if (data.website) {
      try {
        new URL(data.website);
      } catch {
        return { error: "Please enter a valid website URL" };
      }
    }

    // Upsert profile data
    const { error } = await supabase.from("user_profiles").upsert(
      {
        user_id: session.user.id,
        bio: data.bio || null,
        website: data.website || null,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

    if (error) {
      console.error("[Profile] Update error:", error);
      return { error: "Failed to update profile" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}
