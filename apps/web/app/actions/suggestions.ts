"use server";

/**
 * Suggestions Server Actions
 *
 * Handle edit suggestions for docs and resources.
 * Users can suggest edits which are then reviewed by editors/moderators.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { notifyAdminsEditSuggestion } from "@/lib/admin-notifications";

export type SuggestionStatus = "pending" | "approved" | "rejected" | "merged";

export interface Suggestion {
  id: string;
  user_id: string;
  resource_type: "resource" | "doc";
  resource_id: string;
  suggestion_type: "content" | "metadata" | "typo" | "other";
  title: string;
  description: string;
  suggested_changes?: string;
  status: SuggestionStatus;
  reviewer_id?: string;
  reviewer_notes?: string;
  created_at: string;
  updated_at: string;
  user?: {
    name: string;
  };
}

export type SuggestionResult = {
  success?: boolean;
  data?: Suggestion;
  error?: string;
};

/**
 * Create a new edit suggestion
 */
export async function createSuggestion(
  resourceType: "resource" | "doc",
  resourceId: string,
  suggestionType: "content" | "metadata" | "typo" | "other",
  title: string,
  description: string,
  suggestedChanges?: string
): Promise<SuggestionResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to suggest edits" };
    }

    // Validate inputs
    if (!title.trim()) {
      return { error: "Please provide a title for your suggestion" };
    }
    if (!description.trim()) {
      return { error: "Please describe your suggestion" };
    }
    if (title.length > 200) {
      return { error: "Title must be 200 characters or less" };
    }
    if (description.length > 5000) {
      return { error: "Description must be 5000 characters or less" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("edit_suggestions")
      .insert({
        user_id: session.user.id,
        resource_type: resourceType,
        resource_id: resourceId,
        suggestion_type: suggestionType,
        title: title.trim(),
        description: description.trim(),
        suggested_changes: suggestedChanges?.trim() || null,
        status: "pending",
      })
      .select()
      .single();

    if (error) {
      console.error("[Suggestions] Create error:", error);
      return { error: "Failed to submit suggestion" };
    }

    // Log activity
    await logActivity(
      supabase,
      session.user.id,
      "suggestion_created",
      resourceType,
      resourceId,
      { suggestion_id: data.id }
    );

    // Notify admins about the new suggestion (async, don't block response)
    notifyAdminsEditSuggestion({
      id: data.id,
      userId: session.user.id,
      userName: session.user.name || session.user.email?.split("@")[0] || "Unknown",
      userEmail: session.user.email || "",
      title: title.trim(),
      resourceType,
      resourceId,
      suggestionType,
    }).catch((err) => console.error("[Suggestions] Admin notification error:", err));

    revalidatePath(`/${resourceType}s`);

    return { success: true, data };
  } catch (error) {
    console.error("[Suggestions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get suggestions for a resource
 */
export async function getSuggestions(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<{ data?: Suggestion[]; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("edit_suggestions")
      .select(
        `
        id,
        user_id,
        resource_type,
        resource_id,
        suggestion_type,
        title,
        description,
        suggested_changes,
        status,
        reviewer_id,
        reviewer_notes,
        created_at,
        updated_at,
        user:user_id (name)
      `
      )
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Suggestions] Fetch error:", error);
      return { error: "Failed to load suggestions" };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("[Suggestions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's own suggestions
 */
export async function getUserSuggestions(): Promise<{
  data?: Suggestion[];
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
      .from("edit_suggestions")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[Suggestions] Fetch error:", error);
      return { error: "Failed to load suggestions" };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("[Suggestions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update suggestion status (for moderators/editors)
 */
export async function updateSuggestionStatus(
  suggestionId: string,
  status: SuggestionStatus,
  reviewerNotes?: string
): Promise<SuggestionResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // TODO: Check if user has moderator/editor role
    // For now, we'll allow any authenticated user to review
    // In production, this should check user roles

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("edit_suggestions")
      .update({
        status,
        reviewer_id: session.user.id,
        reviewer_notes: reviewerNotes || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", suggestionId)
      .select()
      .single();

    if (error) {
      console.error("[Suggestions] Update error:", error);
      return { error: "Failed to update suggestion" };
    }

    // Log activity
    await logActivity(
      supabase,
      session.user.id,
      `suggestion_${status}`,
      data.resource_type,
      data.resource_id,
      { suggestion_id: suggestionId }
    );

    return { success: true, data };
  } catch (error) {
    console.error("[Suggestions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a suggestion (only by owner or moderator)
 */
export async function deleteSuggestion(
  suggestionId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get the suggestion to check ownership
    const { data: suggestion } = await supabase
      .from("edit_suggestions")
      .select("user_id, status")
      .eq("id", suggestionId)
      .single();

    if (!suggestion) {
      return { error: "Suggestion not found" };
    }

    // Only allow deletion by owner if still pending
    // TODO: Add moderator check
    if (suggestion.user_id !== session.user.id) {
      return { error: "You can only delete your own suggestions" };
    }

    if (suggestion.status !== "pending") {
      return { error: "Cannot delete a suggestion that has been reviewed" };
    }

    const { error } = await supabase
      .from("edit_suggestions")
      .delete()
      .eq("id", suggestionId);

    if (error) {
      console.error("[Suggestions] Delete error:", error);
      return { error: "Failed to delete suggestion" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Suggestions] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get suggestion count for a resource
 */
export async function getSuggestionCount(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<number> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { count } = await supabase
      .from("edit_suggestions")
      .select("id", { count: "exact", head: true })
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .eq("status", "pending");

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
  activityType: string,
  resourceType: string,
  resourceId: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: activityType,
      resource_type: resourceType,
      resource_id: resourceId,
      metadata,
    });
  } catch (error) {
    console.error("[Activity] Log error:", error);
  }
}
