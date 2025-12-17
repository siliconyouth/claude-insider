"use server";

/**
 * Profile Server Actions
 *
 * Aggregate functions for the user profile page.
 * Combines favorites, ratings, and collections data.
 *
 * Performance optimizations:
 * - getCompleteProfileData() calls getSession() once and runs all queries in parallel
 * - Individual functions still available for granular updates
 */

import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  username?: string;
  avatarUrl?: string;
  bio?: string;
  website?: string;
  joinedAt: string;
  // Extended profile fields
  role?: string;
  isBetaTester?: boolean;
  isVerified?: boolean;
  socialLinks?: Record<string, string>;
  followersCount?: number;
  followingCount?: number;
  achievementPoints?: number;
  donorTier?: "bronze" | "silver" | "gold" | "platinum" | null;
  achievements?: Array<{ id: string; unlockedAt: string }>;
  isOnline?: boolean;
  lastSeen?: string;
  stats: {
    favorites: number;
    ratings: number;
    collections: number;
    comments: number;
  };
}

export interface PrivacySettings {
  showEmail: boolean;
  showActivity: boolean;
  showCollections: boolean;
  showStats: boolean;
}

export interface FavoriteWithResource {
  id: string;
  resourceType: "resource" | "doc";
  resourceId: string;
  createdAt: string;
  // Resource metadata (loaded separately)
  title?: string;
  description?: string;
  url?: string;
}

export interface RatingWithResource {
  id: string;
  resourceType: "resource" | "doc";
  resourceId: string;
  rating: number;
  createdAt: string;
  updatedAt?: string;
  title?: string;
  description?: string;
  url?: string;
}

export interface CollectionWithItems {
  id: string;
  name: string;
  description?: string;
  isPublic: boolean;
  itemCount: number;
  createdAt: string;
  updatedAt: string;
}

/**
 * Get the current user's profile
 */
export async function getCurrentUserProfile(): Promise<{
  data?: UserProfile;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to view your profile" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const userId = session.user.id;

    // Get stats in parallel
    const [favoritesCount, ratingsCount, collectionsCount, commentsCount] =
      await Promise.all([
        supabase
          .from("favorites")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("ratings")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("collections")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
        supabase
          .from("comments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId),
      ]);

    // Get user profile data from user table directly
    const { data: profile } = await supabase
      .from("user")
      .select("bio, avatarUrl, socialLinks")
      .eq("id", userId)
      .single();

    const socialLinks = profile?.socialLinks as { website?: string } | null;

    return {
      data: {
        id: userId,
        name: session.user.name || "Anonymous",
        email: session.user.email || "",
        avatarUrl: profile?.avatarUrl || session.user.image || undefined,
        bio: profile?.bio || undefined,
        website: socialLinks?.website || undefined,
        joinedAt: session.user.createdAt instanceof Date
          ? session.user.createdAt.toISOString()
          : (session.user.createdAt || new Date().toISOString()),
        stats: {
          favorites: favoritesCount.count || 0,
          ratings: ratingsCount.count || 0,
          collections: collectionsCount.count || 0,
          comments: commentsCount.count || 0,
        },
      },
    };
  } catch (error) {
    console.error("[Profile] Get profile error:", error);
    return { error: "Failed to load profile" };
  }
}

/**
 * Get user's favorites with pagination
 */
