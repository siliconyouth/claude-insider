/**
 * User Search API
 *
 * Search for users by name or username.
 * Used for @ mentions autocomplete in chat and messaging.
 *
 * Query params:
 * - q: Search query (required)
 * - limit: Max results (default: 10, max: 20)
 * - prioritize: Comma-separated user IDs to prioritize (e.g., chat participants)
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "10"), 20);
    const prioritizeIds = searchParams.get("prioritize")?.split(",").filter(Boolean) || [];

    if (query.length < 1) {
      return NextResponse.json({ users: [] });
    }

    // Search users by name, username, or email (partial match)
    const searchTerm = `%${query}%`;

    // Build the query with priority ordering
    // Priority order:
    // 1. Chat participants matching the search (highest priority)
    // 2. Exact username match
    // 3. Username starts with query
    // 4. Name starts with query
    // 5. Other matches
    let orderByClause: string;
    let queryParams: (string | string[])[];

    if (prioritizeIds.length > 0) {
      // Include priority IDs in ordering
      orderByClause = `
        ORDER BY
          CASE WHEN u.id = ANY($5::text[]) THEN 0 ELSE 1 END,
          CASE
            WHEN p.username ILIKE $3 THEN 0
            WHEN p.username ILIKE $4 THEN 1
            WHEN u.name ILIKE $4 THEN 2
            ELSE 3
          END,
          u.name ASC
      `;
      queryParams = [searchTerm, session.user.id, query, query + "%", prioritizeIds];
    } else {
      orderByClause = `
        ORDER BY
          CASE
            WHEN p.username ILIKE $3 THEN 0
            WHEN p.username ILIKE $4 THEN 1
            WHEN u.name ILIKE $4 THEN 2
            ELSE 3
          END,
          u.name ASC
      `;
      queryParams = [searchTerm, session.user.id, query, query + "%"];
    }

    const result = await pool.query(
      `SELECT
        u.id,
        u.name,
        u.email,
        COALESCE(p.username, SPLIT_PART(u.email, '@', 1)) as username,
        p.display_name as "displayName",
        COALESCE(p.avatar_url, u.image) as "avatarUrl"
      FROM public."user" u
      LEFT JOIN public.profiles p ON p.user_id = u.id
      WHERE
        (u.name ILIKE $1 OR
         u.email ILIKE $1 OR
         p.username ILIKE $1 OR
         p.display_name ILIKE $1)
        AND u.id != $2
        AND (u.banned IS NULL OR u.banned = false)
      ${orderByClause}
      LIMIT ${limit}`,
      queryParams
    );

    // Clean up the response - don't expose email addresses
    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username || user.name?.toLowerCase().replace(/\s+/g, "") || "user",
      displayName: user.displayName || user.name,
      avatarUrl: user.avatarUrl,
      // Mark if this user is a chat participant (for UI highlighting)
      isParticipant: prioritizeIds.includes(user.id),
    }));

    return NextResponse.json({ users });
  } catch (error) {
    console.error("[User Search Error]:", error);
    return NextResponse.json(
      { error: "Failed to search users" },
      { status: 500 }
    );
  }
}
