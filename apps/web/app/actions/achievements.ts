"use server";

/**
 * Achievements Server Actions
 *
 * Handle achievement tracking, awarding, and display.
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { createNotification } from "./notifications";

export interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: "contribution" | "engagement" | "milestone" | "special";
  points: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  requirementType: string;
  requirementValue: number;
  isHidden: boolean;
}

export interface UserAchievement extends Achievement {
  earnedAt: string;
  progress: number;
  isFeatured: boolean;
}

export interface AchievementProgress {
  slug: string;
  currentValue: number;
  requiredValue: number;
  percentComplete: number;
}

/**
 * Get all available achievements
 */
export async function getAllAchievements(): Promise<{
  data?: Achievement[];
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("achievements")
      .select("*")
      .order("category", { ascending: true })
      .order("points", { ascending: true });

    if (error) {
      return { error: "Failed to load achievements" };
    }

    return {
      data: data.map(mapAchievement),
    };
  } catch (error) {
    console.error("[Achievements] Get all error:", error);
    return { error: "Failed to load achievements" };
  }
}

/**
 * Get user's earned achievements
 */
export async function getUserAchievements(userId?: string): Promise<{
  data?: UserAchievement[];
  total?: number;
  points?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    const targetUserId = userId || session?.user?.id;

    if (!targetUserId) {
      return { error: "User not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("user_achievements")
      .select(
        `
        *,
        achievement:achievement_id (*)
      `
      )
      .eq("user_id", targetUserId)
      .order("earned_at", { ascending: false });

    if (error) {
      return { error: "Failed to load achievements" };
    }

    const achievements: UserAchievement[] = (data || [])
      .filter((row: { achievement: Achievement | null }) => row.achievement)
      .map(
        (row: {
          earned_at: string;
          progress: number;
          is_featured: boolean;
          achievement: {
            id: string;
            slug: string;
            name: string;
            description: string;
            icon: string;
            category: string;
            points: number;
            tier: string;
            requirement_type: string;
            requirement_value: number;
            is_hidden: boolean;
          };
        }) => ({
          ...mapAchievement(row.achievement),
          earnedAt: row.earned_at,
          progress: row.progress,
          isFeatured: row.is_featured,
        })
      );

    const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);

    return {
      data: achievements,
      total: achievements.length,
      points: totalPoints,
    };
  } catch (error) {
    console.error("[Achievements] Get user error:", error);
    return { error: "Failed to load achievements" };
  }
}

/**
 * Get featured achievements for a user profile
 */
export async function getFeaturedAchievements(userId: string): Promise<{
  data?: UserAchievement[];
  error?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data, error } = await supabase
      .from("user_achievements")
      .select(
        `
        *,
        achievement:achievement_id (*)
      `
      )
      .eq("user_id", userId)
      .eq("is_featured", true)
      .limit(6);

    if (error) {
      return { error: "Failed to load achievements" };
    }

    const achievements: UserAchievement[] = (data || [])
      .filter((row: { achievement: Achievement | null }) => row.achievement)
      .map(
        (row: {
          earned_at: string;
          progress: number;
          is_featured: boolean;
          achievement: {
            id: string;
            slug: string;
            name: string;
            description: string;
            icon: string;
            category: string;
            points: number;
            tier: string;
            requirement_type: string;
            requirement_value: number;
            is_hidden: boolean;
          };
        }) => ({
          ...mapAchievement(row.achievement),
          earnedAt: row.earned_at,
          progress: row.progress,
          isFeatured: row.is_featured,
        })
      );

    return { data: achievements };
  } catch (error) {
    console.error("[Achievements] Get featured error:", error);
    return { error: "Failed to load achievements" };
  }
}

/**
 * Toggle featured status of an achievement
 */
export async function toggleFeaturedAchievement(
  achievementId: string
): Promise<{
  success?: boolean;
  isFeatured?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get current status
    const { data: current } = await supabase
      .from("user_achievements")
      .select("is_featured")
      .eq("user_id", session.user.id)
      .eq("achievement_id", achievementId)
      .single();

    if (!current) {
      return { error: "Achievement not found" };
    }

    // Check featured limit (max 6)
    if (!current.is_featured) {
      const { count } = await supabase
        .from("user_achievements")
        .select("id", { count: "exact" })
        .eq("user_id", session.user.id)
        .eq("is_featured", true);

      if ((count || 0) >= 6) {
        return { error: "Maximum 6 featured achievements allowed" };
      }
    }

    // Toggle
    const newValue = !current.is_featured;
    const { error } = await supabase
      .from("user_achievements")
      .update({ is_featured: newValue })
      .eq("user_id", session.user.id)
      .eq("achievement_id", achievementId);

    if (error) {
      return { error: "Failed to update achievement" };
    }

    return { success: true, isFeatured: newValue };
  } catch (error) {
    console.error("[Achievements] Toggle featured error:", error);
    return { error: "Failed to update achievement" };
  }
}

