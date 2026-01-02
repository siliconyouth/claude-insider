import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";

/**
 * GET /api/users/search
 *
 * Search for users by name or display name.
 * Returns a list of users matching the search query.
 * Requires authentication.
 */

interface ProfileRow {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
}

interface UserRow {
  id: string;
  name: string | null;
  profiles: ProfileRow | ProfileRow[] | null;
}

export async function GET(request: NextRequest) {
  try {
    // Require authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

    if (!query.trim()) {
      return NextResponse.json({ users: [] });
    }

    const supabase = await createAdminClient();
    const searchTerm = `%${query.trim()}%`;

    // Search users by name with their profiles
    const { data: users, error } = await supabase
      .from("user")
      .select(`
        id,
        name,
        profiles!profiles_user_id_fkey (
          user_id,
          display_name,
          avatar_url
        )
      `)
      .ilike("name", searchTerm)
      .neq("id", session.user.id)
      .limit(limit);

    if (error) {
      console.error("User search error:", error);
      return NextResponse.json(
        { error: "Failed to search users" },
        { status: 500 }
      );
    }

    // Also search by display_name in profiles
    const { data: profileMatches, error: profileError } = await supabase
      .from("profiles")
      .select(`
        user_id,
        display_name,
        avatar_url
      `)
      .ilike("display_name", searchTerm)
      .neq("user_id", session.user.id)
      .limit(limit);

    if (profileError) {
      console.error("Profile search error:", profileError);
    }

    // Get user details for profile matches
    const profileUserIds = (profileMatches || [])
      .map((p) => p.user_id)
      .filter((id) => !(users || []).some((u: UserRow) => u.id === id));

    let additionalUsers: UserRow[] = [];
    if (profileUserIds.length > 0) {
      const { data: extraUsers } = await supabase
        .from("user")
        .select(`
          id,
          name,
          profiles!profiles_user_id_fkey (
            user_id,
            display_name,
            avatar_url
          )
        `)
        .in("id", profileUserIds);

      additionalUsers = (extraUsers || []) as UserRow[];
    }

    // Combine and format results
    const allUsers = [...(users || []) as UserRow[], ...additionalUsers];
    const userMap = new Map<string, {
      id: string;
      name: string;
      displayName?: string;
      avatarUrl?: string;
      status: string;
    }>();

    for (const user of allUsers) {
      const profile = Array.isArray(user.profiles) ? user.profiles[0] : user.profiles;
      userMap.set(user.id, {
        id: user.id,
        name: user.name || "Unknown",
        displayName: profile?.display_name || undefined,
        avatarUrl: profile?.avatar_url || undefined,
        status: "offline", // Default to offline, client can update from presence
      });
    }

    // Sort by relevance (exact matches first)
    const results = Array.from(userMap.values())
      .sort((a, b) => {
        const queryLower = query.toLowerCase();
        const aExact = (a.name.toLowerCase() === queryLower ||
          a.displayName?.toLowerCase() === queryLower) ? 0 : 1;
        const bExact = (b.name.toLowerCase() === queryLower ||
          b.displayName?.toLowerCase() === queryLower) ? 0 : 1;
        return aExact - bExact;
      })
      .slice(0, limit);

    return NextResponse.json({ users: results });
  } catch (error) {
    console.error("User search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
