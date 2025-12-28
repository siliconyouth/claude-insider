/**
 * User Directory API
 *
 * Provides various user lists for the public directory page:
 * - featured: Verified/featured users
 * - new: Recently joined users
 * - active: Most recently active users
 * - achievers: Users with highest achievement points
 * - donors: Top donors (with consent to show on donor wall)
 * - following: Users the current user follows (auth required)
 * - followers: Users following the current user (auth required)
 *
 * Also supports search with filters.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Donor tier thresholds
const DONOR_TIERS = {
  platinum: 500,
  gold: 100,
  silver: 50,
  bronze: 10,
} as const;

function getDonorTier(
  totalAmount: number
): "platinum" | "gold" | "silver" | "bronze" | null {
  if (totalAmount >= DONOR_TIERS.platinum) return "platinum";
  if (totalAmount >= DONOR_TIERS.gold) return "gold";
  if (totalAmount >= DONOR_TIERS.silver) return "silver";
  if (totalAmount >= DONOR_TIERS.bronze) return "bronze";
  return null;
}

interface DirectoryUser {
  id: string;
  username: string;
  name: string;
  bio: string | null;
  avatar: string | null;
  role: string;
  isBetaTester: boolean;
  isVerified: boolean;
  joinedAt: string;
  achievementPoints: number;
  followersCount: number;
  followingCount: number;
  donorTier: "platinum" | "gold" | "silver" | "bronze" | null;
  totalDonated?: number; // Only for donors list
  isOnline: boolean;
  lastSeen: string | null;
  isFollowing?: boolean; // Only if authenticated
}

type ListType =
  | "featured"
  | "new"
  | "active"
  | "achievers"
  | "donors"
  | "following"
  | "followers"
  | "search";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const list = (searchParams.get("list") as ListType) || "featured";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;
    const search = searchParams.get("search")?.trim();

    // Filters
    const roleFilter = searchParams.get("role"); // 'verified', 'betaTester', 'staff'
    const donorFilter = searchParams.get("donor"); // 'bronze', 'silver', 'gold', 'platinum'

    // Get current user for authenticated lists and follow status
    const session = await getSession();
    const currentUserId = session?.user?.id;

    // Check if requesting authenticated-only lists
    if ((list === "following" || list === "followers") && !currentUserId) {
      return NextResponse.json(
        { error: "Authentication required for this list" },
        { status: 401 }
      );
    }

    // Build the base query based on list type
    let orderBy = "";
    let whereClause = 'WHERE u.banned = false AND u.role != \'ai_assistant\'';
    let joinClause = "";
    let selectExtra = "";

    switch (list) {
      case "featured":
        // Verified users first, then beta testers, then by followers
        whereClause += ' AND (u."isVerified" = true OR u."isBetaTester" = true OR u.role IN (\'admin\', \'superadmin\', \'moderator\', \'editor\'))';
        orderBy = 'ORDER BY u."isVerified" DESC, u.role = \'superadmin\' DESC, u.role = \'admin\' DESC, u.followers_count DESC';
        break;

      case "new":
        orderBy = 'ORDER BY u."createdAt" DESC';
        break;

      case "active":
        // Join with presence table, order by last seen
        joinClause = "LEFT JOIN user_presence up ON up.user_id = u.id";
        orderBy = "ORDER BY up.last_seen_at DESC NULLS LAST";
        break;

      case "achievers":
        whereClause += " AND u.achievement_points > 0";
        orderBy = "ORDER BY u.achievement_points DESC, u.followers_count DESC";
        break;

      case "donors":
        // Join with donor_badges for users who opted in to donor wall
        joinClause = "JOIN donor_badges db ON db.user_id = u.id AND db.show_on_donor_wall = true";
        selectExtra = ", db.total_donated";
        orderBy = "ORDER BY db.total_donated DESC";
        break;

      case "following":
        // Users the current user follows
        joinClause = `JOIN user_follows uf ON uf.following_id = u.id AND uf.follower_id = '${currentUserId}'`;
        orderBy = "ORDER BY uf.created_at DESC";
        break;

      case "followers":
        // Users following the current user
        joinClause = `JOIN user_follows uf ON uf.follower_id = u.id AND uf.following_id = '${currentUserId}'`;
        orderBy = "ORDER BY uf.created_at DESC";
        break;

      case "search":
        if (!search || search.length < 2) {
          return NextResponse.json(
            { error: "Search query must be at least 2 characters" },
            { status: 400 }
          );
        }
        // Search will be added below
        orderBy = "ORDER BY u.followers_count DESC, u.achievement_points DESC";
        break;

      default:
        orderBy = "ORDER BY u.followers_count DESC";
    }

    // Add search filter if provided
    if (search && search.length >= 2) {
      const searchPattern = `%${search.toLowerCase()}%`;
      whereClause += ` AND (LOWER(u.username) LIKE '${searchPattern}' OR LOWER(u.name) LIKE '${searchPattern}' OR LOWER(u."displayName") LIKE '${searchPattern}')`;
    }

    // Add role filters
    if (roleFilter) {
      switch (roleFilter) {
        case "verified":
          whereClause += ' AND u."isVerified" = true';
          break;
        case "betaTester":
          whereClause += ' AND u."isBetaTester" = true';
          break;
        case "staff":
          whereClause += " AND u.role IN ('admin', 'superadmin', 'moderator', 'editor')";
          break;
      }
    }

    // Add donor filter
    if (donorFilter && ["bronze", "silver", "gold", "platinum"].includes(donorFilter)) {
      if (!joinClause.includes("donor_badges")) {
        joinClause += " LEFT JOIN donor_badges db ON db.user_id = u.id";
      }
      const tierThreshold = DONOR_TIERS[donorFilter as keyof typeof DONOR_TIERS];
      whereClause += ` AND db.total_donated >= ${tierThreshold}`;
    }

    // Count total for pagination
    const countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM "user" u
      ${joinClause}
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0]?.total || "0");
    const totalPages = Math.ceil(total / limit);

    // Fetch users
    const usersQuery = `
      SELECT DISTINCT
        u.id,
        u.username,
        u.name,
        u."displayName",
        u.bio,
        u.image,
        u."avatarUrl",
        u.role,
        u."isBetaTester",
        u."isVerified",
        u."createdAt",
        u.achievement_points,
        u.followers_count,
        u.following_count
        ${selectExtra}
      FROM "user" u
      ${joinClause}
      ${whereClause}
      ${orderBy}
      LIMIT $1 OFFSET $2
    `;

    const usersResult = await pool.query(usersQuery, [limit, offset]);
    const userIds = usersResult.rows.map((u) => u.id);

    if (userIds.length === 0) {
      return NextResponse.json({
        users: [],
        total,
        totalPages,
        page,
        limit,
      });
    }

    // Batch fetch presence data
    const presenceResult = await pool.query(
      `SELECT user_id, status, last_seen_at FROM user_presence WHERE user_id = ANY($1)`,
      [userIds]
    );
    const presenceMap = new Map(
      presenceResult.rows.map((p) => [
        p.user_id,
        { status: p.status, lastSeen: p.last_seen_at?.toISOString() },
      ])
    );

    // Batch fetch donor info (if not already in query)
    let donorMap = new Map<
      string,
      { tier: "platinum" | "gold" | "silver" | "bronze" | null; total: number }
    >();
    if (list !== "donors") {
      const donorResult = await pool.query(
        `SELECT user_id, total_donated FROM donor_badges WHERE user_id = ANY($1)`,
        [userIds]
      );
      donorMap = new Map(
        donorResult.rows.map((d) => [
          d.user_id,
          {
            tier: getDonorTier(parseFloat(d.total_donated || "0")),
            total: parseFloat(d.total_donated || "0"),
          },
        ])
      );
    }

    // Batch fetch follow status if authenticated
    let followingSet = new Set<string>();
    if (currentUserId) {
      const followResult = await pool.query(
        `SELECT following_id FROM user_follows WHERE follower_id = $1 AND following_id = ANY($2)`,
        [currentUserId, userIds]
      );
      followingSet = new Set(followResult.rows.map((f) => f.following_id));
    }

    // Build response
    const users: DirectoryUser[] = usersResult.rows.map((u) => {
      const presence = presenceMap.get(u.id);
      const donor = donorMap.get(u.id) || {
        tier: getDonorTier(parseFloat(u.total_donated || "0")),
        total: parseFloat(u.total_donated || "0"),
      };

      return {
        id: u.id,
        username: u.username,
        name: u.displayName || u.name || "Anonymous",
        bio: u.bio,
        avatar: u.avatarUrl || u.image,
        role: u.role,
        isBetaTester: u.isBetaTester || false,
        isVerified: u.isVerified || false,
        joinedAt: u.createdAt?.toISOString(),
        achievementPoints: u.achievement_points || 0,
        followersCount: parseInt(u.followers_count) || 0,
        followingCount: parseInt(u.following_count) || 0,
        donorTier: donor.tier,
        ...(list === "donors" && { totalDonated: donor.total }),
        isOnline: presence?.status === "online",
        lastSeen: presence?.lastSeen || null,
        ...(currentUserId && { isFollowing: followingSet.has(u.id) }),
      };
    });

    return NextResponse.json({
      users,
      total,
      totalPages,
      page,
      limit,
    });
  } catch (error) {
    console.error("[User Directory Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch users" },
      { status: 500 }
    );
  }
}
