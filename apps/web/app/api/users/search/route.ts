/**
 * User Search API
 *
 * Search for users by name or username.
 * Used for @ mentions autocomplete in chat and messaging.
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

    if (query.length < 1) {
      return NextResponse.json({ users: [] });
    }

    // Search users by name, username, or email (partial match)
    const searchTerm = `%${query}%`;

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
      ORDER BY
        CASE
          WHEN p.username ILIKE $3 THEN 0
          WHEN u.name ILIKE $3 THEN 1
          ELSE 2
        END,
        u.name ASC
      LIMIT $4`,
      [searchTerm, session.user.id, query + "%", limit]
    );

    // Clean up the response - don't expose email addresses
    const users = result.rows.map(user => ({
      id: user.id,
      name: user.name,
      username: user.username || user.name?.toLowerCase().replace(/\s+/g, "") || "user",
      displayName: user.displayName || user.name,
      avatarUrl: user.avatarUrl,
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
