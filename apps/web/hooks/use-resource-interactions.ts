"use client";

import { useState, useCallback, useEffect } from "react";
import { toast } from "@/components/toast";
import { useSession } from "@/lib/auth-client";

/**
 * Hook for managing resource favorite status
 *
 * @example
 * ```tsx
 * const { isFavorited, isLoading, toggleFavorite, favoritesCount } = useResourceFavorite(slug, initialFavorited, initialCount);
 * ```
 */
export function useResourceFavorite(
  slug: string,
  initialFavorited: boolean = false,
  initialCount: number = 0
) {
  const { data: session } = useSession();
  const [isFavorited, setIsFavorited] = useState(initialFavorited);
  const [favoritesCount, setFavoritesCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial favorite status when authenticated
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchStatus = async () => {
      try {
        const response = await fetch(`/api/resources/${slug}/favorite`);
        if (response.ok) {
          const data = await response.json();
          setIsFavorited(data.isFavorited);
        }
      } catch (error) {
        console.error("Error fetching favorite status:", error);
      }
    };

    fetchStatus();
  }, [slug, session?.user?.id]);

  const toggleFavorite = useCallback(async () => {
    if (!session?.user?.id) {
      toast.error("Please sign in to favorite resources");
      return;
    }

    // Optimistic update
    const previousFavorited = isFavorited;
    const previousCount = favoritesCount;
    setIsFavorited(!isFavorited);
    setFavoritesCount((prev) => (isFavorited ? prev - 1 : prev + 1));
    setIsLoading(true);

    try {
      const response = await fetch(`/api/resources/${slug}/favorite`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to toggle favorite");
      }

      const data = await response.json();
      setIsFavorited(data.isFavorited);
      setFavoritesCount(data.favoritesCount);

      toast.success(data.isFavorited ? "Added to favorites" : "Removed from favorites");
    } catch (error) {
      // Revert on error
      setIsFavorited(previousFavorited);
      setFavoritesCount(previousCount);
      toast.error("Failed to update favorite");
      console.error("Error toggling favorite:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, session?.user?.id, isFavorited, favoritesCount]);

  return {
    isFavorited,
    favoritesCount,
    isLoading,
    toggleFavorite,
    isAuthenticated: !!session?.user?.id,
  };
}

/**
 * Hook for managing resource ratings
 *
 * @example
 * ```tsx
 * const { userRating, averageRating, ratingsCount, isLoading, setRating, removeRating } = useResourceRating(slug);
 * ```
 */
export function useResourceRating(
  slug: string,
  initialRating: number | null = null,
  initialAverage: number = 0,
  initialCount: number = 0
) {
  const { data: session } = useSession();
  const [userRating, setUserRating] = useState<number | null>(initialRating);
  const [averageRating, setAverageRating] = useState(initialAverage);
  const [ratingsCount, setRatingsCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch initial rating when authenticated
  useEffect(() => {
    if (!session?.user?.id) return;

    const fetchRating = async () => {
      try {
        const response = await fetch(`/api/resources/${slug}/rating`);
        if (response.ok) {
          const data = await response.json();
          setUserRating(data.userRating);
        }
      } catch (error) {
        console.error("Error fetching rating:", error);
      }
    };

    fetchRating();
  }, [slug, session?.user?.id]);

  const setRating = useCallback(
    async (rating: number) => {
      if (!session?.user?.id) {
        toast.error("Please sign in to rate resources");
        return;
      }

      if (rating < 1 || rating > 5) {
        toast.error("Rating must be between 1 and 5");
        return;
      }

      // Optimistic update
      const previousRating = userRating;
      setUserRating(rating);
      setIsLoading(true);

      try {
        const response = await fetch(`/api/resources/${slug}/rating`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rating }),
        });

        if (!response.ok) {
          throw new Error("Failed to set rating");
        }

        const data = await response.json();
        setUserRating(data.userRating);
        setAverageRating(data.averageRating);
        setRatingsCount(data.ratingsCount);

        toast.success(`Rated ${rating} stars`);
      } catch (error) {
        // Revert on error
        setUserRating(previousRating);
        toast.error("Failed to set rating");
        console.error("Error setting rating:", error);
      } finally {
        setIsLoading(false);
      }
    },
    [slug, session?.user?.id, userRating]
  );

  const removeRating = useCallback(async () => {
    if (!session?.user?.id || userRating === null) return;

    // Optimistic update
    const previousRating = userRating;
    setUserRating(null);
    setIsLoading(true);

    try {
      const response = await fetch(`/api/resources/${slug}/rating`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to remove rating");
      }

      const data = await response.json();
      setAverageRating(data.averageRating);
      setRatingsCount(data.ratingsCount);

      toast.success("Rating removed");
    } catch (error) {
      // Revert on error
      setUserRating(previousRating);
      toast.error("Failed to remove rating");
      console.error("Error removing rating:", error);
    } finally {
      setIsLoading(false);
    }
  }, [slug, session?.user?.id, userRating]);

  return {
    userRating,
    averageRating,
    ratingsCount,
    isLoading,
    setRating,
    removeRating,
    isAuthenticated: !!session?.user?.id,
  };
}

/**
 * Hook for tracking resource views
 *
 * @example
 * ```tsx
 * const { viewsCount, trackView } = useResourceView(slug, initialCount);
 * // Call trackView() on mount
 * useEffect(() => { trackView(); }, [trackView]);
 * ```
 */
export function useResourceView(slug: string, initialCount: number = 0) {
  const [viewsCount, setViewsCount] = useState(initialCount);
  const [hasTracked, setHasTracked] = useState(false);

  const trackView = useCallback(async () => {
    // Only track once per mount
    if (hasTracked) return;
    setHasTracked(true);

    try {
      // Get or create visitor ID for anonymous tracking
      let visitorId = localStorage.getItem("ci_visitor_id");
      if (!visitorId) {
        visitorId = crypto.randomUUID();
        localStorage.setItem("ci_visitor_id", visitorId);
      }

      const response = await fetch(`/api/resources/${slug}/view`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ visitorId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.viewsCount) {
          setViewsCount(data.viewsCount);
        }
      }
    } catch (error) {
      // Silently fail view tracking - not critical
      console.error("Error tracking view:", error);
    }
  }, [slug, hasTracked]);

  return {
    viewsCount,
    trackView,
    hasTracked,
  };
}

/**
 * Combined hook for all resource interactions
 *
 * @example
 * ```tsx
 * const { favorite, rating, view } = useResourceInteractions(slug, {
 *   initialFavorited: false,
 *   initialFavoritesCount: 10,
 *   initialRating: null,
 *   initialAverageRating: 4.5,
 *   initialRatingsCount: 100,
 *   initialViewsCount: 1000,
 * });
 * ```
 */
export function useResourceInteractions(
  slug: string,
  initialData: {
    initialFavorited?: boolean;
    initialFavoritesCount?: number;
    initialRating?: number | null;
    initialAverageRating?: number;
    initialRatingsCount?: number;
    initialViewsCount?: number;
  } = {}
) {
  const {
    initialFavorited = false,
    initialFavoritesCount = 0,
    initialRating = null,
    initialAverageRating = 0,
    initialRatingsCount = 0,
    initialViewsCount = 0,
  } = initialData;

  const favorite = useResourceFavorite(slug, initialFavorited, initialFavoritesCount);
  const rating = useResourceRating(
    slug,
    initialRating,
    initialAverageRating,
    initialRatingsCount
  );
  const view = useResourceView(slug, initialViewsCount);

  return {
    favorite,
    rating,
    view,
  };
}
