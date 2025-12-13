"use server";

/**
 * Advanced Search Server Actions
 *
 * Handle saved searches, search history, and search analytics.
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// Types
export interface SearchFilters {
  category?: string;
  type?: "doc" | "resource" | "user" | "all";
  sortBy?: "relevance" | "date" | "rating" | "popularity";
  dateRange?: "day" | "week" | "month" | "year" | "all";
  minRating?: number;
}

export interface SavedSearch {
  id: string;
  user_id: string;
  name: string;
  query: string;
  filters: SearchFilters;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SearchHistoryEntry {
  id: string;
  user_id: string;
  query: string;
  filters: SearchFilters;
  result_count: number;
  searched_at: string;
}

export interface PopularSearch {
  query: string;
  search_count: number;
  last_searched_at: string;
}

// ==================== Saved Searches ====================

/**
 * Get user's saved searches
 */
export async function getSavedSearches(): Promise<{
  searches?: SavedSearch[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("saved_searches")
      .select("*")
      .eq("user_id", session.user.id)
      .order("use_count", { ascending: false });

    if (error) throw error;

    return { searches: data || [] };
  } catch (error) {
    console.error("[Search] Get saved searches error:", error);
    return { error: "Failed to get saved searches" };
  }
}

/**
 * Save a search
 */
export async function saveSearch(input: {
  name: string;
  query: string;
  filters?: SearchFilters;
}): Promise<{ search?: SavedSearch; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    if (!input.name || !input.query) {
      return { error: "Name and query are required" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("saved_searches")
      .insert({
        user_id: session.user.id,
        name: input.name.trim(),
        query: input.query.trim(),
        filters: input.filters || {},
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "A saved search with this name already exists" };
      }
      throw error;
    }

    revalidatePath("/search");
    return { search: data };
  } catch (error) {
    console.error("[Search] Save search error:", error);
    return { error: "Failed to save search" };
  }
}

/**
 * Update a saved search
 */
export async function updateSavedSearch(
  searchId: string,
  input: {
    name?: string;
    query?: string;
    filters?: SearchFilters;
  }
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: any = { updated_at: new Date().toISOString() };
    if (input.name) updates.name = input.name.trim();
    if (input.query) updates.query = input.query.trim();
    if (input.filters) updates.filters = input.filters;

    const { error } = await supabase
      .from("saved_searches")
      .update(updates)
      .eq("id", searchId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/search");
    return { success: true };
  } catch (error) {
    console.error("[Search] Update saved search error:", error);
    return { error: "Failed to update saved search" };
  }
}

/**
 * Delete a saved search
 */
export async function deleteSavedSearch(
  searchId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("saved_searches")
      .delete()
      .eq("id", searchId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/search");
    return { success: true };
  } catch (error) {
    console.error("[Search] Delete saved search error:", error);
    return { error: "Failed to delete saved search" };
  }
}

/**
 * Use a saved search (increments use count)
 */
export async function useSavedSearch(
  searchId: string
): Promise<{ search?: SavedSearch; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("saved_searches")
      .update({
        use_count: supabase.raw("use_count + 1"),
        last_used_at: new Date().toISOString(),
      })
      .eq("id", searchId)
      .eq("user_id", session.user.id)
      .select()
      .single();

    if (error) throw error;

    return { search: data };
  } catch (error) {
    console.error("[Search] Use saved search error:", error);
    return { error: "Failed to use saved search" };
  }
}

// ==================== Search History ====================

/**
 * Record a search to history
 */
export async function recordSearch(input: {
  query: string;
  filters?: SearchFilters;
  resultCount: number;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Record to user history if logged in
    if (session?.user?.id) {
      await supabase.from("search_history").insert({
        user_id: session.user.id,
        query: input.query.trim(),
        filters: input.filters || {},
        result_count: input.resultCount,
      });
    }

    // Record to analytics (for everyone)
    await supabase.rpc("upsert_search_analytics", {
      p_query: input.query.trim(),
      p_result_count: input.resultCount,
    });

    return { success: true };
  } catch (error) {
    console.error("[Search] Record search error:", error);
    return { success: true }; // Don't fail on tracking errors
  }
}

/**
 * Get user's search history
 */
export async function getSearchHistory(
  limit: number = 10
): Promise<{ history?: SearchHistoryEntry[]; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { history: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("search_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("searched_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { history: data || [] };
  } catch (error) {
    console.error("[Search] Get history error:", error);
    return { error: "Failed to get search history" };
  }
}

/**
 * Clear user's search history
 */
export async function clearSearchHistory(): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("user_id", session.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("[Search] Clear history error:", error);
    return { error: "Failed to clear search history" };
  }
}

/**
 * Remove a single search from history
 */
export async function removeFromHistory(
  historyId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("search_history")
      .delete()
      .eq("id", historyId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("[Search] Remove from history error:", error);
    return { error: "Failed to remove from history" };
  }
}

// ==================== Search Analytics ====================

/**
 * Get popular searches
 */
export async function getPopularSearches(
  limit: number = 10
): Promise<{ searches?: PopularSearch[]; error?: string }> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("search_analytics")
      .select("query, search_count, last_searched_at")
      .gt("search_count", 1) // Only show searches used more than once
      .order("search_count", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { searches: data || [] };
  } catch (error) {
    console.error("[Search] Get popular searches error:", error);
    return { error: "Failed to get popular searches" };
  }
}

/**
 * Get search suggestions based on query
 */
export async function getSearchSuggestions(
  query: string
): Promise<{ suggestions?: string[]; error?: string }> {
  try {
    if (!query || query.length < 2) {
      return { suggestions: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get from search analytics
    const { data } = await supabase
      .from("search_analytics")
      .select("query")
      .ilike("normalized_query", `${query.toLowerCase()}%`)
      .gt("search_count", 1)
      .order("search_count", { ascending: false })
      .limit(5);

    const suggestions = (data || []).map(
      (item: { query: string }) => item.query
    );

    return { suggestions };
  } catch (error) {
    console.error("[Search] Get suggestions error:", error);
    return { suggestions: [] };
  }
}

/**
 * Get no-results queries for admin
 */
export async function getNoResultsQueries(
  limit: number = 20
): Promise<{
  queries?: Array<{ query: string; count: number }>;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check admin role
    const { data: user } = await supabase
      .from("user")
      .select("role")
      .eq("id", session.user.id)
      .single();

    if (!user || !["admin", "moderator"].includes(user.role)) {
      return { error: "Not authorized" };
    }

    const { data, error } = await supabase
      .from("search_analytics")
      .select("query, no_results_count")
      .gt("no_results_count", 0)
      .order("no_results_count", { ascending: false })
      .limit(limit);

    if (error) throw error;

    const queries = (data || []).map(
      (item: { query: string; no_results_count: number }) => ({
        query: item.query,
        count: item.no_results_count,
      })
    );

    return { queries };
  } catch (error) {
    console.error("[Search] Get no-results queries error:", error);
    return { error: "Failed to get queries" };
  }
}
