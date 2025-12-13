"use server";

/**
 * Favorites Server Actions
 *
 * Handle favorite/unfavorite operations with optimistic updates.
 * Uses Better Auth for session verification and Supabase for data storage.
 *
 * Note: Uses explicit any typing because user data tables may not exist yet.
 * Once the SQL migration is run, proper types can be applied.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type FavoriteResult = {
  success?: boolean;
  isFavorited?: boolean;
  error?: string;
};

/**
 * Toggle favorite status for a resource
 * Returns the new favorite state
 */
export async function toggleFavorite(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<FavoriteResult> {
  try {
    // Verify user is authenticated
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to save favorites" };
    }

    const userId = session.user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check if already favorited
    const { data: existing } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    if (existing?.id) {
      // Remove favorite
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", existing.id);

      if (error) {
        console.error("[Favorites] Delete error:", error);
        return { error: "Failed to remove favorite" };
      }

      // Log activity
      await logActivity(supabase, userId, "unfavorite", resourceType, resourceId);

      // Revalidate the page to reflect the change
      revalidatePath(`/${resourceType}s`);

      return { success: true, isFavorited: false };
    } else {
      // Add favorite
      const { error } = await supabase.from("favorites").insert({
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
      });

      if (error) {
        console.error("[Favorites] Insert error:", error);
        return { error: "Failed to save favorite" };
      }

      // Log activity
      await logActivity(supabase, userId, "favorite", resourceType, resourceId);

      revalidatePath(`/${resourceType}s`);

      return { success: true, isFavorited: true };
    }
  } catch (error) {
    console.error("[Favorites] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's favorites
 */
export async function getUserFavorites(
  resourceType?: "resource" | "doc"
): Promise<{ data?: Array<{ resource_type: string; resource_id: string; created_at: string }>; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to view favorites" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;
    let query = supabase
      .from("favorites")
      .select("resource_type, resource_id, created_at")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (resourceType) {
      query = query.eq("resource_type", resourceType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("[Favorites] Fetch error:", error);
      return { error: "Failed to load favorites" };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("[Favorites] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Check if a resource is favorited by the current user
 */
export async function isFavorited(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<boolean> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return false;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Get favorite count for a resource
 */
export async function getFavoriteCount(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;
    const { count } = await supabase
      .from("favorites")
      .select("id", { count: "exact", head: true })
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId);

    return count || 0;
  } catch {
    return 0;
  }
}

// Helper to log user activity
async function logActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  activityType: "favorite" | "unfavorite",
  resourceType: string,
  resourceId: string
): Promise<void> {
  try {
    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: activityType,
      resource_type: resourceType,
      resource_id: resourceId,
    });
  } catch (error) {
    // Don't fail the main operation if activity logging fails
    console.error("[Activity] Log error:", error);
  }
}
