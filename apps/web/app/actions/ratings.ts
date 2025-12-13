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

// ============================================
// REVIEWS
// ============================================

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userUsername: string | null;
  userImage: string | null;
  rating: number;
  title: string | null;
  content: string;
  helpfulCount: number;
  hasVotedHelpful: boolean;
  isOwn: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get reviews for a resource
 */
export async function getReviews(
  resourceType: "resource" | "doc",
  resourceId: string,
  options?: {
    sortBy?: "recent" | "helpful" | "highest" | "lowest";
    limit?: number;
    offset?: number;
  }
): Promise<{ reviews?: Review[]; total?: number; error?: string }> {
  try {
    const session = await getSession();
    const currentUserId = session?.user?.id;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { sortBy = "recent", limit = 10, offset = 0 } = options || {};

    // Build query
    let query = supabase
      .from("reviews")
      .select(
        `
        id,
        user_id,
        rating,
        title,
        content,
        helpful_count,
        created_at,
        updated_at,
        user:user_id (name, username, image)
      `,
        { count: "exact" }
      )
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .eq("status", "published");

    // Apply sorting
    switch (sortBy) {
      case "helpful":
        query = query.order("helpful_count", { ascending: false });
        break;
      case "highest":
        query = query.order("rating", { ascending: false });
        break;
      case "lowest":
        query = query.order("rating", { ascending: true });
        break;
      default:
        query = query.order("created_at", { ascending: false });
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1);

    if (error) throw error;

    // Get helpful votes for current user
    let userVotes: Set<string> = new Set();
    if (currentUserId && data?.length) {
      const reviewIds = data.map((r: { id: string }) => r.id);
      const { data: votes } = await supabase
        .from("review_helpful_votes")
        .select("review_id")
        .eq("user_id", currentUserId)
        .in("review_id", reviewIds);

      userVotes = new Set(votes?.map((v: { review_id: string }) => v.review_id) || []);
    }

    const reviews: Review[] = (data || []).map(
      (r: {
        id: string;
        user_id: string;
        rating: number;
        title: string | null;
        content: string;
        helpful_count: number;
        created_at: string;
        updated_at: string;
        user: { name: string; username: string | null; image: string | null } | null;
      }) => ({
        id: r.id,
        userId: r.user_id,
        userName: r.user?.name || "Anonymous",
        userUsername: r.user?.username || null,
        userImage: r.user?.image || null,
        rating: r.rating,
        title: r.title,
        content: r.content,
        helpfulCount: r.helpful_count,
        hasVotedHelpful: userVotes.has(r.id),
        isOwn: r.user_id === currentUserId,
        createdAt: r.created_at,
        updatedAt: r.updated_at,
      })
    );

    return { reviews, total: count || 0 };
  } catch (error) {
    console.error("[Ratings] Get reviews error:", error);
    return { error: "Failed to get reviews" };
  }
}

/**
 * Submit a review
 */
export async function submitReview(
  resourceType: "resource" | "doc",
  resourceId: string,
  data: {
    rating: number;
    title?: string;
    content: string;
  }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    if (data.rating < 1 || data.rating > 5) {
      return { error: "Rating must be between 1 and 5" };
    }

    if (data.content.length < 10) {
      return { error: "Review must be at least 10 characters" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if review already exists
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    if (existing) {
      // Update existing review
      const { error } = await supabase
        .from("reviews")
        .update({
          rating: data.rating,
          title: data.title || null,
          content: data.content,
          updated_at: new Date().toISOString(),
        })
        .eq("id", existing.id);

      if (error) throw error;
    } else {
      // Create new review
      const { error } = await supabase.from("reviews").insert({
        user_id: session.user.id,
        resource_type: resourceType,
        resource_id: resourceId,
        rating: data.rating,
        title: data.title || null,
        content: data.content,
      });

      if (error) throw error;
    }

    // Also update the simple rating
    await submitRating(resourceType, resourceId, data.rating);

    revalidatePath(`/${resourceType}s`);

    return { success: true };
  } catch (error) {
    console.error("[Ratings] Submit review error:", error);
    return { error: "Failed to submit review" };
  }
}

/**
 * Delete a review
 */
export async function deleteReview(reviewId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Verify ownership
    const { data: review } = await supabase
      .from("reviews")
      .select("user_id, resource_type, resource_id")
      .eq("id", reviewId)
      .single();

    if (!review || review.user_id !== session.user.id) {
      return { error: "Review not found" };
    }

    // Delete review
    await supabase.from("reviews").delete().eq("id", reviewId);

    // Also delete the rating
    await supabase
      .from("ratings")
      .delete()
      .eq("user_id", session.user.id)
      .eq("resource_type", review.resource_type)
      .eq("resource_id", review.resource_id);

    return { success: true };
  } catch (error) {
    console.error("[Ratings] Delete review error:", error);
    return { error: "Failed to delete review" };
  }
}

/**
 * Vote a review as helpful
 */
export async function voteHelpful(reviewId: string): Promise<{
  success?: boolean;
  voted?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if already voted
    const { data: existing } = await supabase
      .from("review_helpful_votes")
      .select("id")
      .eq("review_id", reviewId)
      .eq("user_id", session.user.id)
      .single();

    if (existing) {
      // Remove vote
      await supabase.from("review_helpful_votes").delete().eq("id", existing.id);
      return { success: true, voted: false };
    } else {
      // Add vote
      const { error } = await supabase.from("review_helpful_votes").insert({
        review_id: reviewId,
        user_id: session.user.id,
      });

      if (error) throw error;
      return { success: true, voted: true };
    }
  } catch (error) {
    console.error("[Ratings] Vote helpful error:", error);
    return { error: "Failed to vote" };
  }
}

/**
 * Get user's review for a resource
 */
export async function getUserReview(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<{
  review?: {
    id: string;
    rating: number;
    title: string | null;
    content: string;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return {};
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("reviews")
      .select("id, rating, title, content")
      .eq("user_id", session.user.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    if (!data) return {};

    return {
      review: {
        id: data.id,
        rating: data.rating,
        title: data.title,
        content: data.content,
      },
    };
  } catch (error) {
    console.error("[Ratings] Get user review error:", error);
    return { error: "Failed to get review" };
  }
}

/**
 * Report a review for moderation
 */
export async function reportReview(reviewId: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Flag the review
    await supabase
      .from("reviews")
      .update({ reported: true, status: "flagged" })
      .eq("id", reviewId);

    return { success: true };
  } catch (error) {
    console.error("[Ratings] Report review error:", error);
    return { error: "Failed to report review" };
  }
}
