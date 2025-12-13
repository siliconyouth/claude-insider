"use server";

/**
 * Reading Lists Server Actions
 *
 * Handle reading lists, bookmarks, and reading progress.
 */

import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

// Types
export interface ReadingList {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  slug: string | null;
  color: string;
  icon: string;
  item_count: number;
  created_at: string;
  updated_at: string;
}

export interface ReadingListItem {
  id: string;
  list_id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  title: string;
  url: string | null;
  notes: string | null;
  status: "unread" | "reading" | "completed";
  progress: number;
  added_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface ViewHistoryEntry {
  id: string;
  user_id: string;
  resource_type: string;
  resource_id: string;
  title: string;
  url: string | null;
  viewed_at: string;
  view_count: number;
  time_spent_seconds: number;
}

// ==================== Reading Lists ====================

/**
 * Get user's reading lists
 */
export async function getReadingLists(): Promise<{
  lists?: ReadingList[];
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
      .from("reading_lists")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return { lists: data || [] };
  } catch (error) {
    console.error("[ReadingLists] Get lists error:", error);
    return { error: "Failed to get reading lists" };
  }
}

/**
 * Create a new reading list
 */
export async function createReadingList(input: {
  name: string;
  description?: string;
  is_public?: boolean;
  color?: string;
  icon?: string;
}): Promise<{ list?: ReadingList; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    if (!input.name || input.name.length < 1) {
      return { error: "Name is required" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Generate slug from name
    const slug = input.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data, error } = await supabase
      .from("reading_lists")
      .insert({
        user_id: session.user.id,
        name: input.name,
        description: input.description || null,
        is_public: input.is_public || false,
        slug,
        color: input.color || "#3b82f6",
        icon: input.icon || "bookmark",
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "A list with this name already exists" };
      }
      throw error;
    }

    revalidatePath("/reading-lists");
    return { list: data };
  } catch (error) {
    console.error("[ReadingLists] Create error:", error);
    return { error: "Failed to create reading list" };
  }
}

/**
 * Update a reading list
 */
export async function updateReadingList(
  listId: string,
  input: {
    name?: string;
    description?: string;
    is_public?: boolean;
    color?: string;
    icon?: string;
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
    if (input.name) {
      updates.name = input.name;
      updates.slug = input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (input.description !== undefined) updates.description = input.description;
    if (input.is_public !== undefined) updates.is_public = input.is_public;
    if (input.color) updates.color = input.color;
    if (input.icon) updates.icon = input.icon;

    const { error } = await supabase
      .from("reading_lists")
      .update(updates)
      .eq("id", listId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/reading-lists");
    return { success: true };
  } catch (error) {
    console.error("[ReadingLists] Update error:", error);
    return { error: "Failed to update reading list" };
  }
}

/**
 * Delete a reading list
 */
export async function deleteReadingList(
  listId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if it's the default list
    const { data: list } = await supabase
      .from("reading_lists")
      .select("slug")
      .eq("id", listId)
      .eq("user_id", session.user.id)
      .single();

    if (list?.slug === "read-later") {
      return { error: "Cannot delete the default reading list" };
    }

    const { error } = await supabase
      .from("reading_lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/reading-lists");
    return { success: true };
  } catch (error) {
    console.error("[ReadingLists] Delete error:", error);
    return { error: "Failed to delete reading list" };
  }
}

/**
 * Get a single reading list with items
 */
export async function getReadingListBySlug(slug: string): Promise<{
  list?: ReadingList;
  items?: ReadingListItem[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data: list, error: listError } = await supabase
      .from("reading_lists")
      .select("*")
      .eq("user_id", session.user.id)
      .eq("slug", slug)
      .single();

    if (listError) throw listError;

    const { data: items, error: itemsError } = await supabase
      .from("reading_list_items")
      .select("*")
      .eq("list_id", list.id)
      .order("added_at", { ascending: false });

    if (itemsError) throw itemsError;

    return { list, items: items || [] };
  } catch (error) {
    console.error("[ReadingLists] Get by slug error:", error);
    return { error: "Failed to get reading list" };
  }
}

// ==================== Reading List Items ====================