export async function getUserFavoritesWithDetails(
  page = 1,
  limit = 20
): Promise<{
  data?: FavoriteWithResource[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("favorites")
      .select("id, resource_type, resource_id, created_at", { count: "exact" })
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Profile] Favorites fetch error:", error);
      return { error: "Failed to load favorites" };
    }

    return {
      data:
        data?.map(
          (f: {
            id: string;
            resource_type: "resource" | "doc";
            resource_id: string;
            created_at: string;
          }) => ({
            id: f.id,
            resourceType: f.resource_type,
            resourceId: f.resource_id,
            createdAt: f.created_at,
          })
        ) || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's ratings with pagination
 */
export async function getUserRatingsWithDetails(
  page = 1,
  limit = 20
): Promise<{
  data?: RatingWithResource[];
  total?: number;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;
    const offset = (page - 1) * limit;

    const { data, count, error } = await supabase
      .from("ratings")
      .select("id, resource_type, resource_id, rating, created_at, updated_at", {
        count: "exact",
      })
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error("[Profile] Ratings fetch error:", error);
      return { error: "Failed to load ratings" };
    }

    return {
      data:
        data?.map(
          (r: {
            id: string;
            resource_type: "resource" | "doc";
            resource_id: string;
            rating: number;
            created_at: string;
            updated_at?: string;
          }) => ({
            id: r.id,
            resourceType: r.resource_type,
            resourceId: r.resource_id,
            rating: r.rating,
            createdAt: r.created_at,
            updatedAt: r.updated_at,
          })
        ) || [],
      total: count || 0,
    };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Get user's collections with item counts
 */
export async function getUserCollectionsWithCounts(): Promise<{
  data?: CollectionWithItems[];
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
      .from("collections")
      .select("id, name, description, is_public, item_count, created_at, updated_at")
      .eq("user_id", session.user.id)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("[Profile] Collections fetch error:", error);
      return { error: "Failed to load collections" };
    }

    return {
      data:
        data?.map(
          (c: {
            id: string;
            name: string;
            description?: string;
            is_public: boolean;
            item_count: number;
            created_at: string;
            updated_at: string;
          }) => ({
            id: c.id,
            name: c.name,
            description: c.description,
            isPublic: c.is_public,
            itemCount: c.item_count,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
          })
        ) || [],
    };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update user profile
 *
 * Updates name, bio on the user table directly.
 * Note: website is stored in socialLinks.website JSON field.
 */
export async function updateUserProfile(data: {
  name?: string;
  bio?: string;
  website?: string;
}): Promise<{ success?: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Validate website URL if provided
    if (data.website) {
      try {
        new URL(data.website);
      } catch {
        return { error: "Please enter a valid website URL" };
      }
    }

    // Build update object for user table
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name || null;
    }

    if (data.bio !== undefined) {
      updateData.bio = data.bio || null;
    }

    // If website is provided, update it in socialLinks JSON
    if (data.website !== undefined) {
      // First get current socialLinks
      const { data: userData } = await supabase
        .from("user")
        .select("socialLinks")
        .eq("id", session.user.id)
        .single();

      const currentLinks = userData?.socialLinks || {};
      updateData.socialLinks = {
        ...currentLinks,
        website: data.website || null,
      };
    }

    // Update user table directly
    const { error } = await supabase
      .from("user")
      .update(updateData)
      .eq("id", session.user.id);

    if (error) {
      console.error("[Profile] Update error:", error);
      return { error: "Failed to update profile" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Default privacy settings
 */
const defaultPrivacySettings: PrivacySettings = {
  showEmail: false,
  showActivity: true,
  showCollections: true,
  showStats: true,
};

/**
 * Get user's privacy settings
 */
export async function getPrivacySettings(): Promise<{
  data?: PrivacySettings & { username?: string };
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
      .from("user")
      .select("username, profilePrivacy")
      .eq("id", session.user.id)
      .single();

    if (error) {
      console.error("[Profile] Privacy settings fetch error:", error);
      return { error: "Failed to load privacy settings" };
    }

    const privacy = (data?.profilePrivacy as PrivacySettings) || defaultPrivacySettings;

    return {
      data: {
        ...defaultPrivacySettings,
        ...privacy,
        username: data?.username || undefined,
      },
    };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update user's privacy settings
 */
export async function updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<{
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

    // Get current settings first
    const { data: current } = await supabase
      .from("user")
      .select("profilePrivacy")
      .eq("id", session.user.id)
      .single();

    const currentSettings = (current?.profilePrivacy as PrivacySettings) || defaultPrivacySettings;

    // Merge with new settings
    const updatedSettings: PrivacySettings = {
      ...currentSettings,
      ...settings,
    };

    const { error } = await supabase
      .from("user")
      .update({ profilePrivacy: updatedSettings })
      .eq("id", session.user.id);

    if (error) {
      console.error("[Profile] Privacy update error:", error);
      return { error: "Failed to update privacy settings" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Update username
 */
export async function updateUsername(username: string): Promise<{
  success?: boolean;
  error?: string;
}> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in" };
    }

    // Validate username format
    const usernameRegex = /^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/;
    const cleanUsername = username.toLowerCase().trim();

    if (!usernameRegex.test(cleanUsername)) {
      return {
        error:
          "Username must be 3-30 characters, start and end with a letter or number, and contain only lowercase letters, numbers, and hyphens",
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Check if username is already taken
    // Note: Don't use .single() here - it throws when no rows found
    const { data: existing } = await supabase
      .from("user")
      .select("id")
      .eq("username", cleanUsername)
      .neq("id", session.user.id);

    if (existing && existing.length > 0) {
      return { error: "This username is already taken" };
    }

    const { error } = await supabase
      .from("user")
      .update({ username: cleanUsername })
      .eq("id", session.user.id);

    if (error) {
      console.error("[Profile] Username update error:", error);
      return { error: "Failed to update username" };
    }

    return { success: true };
  } catch (error) {
    console.error("[Profile] Unexpected error:", error);
    return { error: "An unexpected error occurred" };
  }
}

/**
 * Combined profile data response
 */
export interface CompleteProfileData {
  profile: UserProfile;
  favorites: FavoriteWithResource[];
  favoritesTotal: number;
  ratings: RatingWithResource[];
  ratingsTotal: number;
  collections: CollectionWithItems[];
}

// Donor tier thresholds (same as in /api/users/[username]/route.ts)
const DONOR_TIERS = {
  platinum: 500,
  gold: 100,
  silver: 50,
  bronze: 10,
} as const;

function getDonorTier(totalAmount: number): "platinum" | "gold" | "silver" | "bronze" | null {
  if (totalAmount >= DONOR_TIERS.platinum) return "platinum";
  if (totalAmount >= DONOR_TIERS.gold) return "gold";
  if (totalAmount >= DONOR_TIERS.silver) return "silver";
  if (totalAmount >= DONOR_TIERS.bronze) return "bronze";
  return null;
}

/**
 * Get all profile data in a single request
 *
 * Performance optimization: calls getSession() once and runs all DB queries in parallel.
 * Use this for initial page load; use individual functions for updates/pagination.
 */
export async function getCompleteProfileData(options?: {
  favoritesLimit?: number;
  ratingsLimit?: number;
}): Promise<{
  data?: CompleteProfileData;
  error?: string;
}> {
  try {
    // Single session call for all operations
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to view your profile" };
    }

    const userId = session.user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    const favLimit = options?.favoritesLimit ?? 20;
    const ratLimit = options?.ratingsLimit ?? 20;

    // Run ALL queries in parallel - massive performance improvement
    const [
      // Stats counts (4 parallel count queries)
      favoritesCount,
      ratingsCount,
      collectionsCount,
      commentsCount,
      // Extended profile data from user table
      profileData,
      // Actual list data with pagination
      favoritesData,
      ratingsData,
      collectionsData,
      // Additional data for enhanced profile
      donationsData,
      achievementsData,
      presenceData,
    ] = await Promise.all([
      // Count queries (fast, index-only)
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("ratings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("collections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      // Extended profile from user table
      supabase
        .from("user")
        .select("username, bio, avatarUrl, socialLinks, role, isBetaTester, isVerified, achievement_points, followers_count, following_count")
        .eq("id", userId)
        .single(),
      // Favorites list
      supabase
        .from("favorites")
        .select("id, resource_type, resource_id, created_at", { count: "exact" })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(0, favLimit - 1),
      // Ratings list
      supabase
        .from("ratings")
        .select("id, resource_type, resource_id, rating, created_at, updated_at", {
          count: "exact",
        })
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .range(0, ratLimit - 1),
      // Collections list
      supabase
        .from("collections")
        .select("id, name, description, is_public, item_count, created_at, updated_at")
        .eq("user_id", userId)
        .order("updated_at", { ascending: false }),
      // Donations total for donor tier
      supabase
        .from("donations")
        .select("amount")
        .eq("user_id", userId)
        .eq("status", "completed"),
      // Achievements with slug from join
      supabase
        .from("user_achievements")
        .select("earned_at, achievements(slug)")
        .eq("user_id", userId)
        .order("earned_at", { ascending: false }),
      // Presence status
      supabase
        .from("user_presence")
        .select("status, last_seen_at")
        .eq("user_id", userId)
        .single(),
    ]);

    const profile = profileData.data;
    const socialLinks = profile?.socialLinks as Record<string, string> | null;

    // Calculate donor tier from total donations
    const totalDonated = (donationsData.data || []).reduce(
      (sum: number, d: { amount: number }) => sum + (d.amount || 0),
      0
    );
    const donorTier = getDonorTier(totalDonated);

    // Map achievements to expected format
    const achievements = (achievementsData.data || [])
      .filter((a: { achievements?: { slug?: string } }) => a.achievements?.slug)
      .map((a: { earned_at: string; achievements: { slug: string } }) => ({
        id: a.achievements.slug,
        unlockedAt: a.earned_at,
      }));

    // Get presence status
    const presence = presenceData.data;
    const isOnline = presence?.status === "online";
    const lastSeen = presence?.last_seen_at;

    return {
      data: {
        profile: {
          id: userId,
          name: session.user.name || "Anonymous",
          email: session.user.email || "",
          username: profile?.username || undefined,
          avatarUrl: profile?.avatarUrl || session.user.image || undefined,
          bio: profile?.bio || undefined,
          website: socialLinks?.website || undefined,
          // Extended fields
          role: profile?.role || "user",
          isBetaTester: profile?.isBetaTester || false,
          isVerified: profile?.isVerified || false,
          socialLinks: socialLinks || {},
          followersCount: profile?.followers_count || 0,
          followingCount: profile?.following_count || 0,
          achievementPoints: profile?.achievement_points || 0,
          donorTier,
          achievements,
          isOnline,
          lastSeen,
          joinedAt:
            session.user.createdAt instanceof Date
              ? session.user.createdAt.toISOString()
              : session.user.createdAt || new Date().toISOString(),
          stats: {
            favorites: favoritesCount.count || 0,
            ratings: ratingsCount.count || 0,
            collections: collectionsCount.count || 0,
            comments: commentsCount.count || 0,
          },
        },
        favorites:
          favoritesData.data?.map(
            (f: {
              id: string;
              resource_type: "resource" | "doc";
              resource_id: string;
              created_at: string;
            }) => ({
              id: f.id,
              resourceType: f.resource_type,
              resourceId: f.resource_id,
              createdAt: f.created_at,
            })
          ) || [],
        favoritesTotal: favoritesData.count || 0,
        ratings:
          ratingsData.data?.map(
            (r: {
              id: string;
              resource_type: "resource" | "doc";
              resource_id: string;
              rating: number;
              created_at: string;
              updated_at?: string;
            }) => ({
              id: r.id,
              resourceType: r.resource_type,
              resourceId: r.resource_id,
              rating: r.rating,
              createdAt: r.created_at,
              updatedAt: r.updated_at,
            })
          ) || [],
        ratingsTotal: ratingsData.count || 0,
        collections:
          collectionsData.data?.map(
            (c: {
              id: string;
              name: string;
              description?: string;
              is_public: boolean;
              item_count: number;
              created_at: string;
              updated_at: string;
            }) => ({
              id: c.id,
              name: c.name,
              description: c.description,
              isPublic: c.is_public,
              itemCount: c.item_count,
              createdAt: c.created_at,
              updatedAt: c.updated_at,
            })
          ) || [],
      },
    };
  } catch (error) {
    console.error("[Profile] Complete profile data error:", error);
    return { error: "Failed to load profile data" };
  }
}

/**
 * Notification preferences type (imported for settings)
 */
export interface NotificationPreferences {
  in_app_comments: boolean;
  in_app_replies: boolean;
  in_app_suggestions: boolean;
  in_app_follows: boolean;
  in_app_mentions: boolean;
  in_app_version_updates: boolean;
  email_comments: boolean;
  email_replies: boolean;
  email_suggestions: boolean;
  email_follows: boolean;
  email_version_updates: boolean;
  email_digest: boolean;
  email_digest_frequency: "daily" | "weekly" | "monthly";
  browser_notifications: boolean;
}

const defaultNotificationPreferences: NotificationPreferences = {
  in_app_comments: true,
  in_app_replies: true,
  in_app_suggestions: true,
  in_app_follows: true,
  in_app_mentions: true,
  in_app_version_updates: true,
  email_comments: false,
  email_replies: true,
  email_suggestions: true,
  email_follows: false,
  email_version_updates: false,
  email_digest: false,
  email_digest_frequency: "weekly",
  browser_notifications: false,
};

/**
 * Combined settings data response
 */
export interface CompleteSettingsData {
  profile: UserProfile;
  privacy: PrivacySettings & { username?: string };
  notifications: NotificationPreferences;
}

/**
 * Get all settings data in a single request
 *
 * Performance optimization: calls getSession() once and runs all DB queries in parallel.
 * Use this for initial settings page load.
 */
export async function getCompleteSettingsData(): Promise<{
  data?: CompleteSettingsData;
  error?: string;
}> {
  try {
    // Single session call for all operations
    const session = await getSession();
    if (!session?.user?.id) {
      return { error: "You must be signed in to access settings" };
    }

    const userId = session.user.id;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Run ALL queries in parallel
    const [
      // Stats counts for profile
      favoritesCount,
      ratingsCount,
      collectionsCount,
      commentsCount,
      // Profile data (combined: bio, avatarUrl, socialLinks, username, profilePrivacy)
      profileData,
      // Notification preferences
      notifData,
    ] = await Promise.all([
      // Count queries (fast, index-only)
      supabase
        .from("favorites")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("ratings")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("collections")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      supabase
        .from("comments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId),
      // User table for profile, username, and privacy settings (all in one query)
      supabase
        .from("user")
        .select("bio, avatarUrl, socialLinks, username, profilePrivacy")
        .eq("id", userId)
        .single(),
      // Notification preferences
      supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single(),
    ]);

    const userData = profileData.data; // Now combined: bio, avatarUrl, socialLinks, username, profilePrivacy
    const notifPrefs = notifData.data;
    const socialLinks = userData?.socialLinks as { website?: string } | null;
    const privacySettings = (userData?.profilePrivacy as PrivacySettings) || defaultPrivacySettings;

    return {
      data: {
        profile: {
          id: userId,
          name: session.user.name || "Anonymous",
          email: session.user.email || "",
          avatarUrl: userData?.avatarUrl || session.user.image || undefined,
          bio: userData?.bio || undefined,
          website: socialLinks?.website || undefined,
          joinedAt:
            session.user.createdAt instanceof Date
              ? session.user.createdAt.toISOString()
              : session.user.createdAt || new Date().toISOString(),
          stats: {
            favorites: favoritesCount.count || 0,
            ratings: ratingsCount.count || 0,
            collections: collectionsCount.count || 0,
            comments: commentsCount.count || 0,
          },
        },
        privacy: {
          ...defaultPrivacySettings,
          ...privacySettings,
          username: userData?.username || undefined,
        },
        notifications: notifPrefs
          ? {
              in_app_comments: notifPrefs.in_app_comments,
              in_app_replies: notifPrefs.in_app_replies,
              in_app_suggestions: notifPrefs.in_app_suggestions,
              in_app_follows: notifPrefs.in_app_follows,
              in_app_mentions: notifPrefs.in_app_mentions,
              in_app_version_updates: notifPrefs.in_app_version_updates ?? true,
              email_comments: notifPrefs.email_comments,
              email_replies: notifPrefs.email_replies,
              email_suggestions: notifPrefs.email_suggestions,
              email_follows: notifPrefs.email_follows,
              email_digest: notifPrefs.email_digest,
              email_digest_frequency: notifPrefs.email_digest_frequency,
              email_version_updates: notifPrefs.email_version_updates ?? false,
              browser_notifications: notifPrefs.browser_notifications ?? false,
            }
          : defaultNotificationPreferences,
      },
    };
  } catch (error) {
    console.error("[Profile] Complete settings data error:", error);
    return { error: "Failed to load settings data" };
  }
}