/**
 * Get achievement progress for current user
 */
export async function getAchievementProgress(): Promise<{
  data?: AchievementProgress[];
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Get all achievements
    const { data: achievements } = await supabase
      .from("achievements")
      .select("slug, requirement_value")
      .eq("is_hidden", false);

    // Get user progress
    const { data: progress } = await supabase
      .from("achievement_progress")
      .select("achievement_slug, current_value")
      .eq("user_id", session.user.id);

    // Get earned achievements
    const { data: earned } = await supabase
      .from("user_achievements")
      .select("achievement:achievement_id (slug)")
      .eq("user_id", session.user.id);

    const earnedSlugs = new Set(
      (earned || []).map((e: { achievement: { slug: string } }) => e.achievement?.slug)
    );

    const progressMap = new Map<string, number>(
      (progress || []).map((p: { achievement_slug: string; current_value: number }) => [
        p.achievement_slug,
        p.current_value,
      ] as [string, number])
    );

    const result: AchievementProgress[] = (achievements || [])
      .filter((a: { slug: string }) => !earnedSlugs.has(a.slug))
      .map((a: { slug: string; requirement_value: number }) => {
        const current = progressMap.get(a.slug) ?? 0;
        return {
          slug: a.slug,
          currentValue: current,
          requiredValue: a.requirement_value,
          percentComplete: Math.min(100, Math.round((current / a.requirement_value) * 100)),
        };
      })
      .filter((p: AchievementProgress) => p.currentValue > 0);

    return { data: result };
  } catch (error) {
    console.error("[Achievements] Get progress error:", error);
    return { error: "Failed to load progress" };
  }
}

/**
 * Increment achievement progress (called internally)
 */
export async function incrementProgress(
  userId: string,
  achievementSlug: string,
  increment: number = 1
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Increment progress
    const { data } = await supabase.rpc("increment_achievement_progress", {
      p_user_id: userId,
      p_achievement_slug: achievementSlug,
      p_increment: increment,
    });

    // Check if newly earned
    const wasAwarded = await checkAndNotifyAchievement(userId, achievementSlug);

    return data !== null || wasAwarded;
  } catch (error) {
    console.error("[Achievements] Increment error:", error);
    return false;
  }
}

/**
 * Award a special achievement (called internally)
 */
export async function awardSpecialAchievement(
  userId: string,
  achievementSlug: string
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase.rpc("award_achievement", {
      p_user_id: userId,
      p_achievement_slug: achievementSlug,
    });

    if (data) {
      // Send notification
      const { data: achievement } = await supabase
        .from("achievements")
        .select("name, description")
        .eq("slug", achievementSlug)
        .single();

      if (achievement) {
        await createNotification({
          userId,
          type: "system",
          title: `Achievement Unlocked: ${achievement.name}`,
          message: achievement.description,
          resourceType: "achievement",
          resourceId: achievementSlug,
        });
      }
    }

    return !!data;
  } catch (error) {
    console.error("[Achievements] Award error:", error);
    return false;
  }
}

/**
 * Check and notify if achievement was earned
 */
async function checkAndNotifyAchievement(
  userId: string,
  achievementSlug: string
): Promise<boolean> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if newly earned (very recent)
    const { data } = await supabase
      .from("user_achievements")
      .select(
        `
        earned_at,
        achievement:achievement_id (name, description)
      `
      )
      .eq("user_id", userId)
      .gte("earned_at", new Date(Date.now() - 5000).toISOString()) // Last 5 seconds
      .single();

    if (data?.achievement) {
      await createNotification({
        userId,
        type: "system",
        title: `Achievement Unlocked: ${data.achievement.name}`,
        message: data.achievement.description,
        resourceType: "achievement",
        resourceId: achievementSlug,
      });
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

/**
 * Get achievement stats for a user
 */
export async function getAchievementStats(userId: string): Promise<{
  total: number;
  points: number;
  rank: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const { data } = await supabase
      .from("user")
      .select("achievements_count, achievement_points")
      .eq("id", userId)
      .single();

    const total = data?.achievements_count || 0;
    const points = data?.achievement_points || 0;

    // Determine rank based on points
    let rank = "Newcomer";
    if (points >= 1000) rank = "Legend";
    else if (points >= 500) rank = "Expert";
    else if (points >= 250) rank = "Veteran";
    else if (points >= 100) rank = "Regular";
    else if (points >= 50) rank = "Member";

    return { total, points, rank };
  } catch {
    return { total: 0, points: 0, rank: "Newcomer" };
  }
}

