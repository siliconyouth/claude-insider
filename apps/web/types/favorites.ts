/**
 * Favorites & Collections Types
 *
 * Types for the favorites and collections system.
 */

/**
 * Resource types that can be favorited
 */
export type FavoriteResourceType = "resource" | "doc";

/**
 * A favorited item
 */
export interface Favorite {
  id: string;
  userId: string;
  resourceType: FavoriteResourceType;
  resourceId: string;
  notes?: string;
  createdAt: string;
}

/**
 * Favorite with resource details (for display)
 */
export interface FavoriteWithDetails extends Favorite {
  title: string;
  description?: string;
  url?: string;
  category?: string;
  tags?: string[];
}

/**
 * Collection colors
 */
export const COLLECTION_COLORS = [
  "blue",
  "violet",
  "cyan",
  "emerald",
  "rose",
  "amber",
  "slate",
] as const;

export type CollectionColor = (typeof COLLECTION_COLORS)[number];

/**
 * Collection icons
 */
export const COLLECTION_ICONS = [
  "folder",
  "star",
  "bookmark",
  "heart",
  "code",
  "book",
  "lightbulb",
  "zap",
] as const;

export type CollectionIcon = (typeof COLLECTION_ICONS)[number];

/**
 * A user collection
 */
export interface Collection {
  id: string;
  userId: string;
  name: string;
  description?: string;
  slug: string;
  color: CollectionColor;
  icon: CollectionIcon;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Collection with item count
 */
export interface CollectionWithCount extends Collection {
  itemCount: number;
}

/**
 * Collection item (link between collection and favorite)
 */
export interface CollectionItem {
  id: string;
  collectionId: string;
  favoriteId: string;
  position: number;
  addedAt: string;
}

/**
 * Create favorite request
 */
export interface CreateFavoriteRequest {
  resourceType: FavoriteResourceType;
  resourceId: string;
  notes?: string;
}

/**
 * Create collection request
 */
export interface CreateCollectionRequest {
  name: string;
  description?: string;
  color?: CollectionColor;
  icon?: CollectionIcon;
  isPublic?: boolean;
}

/**
 * Update collection request
 */
export interface UpdateCollectionRequest {
  name?: string;
  description?: string;
  color?: CollectionColor;
  icon?: CollectionIcon;
  isPublic?: boolean;
}

/**
 * Add to collection request
 */
export interface AddToCollectionRequest {
  favoriteId: string;
}

/**
 * Favorite status for a resource
 */
export interface FavoriteStatus {
  isFavorited: boolean;
  favoriteId?: string;
  count: number;
}

/**
 * Paginated favorites response
 */
export interface PaginatedFavorites {
  items: FavoriteWithDetails[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

/**
 * Collection color styles
 */
export const COLLECTION_COLOR_STYLES: Record<
  CollectionColor,
  { bg: string; border: string; text: string }
> = {
  blue: {
    bg: "bg-blue-900/20",
    border: "border-blue-500/30",
    text: "text-blue-400",
  },
  violet: {
    bg: "bg-violet-900/20",
    border: "border-violet-500/30",
    text: "text-violet-400",
  },
  cyan: {
    bg: "bg-cyan-900/20",
    border: "border-cyan-500/30",
    text: "text-cyan-400",
  },
  emerald: {
    bg: "bg-emerald-900/20",
    border: "border-emerald-500/30",
    text: "text-emerald-400",
  },
  rose: {
    bg: "bg-rose-900/20",
    border: "border-rose-500/30",
    text: "text-rose-400",
  },
  amber: {
    bg: "bg-amber-900/20",
    border: "border-amber-500/30",
    text: "text-amber-400",
  },
  slate: {
    bg: "bg-slate-800",
    border: "border-slate-600/30",
    text: "text-slate-400",
  },
};
