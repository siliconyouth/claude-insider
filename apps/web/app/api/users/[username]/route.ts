/**
 * Public Profile API
 *
 * Get public profile information for a user by username.
 * Respects privacy settings.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

interface PrivacySettings {
  showEmail: boolean;
  showActivity: boolean;
  showCollections: boolean;
  showStats: boolean;
}

// Donor tier thresholds
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
 * Get public profile by username
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  try {
    const { username } = await params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    // Get current user (if logged in) to check if viewing own profile
    const session = await getSession();
    const currentUserId = session?.user?.id;

    // Fetch user by username
    const userResult = await pool.query(
      `
      SELECT
        id,
        name,
        username,
        email,
        image,
        "displayName",
        bio,
        "avatarUrl",
        "isBetaTester",
        "isVerified",
        role,
        "profilePrivacy",
        "socialLinks",
        "createdAt",
        achievement_points
      FROM "user"
      WHERE username = $1
    `,
      [username.toLowerCase()]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const user = userResult.rows[0];
    const isOwnProfile = currentUserId === user.id;
    const privacy: PrivacySettings = user.profilePrivacy || {
      showEmail: false,
      showActivity: true,
      showCollections: true,
      showStats: true,
    };

    // Get follower counts
    const followCountsResult = await pool.query(
      `
      SELECT
        (SELECT COUNT(*) FROM user_follows WHERE following_id = $1) as followers_count,
        (SELECT COUNT(*) FROM user_follows WHERE follower_id = $1) as following_count
    `,
      [user.id]
    );

    const followersCount = parseInt(followCountsResult.rows[0]?.followers_count || "0");
    const followingCount = parseInt(followCountsResult.rows[0]?.following_count || "0");

    // Check if current user is following this profile
    let isFollowing = false;
    if (currentUserId && currentUserId !== user.id) {
      const followCheckResult = await pool.query(
        `SELECT id FROM user_follows WHERE follower_id = $1 AND following_id = $2`,
        [currentUserId, user.id]
      );
      isFollowing = followCheckResult.rows.length > 0;
    }

    // Get donor tier from total donations
    const donationResult = await pool.query(
      `
      SELECT COALESCE(SUM(amount), 0) as total_amount
      FROM donations
      WHERE user_id = $1 AND status = 'completed'
    `,
      [user.id]
    );
    const totalDonated = parseFloat(donationResult.rows[0]?.total_amount || "0");
    const donorTier = getDonorTier(totalDonated);

    // Get online status
    const presenceResult = await pool.query(
      `
      SELECT status, last_seen
      FROM user_presence
      WHERE user_id = $1
    `,
      [user.id]
    );
    const presence = presenceResult.rows[0];
    const isOnline = presence?.status === "online";
    const lastSeen = presence?.last_seen?.toISOString();

    // Get user achievements (unlocked ones)
    const achievementsResult = await pool.query(
      `
      SELECT
        achievement_id,
        unlocked_at
      FROM user_achievements
      WHERE user_id = $1
      ORDER BY unlocked_at DESC
    `,
      [user.id]
    );
    const userAchievements = achievementsResult.rows.map((a) => ({
      id: a.achievement_id,
      unlockedAt: a.unlocked_at?.toISOString(),
    }));

    // Build public profile response
    const publicProfile: Record<string, unknown> = {
      id: user.id,
      username: user.username,
      name: user.displayName || user.name,
      bio: user.bio,
      avatar: user.avatarUrl || user.image,
      isBetaTester: user.isBetaTester,
      isVerified: user.isVerified,
      role: user.role,
      socialLinks: user.socialLinks || {},
      joinedAt: user.createdAt,
      isOwnProfile,
      isFollowing,
      followersCount,
      followingCount,
      // New fields
      donorTier,
      achievementPoints: user.achievement_points || 0,
      achievements: userAchievements,
      isOnline,
      lastSeen,
    };

    // Include email if allowed or own profile
    if (privacy.showEmail || isOwnProfile) {
      publicProfile.email = user.email;
    }

    // Get stats if allowed
    if (privacy.showStats || isOwnProfile) {
      const statsResult = await pool.query(
        `
        SELECT
          (SELECT COUNT(*) FROM favorites WHERE user_id = $1) as favorites_count,
          (SELECT COUNT(*) FROM collections WHERE user_id = $1 AND (is_public = true OR $2)) as collections_count,
          (SELECT COUNT(*) FROM comments WHERE user_id = $1 AND status = 'approved') as comments_count,
          (SELECT COUNT(*) FROM edit_suggestions WHERE user_id = $1) as suggestions_count
      `,
        [user.id, isOwnProfile]
      );

      if (statsResult.rows.length > 0) {
        const stats = statsResult.rows[0];
        publicProfile.stats = {
          favorites: parseInt(stats.favorites_count),
          collections: parseInt(stats.collections_count),
          comments: parseInt(stats.comments_count),
          suggestions: parseInt(stats.suggestions_count),
        };
      }
    }

    // Get public collections if allowed
    if (privacy.showCollections || isOwnProfile) {
      const collectionsResult = await pool.query(
        `
        SELECT
          id,
          name,
          description,
          slug,
          color,
          icon,
          is_public,
          item_count,
          created_at
        FROM collections
        WHERE user_id = $1
        AND (is_public = true OR $2)
        ORDER BY created_at DESC
        LIMIT 6
      `,
        [user.id, isOwnProfile]
      );

      publicProfile.collections = collectionsResult.rows.map((c) => ({
        id: c.id,
        name: c.name,
        description: c.description,
        slug: c.slug,
        color: c.color,
        icon: c.icon,
        isPublic: c.is_public,
        itemCount: c.item_count,
        createdAt: c.created_at?.toISOString(),
      }));
    }

    // Get recent activity if allowed
    if (privacy.showActivity || isOwnProfile) {
      // Recent approved comments
      const commentsResult = await pool.query(
        `
        SELECT
          id,
          resource_type,
          resource_id,
          content,
          created_at
        FROM comments
        WHERE user_id = $1 AND status = 'approved'
        ORDER BY created_at DESC
        LIMIT 5
      `,
        [user.id]
      );

      publicProfile.recentComments = commentsResult.rows.map((c) => ({
        id: c.id,
        resourceType: c.resource_type,
        resourceId: c.resource_id,
        content: c.content.substring(0, 100) + (c.content.length > 100 ? "..." : ""),
        createdAt: c.created_at?.toISOString(),
      }));

      // Recent suggestions (approved/merged only for public)
      const suggestionsResult = await pool.query(
        `
        SELECT
          id,
          resource_type,
          resource_id,
          title,
          status,
          created_at
        FROM edit_suggestions
        WHERE user_id = $1
        AND (status IN ('approved', 'merged') OR $2)
        ORDER BY created_at DESC
        LIMIT 5
      `,
        [user.id, isOwnProfile]
      );

      publicProfile.recentSuggestions = suggestionsResult.rows.map((s) => ({
        id: s.id,
        resourceType: s.resource_type,
        resourceId: s.resource_id,
        title: s.title,
        status: s.status,
        createdAt: s.created_at?.toISOString(),
      }));
    }

    return NextResponse.json({ profile: publicProfile });
  } catch (error) {
    console.error("[Public Profile Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get profile" },
      { status: 500 }
    );
  }
}
