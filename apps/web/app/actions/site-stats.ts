"use server";

/**
 * Site Statistics Server Action
 *
 * Lightweight statistics for use on the homepage and other public pages.
 * Cached via Next.js request memoization.
 */

import { createAdminClient } from "@/lib/supabase/server";
import { unstable_cache } from "next/cache";

export interface SiteStats {
  totalResources: number;
  totalDocs: number;
  totalFeatures: number;
}

/**
 * Get basic site statistics (cached for 1 hour)
 */
export const getSiteStats = unstable_cache(
  async (): Promise<SiteStats> => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const supabase = (await createAdminClient()) as any;

      // Count published resources
      const { count: resourceCount } = await supabase
        .from("resources")
        .select("*", { count: "exact", head: true })
        .eq("is_published", true);

      return {
        totalResources: resourceCount || 0,
        totalDocs: 34, // Static - MDX files don't change often
        totalFeatures: 67, // From FEATURES.md
      };
    } catch (error) {
      console.error("[SiteStats] Error fetching stats:", error);
      // Return fallback values if database fails
      return {
        totalResources: 1952, // Last known value
        totalDocs: 34,
        totalFeatures: 67,
      };
    }
  },
  ["site-stats"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["site-stats"],
  }
);