/**
 * Add item to reading list
 */
export async function addToReadingList(input: {
  listId: string;
  resourceType: string;
  resourceId: string;
  title: string;
  url?: string;
  notes?: string;
}): Promise<{ item?: ReadingListItem; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Verify ownership of list
    const { data: list, error: listError } = await supabase
      .from("reading_lists")
      .select("id")
      .eq("id", input.listId)
      .eq("user_id", session.user.id)
      .single();

    if (listError || !list) {
      return { error: "Reading list not found" };
    }

    const { data, error } = await supabase
      .from("reading_list_items")
      .insert({
        list_id: input.listId,
        user_id: session.user.id,
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        title: input.title,
        url: input.url || null,
        notes: input.notes || null,
        status: "unread",
        progress: 0,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "Item already in this list" };
      }
      throw error;
    }

    revalidatePath("/reading-lists");
    return { item: data };
  } catch (error) {
    console.error("[ReadingLists] Add item error:", error);
    return { error: "Failed to add item" };
  }
}

/**
 * Quick add to default "Read Later" list
 */
export async function quickAddToReadLater(input: {
  resourceType: string;
  resourceId: string;
  title: string;
  url?: string;
}): Promise<{ item?: ReadingListItem; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get or create default list
    let { data: list } = await supabase
      .from("reading_lists")
      .select("id")
      .eq("user_id", session.user.id)
      .eq("slug", "read-later")
      .single();

    if (!list) {
      const { data: newList, error: createError } = await supabase
        .from("reading_lists")
        .insert({
          user_id: session.user.id,
          name: "Read Later",
          slug: "read-later",
          description: "Your default reading list",
        })
        .select()
        .single();

      if (createError) throw createError;
      list = newList;
    }

    return addToReadingList({
      listId: list.id,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      title: input.title,
      url: input.url,
    });
  } catch (error) {
    console.error("[ReadingLists] Quick add error:", error);
    return { error: "Failed to add to reading list" };
  }
}

/**
 * Remove item from reading list
 */
export async function removeFromReadingList(
  itemId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { error } = await supabase
      .from("reading_list_items")
      .delete()
      .eq("id", itemId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/reading-lists");
    return { success: true };
  } catch (error) {
    console.error("[ReadingLists] Remove item error:", error);
    return { error: "Failed to remove item" };
  }
}

/**
 * Update reading progress
 */
export async function updateReadingProgress(
  itemId: string,
  input: {
    status?: "unread" | "reading" | "completed";
    progress?: number;
    notes?: string;
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
    const updates: any = {};
    if (input.status) {
      updates.status = input.status;
      if (input.status === "reading" && !updates.started_at) {
        updates.started_at = new Date().toISOString();
      }
      if (input.status === "completed") {
        updates.completed_at = new Date().toISOString();
        updates.progress = 100;
      }
    }
    if (input.progress !== undefined) {
      updates.progress = Math.min(100, Math.max(0, input.progress));
    }
    if (input.notes !== undefined) {
      updates.notes = input.notes;
    }

    const { error } = await supabase
      .from("reading_list_items")
      .update(updates)
      .eq("id", itemId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/reading-lists");
    return { success: true };
  } catch (error) {
    console.error("[ReadingLists] Update progress error:", error);
    return { error: "Failed to update progress" };
  }
}

/**
 * Move item to another list
 */
export async function moveToList(
  itemId: string,
  newListId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Verify ownership of new list
    const { data: list, error: listError } = await supabase
      .from("reading_lists")
      .select("id")
      .eq("id", newListId)
      .eq("user_id", session.user.id)
      .single();

    if (listError || !list) {
      return { error: "Target list not found" };
    }

    const { error } = await supabase
      .from("reading_list_items")
      .update({ list_id: newListId })
      .eq("id", itemId)
      .eq("user_id", session.user.id);

    if (error) throw error;

    revalidatePath("/reading-lists");
    return { success: true };
  } catch (error) {
    console.error("[ReadingLists] Move item error:", error);
    return { error: "Failed to move item" };
  }
}

/**
 * Check if resource is in any reading list
 */
