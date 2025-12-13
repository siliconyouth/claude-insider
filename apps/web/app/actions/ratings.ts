"use server";

/**
 * Ratings Server Actions
 *
 * Handle rating operations with optimistic updates.
 * Users can rate resources from 1-5 stars.
 *
 * Note: Uses explicit any typing because user data tables may not exist yet.
 * Once the SQL migration is run, proper types can be applied.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type RatingResult = {
  success?: boolean;
  rating?: number;
  error?: string;
};

export type RatingStats = {
  averageRating: number;
  totalRatings: number;
  distribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

/**
 * Submit or update a rating for a resource
 */
export async function submitRating(
  resourceType: "resource" | "doc",
  resourceId: string,
  rating: number
): Promise<RatingResult> {
  try {
    // Validate rating
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      return { error: "Rating must be an integer between 1 and 5" };
    }

    // Verify user is authenticated
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to rate resources" };
    }

    const userId = session.user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check for existing rating
    const { data: existing } = await supabase
      .from("ratings")
      .select("id, rating")
      .eq("user_id", userId)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    if (existing?.id) {
      // Update existing rating
      const { error } = await supabase
        .from("ratings")
        .update({
          rating,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) {
        console.error("[Ratings] Update error:", error);
        return { error: "Failed to update rating" };
      }
    } else {
      // Insert new rating
      const { error } = await supabase.from("ratings").insert({
        user_id: userId,
        resource_type: resourceType,
        resource_id: resourceId,
        rating,
      });

      if (error) {
        console.error("[Ratings] Insert error:", error);
        return { error: "Failed to submit rating" };
      }

      // Log activity
      await logActivity(supabase, userId, resourceType, resourceId, rating);
    }

    revalidatePath(`/${resourceType}s`);

    return { success: true, rating };
  } catch (error) {
    console.error("[Ratings] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's rating for a specific resource
 */
export async function getUserRating(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<number | null> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return null;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;
    const { data } = await supabase
      .from("ratings")
      .select("rating")
      .eq("user_id", session.user.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    return data?.rating || null;
  } catch {
    return null;
  }
}

/**
 * Get rating statistics for a resource
 */
export async function getRatingStats(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<RatingStats | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Get all ratings for this resource
    const { data: ratings } = await supabase
      .from("ratings")
      .select("rating")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId);

    if (!ratings || ratings.length === 0) {
      return null;
    }

    // Calculate statistics
    const totalRatings = ratings.length;
    const sum = ratings.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0);
    const averageRating = Math.round((sum / totalRatings) * 10) / 10;

    // Calculate distribution
    const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    for (const r of ratings) {
      const ratingValue = r.rating as number;
      if (ratingValue >= 1 && ratingValue <= 5) {
        distribution[ratingValue as 1 | 2 | 3 | 4 | 5]++;
      }
    }

    return {
      averageRating,
      totalRatings,
      distribution,
    };
  } catch (error) {
    console.error("[Ratings] Stats error:", error);
    return null;
  }
}

/**
 * Delete user's rating for a resource
 */
export async function deleteRating(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<RatingResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to delete ratings" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;
    const { error } = await supabase
      .from("ratings")
      .delete()
      .eq("user_id", session.user.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId);

    if (error) {
      console.error("[Ratings] Delete error:", error);
      return { error: "Failed to delete rating" };
    }

    revalidatePath(`/${resourceType}s`);

    return { success: true };
  } catch (error) {
    console.error("[Ratings] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

// Helper to log user activity
async function logActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  resourceType: string,
  resourceId: string,
  rating: number
): Promise<void> {
  try {
    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: "rate",
      resource_type: resourceType,
      resource_id: resourceId,
      metadata: { rating },
    });
  } catch (error) {
    console.error("[Activity] Log error:", error);
  }
}
