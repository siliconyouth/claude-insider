/**
 * Favorites Client Utilities
 *
 * Client-side functions for managing favorites and collections.
 */

import type {
  FavoriteStatus,
  FavoriteWithDetails,
  CollectionWithCount,
  CreateFavoriteRequest,
  CreateCollectionRequest,
  UpdateCollectionRequest,
  PaginatedFavorites,
  FavoriteResourceType,
} from "@/types/favorites";

/**
 * Check if a resource is favorited
 */
export async function checkFavoriteStatus(
  resourceType: FavoriteResourceType,
  resourceId: string
): Promise<FavoriteStatus> {
  const params = new URLSearchParams({ resourceType, resourceId });
  const res = await fetch(`/api/favorites/check?${params}`);

  if (!res.ok) {
    throw new Error("Failed to check favorite status");
  }

  return res.json();
}

/**
 * Add a resource to favorites
 */
export async function addFavorite(
  data: CreateFavoriteRequest
): Promise<{ success: boolean; favoriteId: string; createdAt?: string }> {
  const res = await fetch("/api/favorites", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add favorite");
  }

  return res.json();
}

/**
 * Remove a favorite
 */
export async function removeFavorite(
  favoriteId: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/favorites/${favoriteId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove favorite");
  }

  return res.json();
}

/**
 * Toggle favorite status
 */
export async function toggleFavorite(
  resourceType: FavoriteResourceType,
  resourceId: string,
  currentStatus: FavoriteStatus
): Promise<FavoriteStatus> {
  if (currentStatus.isFavorited && currentStatus.favoriteId) {
    await removeFavorite(currentStatus.favoriteId);
    return {
      isFavorited: false,
      count: currentStatus.count - 1,
    };
  } else {
    const result = await addFavorite({ resourceType, resourceId });
    return {
      isFavorited: true,
      favoriteId: result.favoriteId,
      count: currentStatus.count + 1,
    };
  }
}

/**
 * Get user's favorites with pagination
 */
export async function getFavorites(options?: {
  resourceType?: FavoriteResourceType;
  page?: number;
  limit?: number;
}): Promise<PaginatedFavorites> {
  const params = new URLSearchParams();

  if (options?.resourceType) {
    params.set("resourceType", options.resourceType);
  }
  if (options?.page) {
    params.set("page", String(options.page));
  }
  if (options?.limit) {
    params.set("limit", String(options.limit));
  }

  const res = await fetch(`/api/favorites?${params}`);

  if (!res.ok) {
    throw new Error("Failed to get favorites");
  }

  return res.json();
}

/**
 * Get user's collections
 */
export async function getCollections(): Promise<{ collections: CollectionWithCount[] }> {
  const res = await fetch("/api/collections");

  if (!res.ok) {
    throw new Error("Failed to get collections");
  }

  return res.json();
}

/**
 * Create a collection
 */
export async function createCollection(
  data: CreateCollectionRequest
): Promise<{ success: boolean; collectionId: string; slug: string }> {
  const res = await fetch("/api/collections", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to create collection");
  }

  return res.json();
}

/**
 * Get a collection by slug
 */
export async function getCollection(
  slug: string
): Promise<{ collection: CollectionWithCount }> {
  const res = await fetch(`/api/collections/${slug}`);

  if (!res.ok) {
    if (res.status === 404) {
      throw new Error("Collection not found");
    }
    throw new Error("Failed to get collection");
  }

  return res.json();
}

/**
 * Update a collection
 */
export async function updateCollection(
  slug: string,
  data: UpdateCollectionRequest
): Promise<{ success: boolean; collectionId: string; slug: string }> {
  const res = await fetch(`/api/collections/${slug}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to update collection");
  }

  return res.json();
}

/**
 * Delete a collection
 */
export async function deleteCollection(
  slug: string
): Promise<{ success: boolean }> {
  const res = await fetch(`/api/collections/${slug}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to delete collection");
  }

  return res.json();
}

/**
 * Get items in a collection
 */
export async function getCollectionItems(
  slug: string
): Promise<{ items: (FavoriteWithDetails & { itemId: string; position: number; addedAt: string })[] }> {
  const res = await fetch(`/api/collections/${slug}/items`);

  if (!res.ok) {
    throw new Error("Failed to get collection items");
  }

  return res.json();
}

/**
 * Add a favorite to a collection
 */
export async function addToCollection(
  slug: string,
  favoriteId: string
): Promise<{ success: boolean; itemId: string; addedAt?: string }> {
  const res = await fetch(`/api/collections/${slug}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ favoriteId }),
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to add to collection");
  }

  return res.json();
}

/**
 * Remove a favorite from a collection
 */
export async function removeFromCollection(
  slug: string,
  favoriteId: string
): Promise<{ success: boolean }> {
  const params = new URLSearchParams({ favoriteId });
  const res = await fetch(`/api/collections/${slug}/items?${params}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const error = await res.json();
    throw new Error(error.error || "Failed to remove from collection");
  }

  return res.json();
}