export async function isInReadingList(
  resourceType: string,
  resourceId: string
): Promise<{ inList?: boolean; listId?: string; itemId?: string; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { inList: false };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("reading_list_items")
      .select("id, list_id")
      .eq("user_id", session.user.id)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .limit(1)
      .single();

    if (data) {
      return { inList: true, listId: data.list_id, itemId: data.id };
    }

    return { inList: false };
  } catch {
    return { inList: false };
  }
}

// ==================== View History ====================

/**
 * Record a view
 */
export async function recordView(input: {
  resourceType: string;
  resourceId: string;
  title: string;
  url?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { success: true }; // Silently succeed for anonymous users
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // The trigger will handle upsert logic
    await supabase.from("view_history").insert({
      user_id: session.user.id,
      resource_type: input.resourceType,
      resource_id: input.resourceId,
      title: input.title,
      url: input.url || null,
    });

    return { success: true };
  } catch (error) {
    console.error("[ReadingLists] Record view error:", error);
    return { success: true }; // Don't fail silently
  }
}

/**
 * Get view history
 */
export async function getViewHistory(
  limit: number = 20
): Promise<{ history?: ViewHistoryEntry[]; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("view_history")
      .select("*")
      .eq("user_id", session.user.id)
      .order("viewed_at", { ascending: false })
      .limit(limit);

    if (error) throw error;

    return { history: data || [] };
  } catch (error) {
    console.error("[ReadingLists] Get history error:", error);
    return { error: "Failed to get view history" };
  }
}

/**
 * Clear view history
 */
export async function clearViewHistory(): Promise<{
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
      .from("view_history")
      .delete()
      .eq("user_id", session.user.id);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error("[ReadingLists] Clear history error:", error);
    return { error: "Failed to clear history" };
  }
}

/**
 * Get reading stats
 */
export async function getReadingStats(): Promise<{
  stats?: {
    totalLists: number;
    totalItems: number;
    itemsRead: number;
    itemsReading: number;
    itemsUnread: number;
  };
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "Not authenticated" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get lists count
    const { count: totalLists } = await supabase
      .from("reading_lists")
      .select("*", { count: "exact", head: true })
      .eq("user_id", session.user.id);

    // Get items by status
    const { data: items } = await supabase
      .from("reading_list_items")
      .select("status")
      .eq("user_id", session.user.id);

    const statusCounts = (items || []).reduce(
      (acc: { completed: number; reading: number; unread: number }, item: { status: string }) => {
        acc[item.status as keyof typeof acc] = (acc[item.status as keyof typeof acc] || 0) + 1;
        return acc;
      },
      { completed: 0, reading: 0, unread: 0 }
    );

    return {
      stats: {
        totalLists: totalLists || 0,
        totalItems: items?.length || 0,
        itemsRead: statusCounts.completed,
        itemsReading: statusCounts.reading,
        itemsUnread: statusCounts.unread,
      },
    };
  } catch (error) {
    console.error("[ReadingLists] Get stats error:", error);
    return { error: "Failed to get stats" };
  }
}

/**
 * Get public reading list (for sharing)
 */
export async function getPublicReadingList(
  username: string,
  slug: string
): Promise<{
  list?: ReadingList & { user: { name: string; username: string; image: string | null } };
  items?: ReadingListItem[];
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Find user by username
    const { data: user, error: userError } = await supabase
      .from("user")
      .select("id, name, username, image")
      .eq("username", username)
      .single();

    if (userError || !user) {
      return { error: "User not found" };
    }

    // Find public list
    const { data: list, error: listError } = await supabase
      .from("reading_lists")
      .select("*")
      .eq("user_id", user.id)
      .eq("slug", slug)
      .eq("is_public", true)
      .single();

    if (listError || !list) {
      return { error: "Reading list not found or not public" };
    }

    // Get items
    const { data: items } = await supabase
      .from("reading_list_items")
      .select("*")
      .eq("list_id", list.id)
      .order("added_at", { ascending: false });

    return {
      list: { ...list, user },
      items: items || [],
    };
  } catch (error) {
    console.error("[ReadingLists] Get public list error:", error);
    return { error: "Failed to get reading list" };
  }
}