// Helper to map database row to Achievement type
function mapAchievement(row: {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  points: number;
  tier: string;
  requirement_type: string;
  requirement_value: number;
  is_hidden: boolean;
}): Achievement {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    icon: row.icon,
    category: row.category as Achievement["category"],
    points: row.points,
    tier: row.tier as Achievement["tier"],
    requirementType: row.requirement_type,
    requirementValue: row.requirement_value,
    isHidden: row.is_hidden,
  };
}

/**
 * Combined achievements data response
 */
export interface CompleteAchievementsData {
  earned: UserAchievement[];
  all: Achievement[];
  progress: AchievementProgress[];
  stats: { total: number; points: number; rank: string };
}

/**
 * Get all achievements data in a single request
 *
 * Performance optimization: calls getSession() once and runs all DB queries in parallel.
 * Use this for initial achievements page load.
 */
export async function getCompleteAchievementsData(): Promise<{
  data?: CompleteAchievementsData;
  error?: string;
}> {
  try {
    // Single session call for all operations
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    const userId = session.user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Run ALL queries in parallel
    const [
      // All achievements (public)
      allAchievementsData,
      // User's earned achievements
      earnedData,
      // User stats
      statsData,
      // Progress data
      progressAchievements,
      progressData,
    ] = await Promise.all([
      supabase
        .from("achievements")
        .select("*")
        .order("category", { ascending: true })
        .order("points", { ascending: true }),
      supabase
        .from("user_achievements")
        .select(`*, achievement:achievement_id (*)`)
        .eq("user_id", userId)
        .order("earned_at", { ascending: false }),
      supabase
        .from("user")
        .select("achievements_count, achievement_points")
        .eq("id", userId)
        .single(),
      supabase
        .from("achievements")
        .select("slug, requirement_value")
        .eq("is_hidden", false),
      supabase
        .from("achievement_progress")
        .select("achievement_slug, current_value")
        .eq("user_id", userId),
    ]);

    // Process earned achievements
    const earnedSlugs = new Set<string>();
    const earned: UserAchievement[] = (earnedData.data || []).map(
      (row: {
        id: string;
        earned_at: string;
        progress: number;
        is_featured: boolean;
        achievement: {
          id: string;
          slug: string;
          name: string;
          description: string;
          icon: string;
          category: string;
          points: number;
          tier: string;
          requirement_type: string;
          requirement_value: number;
          is_hidden: boolean;
        };
      }) => {
        earnedSlugs.add(row.achievement.slug);
        return {
          ...mapAchievement(row.achievement),
          earnedAt: row.earned_at,
          progress: row.progress,
          isFeatured: row.is_featured,
        };
      }
    );

    // Process all achievements
    const all = (allAchievementsData.data || []).map(mapAchievement);

    // Process stats
    const points = statsData.data?.achievement_points || 0;
    let rank = "Newcomer";
    if (points >= 1000) rank = "Legend";
    else if (points >= 500) rank = "Expert";
    else if (points >= 250) rank = "Veteran";
    else if (points >= 100) rank = "Regular";
    else if (points >= 50) rank = "Member";

    // Process progress
    const progressMap = new Map<string, number>(
      (progressData.data || []).map(
        (p: { achievement_slug: string; current_value: number }) =>
          [p.achievement_slug, p.current_value] as [string, number]
      )
    );

    const progress: AchievementProgress[] = (progressAchievements.data || [])
      .filter((a: { slug: string }) => !earnedSlugs.has(a.slug))
      .map((a: { slug: string; requirement_value: number }) => {
        const current = progressMap.get(a.slug) ?? 0;
        return {
          slug: a.slug,
          currentValue: current,
          requiredValue: a.requirement_value,
          percentComplete: Math.min(
            100,
            Math.round((current / a.requirement_value) * 100)
          ),
        };
      })
      .filter((p: AchievementProgress) => p.currentValue > 0);

    return {
      data: {
        earned,
        all,
        progress,
        stats: {
          total: statsData.data?.achievements_count || 0,
          points,
          rank,
        },
      },
    };
  } catch (error) {
    console.error("[Achievements] Complete data error:", error);
    return { error: "Failed to load achievements data" };
  }
}
