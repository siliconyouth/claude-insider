"use server";

/**
 * Collections Server Actions
 *
 * Handle private and public collections of resources and docs.
 * Users can organize their favorite content into themed collections.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export type Collection = {
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

export type CollectionItem = {
  id: string;
  collection_id: string;
  resource_type: "resource" | "doc";
  resource_id: string;
  notes: string | null;
  position: number;
  added_at: string;
};

export type CollectionResult = {
  success?: boolean;
  data?: Collection;
  error?: string;
};

/**
 * Create a new collection
 */
export async function createCollection(
  name: string,
  description?: string,
  isPublic: boolean = false
): Promise<CollectionResult> {
  try {
    if (!name.trim() || name.length < 2) {
      return { error: "Collection name must be at least 2 characters" };
    }
    if (name.length > 100) {
      return { error: "Collection name must be less than 100 characters" };
    }

    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to create collections" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    const { data, error } = await supabase
      .from("collections")
      .insert({
        user_id: session.user.id,
        name: name.trim(),
        description: description?.trim() || null,
        is_public: isPublic,
        slug,
      })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { error: "You already have a collection with this name" };
      }
      console.error("[Collections] Create error:", error);
      return { error: "Failed to create collection" };
    }

    // Log activity
    await logActivity(supabase, session.user.id, "collection_create", data.id);

    return { success: true, data };
  } catch (error) {
    console.error("[Collections] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's collections
 */
export async function getUserCollections(): Promise<{
  data?: Collection[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    const { data, error } = await supabase
      .from("collections")
      .select("*")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Collections] Fetch error:", error);
      return { error: "Failed to load collections" };
    }

    return { data: data || [] };
  } catch (error) {
    console.error("[Collections] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get a single collection with items
 */
export async function getCollection(collectionId: string): Promise<{
  data?: Collection & { items: CollectionItem[] };
  error?: string;
}> {
  try {
    const session = await getSession();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    const { data: collection, error } = await supabase
      .from("collections")
      .select("*")
      .eq("id", collectionId)
      .single();

    if (error || !collection) {
      return { error: "Collection not found" };
    }

    // Check access
    if (!collection.is_public && collection.user_id !== session?.user?.id) {
      return { error: "This collection is private" };
    }

    // Get items
    const { data: items } = await supabase
      .from("collection_items")
      .select("*")
      .eq("collection_id", collectionId)
      .order("position", { ascending: true });

    return {
      data: {
        ...collection,
        items: items || [],
      },
    };
  } catch (error) {
    console.error("[Collections] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update a collection
 */
export async function updateCollection(
  collectionId: string,
  updates: {
    name?: string;
    description?: string;
    is_public?: boolean;
  }
): Promise<CollectionResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check ownership
    const { data: existing } = await supabase
      .from("collections")
      .select("user_id")
      .eq("id", collectionId)
      .single();

    if (!existing || existing.user_id !== session.user.id) {
      return { error: "Collection not found" };
    }

    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (updates.name !== undefined) {
      if (updates.name.length < 2) {
        return { error: "Name must be at least 2 characters" };
      }
      updateData.name = updates.name.trim();
      updateData.slug = updates.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
    }
    if (updates.description !== undefined) {
      updateData.description = updates.description.trim() || null;
    }
    if (updates.is_public !== undefined) {
      updateData.is_public = updates.is_public;
    }

    const { data, error } = await supabase
      .from("collections")
      .update(updateData)
      .eq("id", collectionId)
      .select()
      .single();

    if (error) {
      console.error("[Collections] Update error:", error);
      return { error: "Failed to update collection" };
    }

    return { success: true, data };
  } catch (error) {
    console.error("[Collections] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  collectionId: string
): Promise<CollectionResult> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check ownership
    const { data: existing } = await supabase
      .from("collections")
      .select("user_id")
      .eq("id", collectionId)
      .single();

    if (!existing || existing.user_id !== session.user.id) {
      return { error: "Collection not found" };
    }

    const { error } = await supabase
      .from("collections")
      .delete()
      .eq("id", collectionId);

    if (error) {
      console.error("[Collections] Delete error:", error);
      return { error: "Failed to delete collection" };
    }

    revalidatePath("/profile");

    return { success: true };
  } catch (error) {
    console.error("[Collections] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Add an item to a collection
 */
export async function addToCollection(
  collectionId: string,
  resourceType: "resource" | "doc",
  resourceId: string,
  notes?: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check ownership
    const { data: collection } = await supabase
      .from("collections")
      .select("user_id, item_count")
      .eq("id", collectionId)
      .single();

    if (!collection || collection.user_id !== session.user.id) {
      return { error: "Collection not found" };
    }

    // Check if already in collection
    const { data: existing } = await supabase
      .from("collection_items")
      .select("id")
      .eq("collection_id", collectionId)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .single();

    if (existing) {
      return { error: "Already in this collection" };
    }

    const { error } = await supabase.from("collection_items").insert({
      collection_id: collectionId,
      resource_type: resourceType,
      resource_id: resourceId,
      notes: notes?.trim() || null,
      position: collection.item_count,
    });

    if (error) {
      console.error("[Collections] Add item error:", error);
      return { error: "Failed to add to collection" };
    }

    // Log activity
    await logActivity(supabase, session.user.id, "collection_add", resourceId);

    return { success: true };
  } catch (error) {
    console.error("[Collections] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Remove an item from a collection
 */
export async function removeFromCollection(
  collectionId: string,
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    // Check ownership
    const { data: collection } = await supabase
      .from("collections")
      .select("user_id")
      .eq("id", collectionId)
      .single();

    if (!collection || collection.user_id !== session.user.id) {
      return { error: "Collection not found" };
    }

    const { error } = await supabase
      .from("collection_items")
      .delete()
      .eq("collection_id", collectionId)
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId);

    if (error) {
      console.error("[Collections] Remove item error:", error);
      return { error: "Failed to remove from collection" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Collections] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Check which collections contain a resource
 */
export async function getResourceCollections(
  resourceType: "resource" | "doc",
  resourceId: string
): Promise<{ data?: string[]; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { data: [] };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = await createAdminClient() as any;

    const { data } = await supabase
      .from("collection_items")
      .select("collection_id, collections!inner(user_id)")
      .eq("resource_type", resourceType)
      .eq("resource_id", resourceId)
      .eq("collections.user_id", session.user.id);

    return {
      data: data?.map((item: { collection_id: string }) => item.collection_id) || [],
    };
  } catch {
    return { data: [] };
  }
}

// Helper to log activity
async function logActivity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  userId: string,
  activityType: string,
  resourceId: string
): Promise<void> {
  try {
    await supabase.from("user_activity").insert({
      user_id: userId,
      activity_type: activityType,
      resource_id: resourceId,
    });
  } catch (error) {
    console.error("[Activity] Log error:", error);
  }
}
