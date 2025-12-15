/**
 * Dashboard Users API
 *
 * List users (admin only).
 * Uses Supabase admin client for reliable access to user data.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import type { AdminUserListItem, PaginatedResponse } from "@/types/admin";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - admin only for user management
    const userRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "all";
    const isBetaTester = searchParams.get("isBetaTester");
    const sortBy = searchParams.get("sortBy") || "createdAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
    const offset = (page - 1) * limit;

    // Use Supabase admin client for reliable access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    console.log("[Dashboard Users] Starting query with params:", { search, role, page, limit, sortBy, sortOrder });

    // Build query with filters - select only columns guaranteed to exist
    // Note: banned column may not exist if migration 041 wasn't applied
    let query = supabase
      .from("user")
      .select("*", { count: "exact" });

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply role filter
    if (role !== "all") {
      query = query.eq("role", role);
    }

    // Apply beta tester filter
    if (isBetaTester === "true") {
      query = query.eq("isBetaTester", true);
    } else if (isBetaTester === "false") {
      query = query.or("isBetaTester.eq.false,isBetaTester.is.null");
    }

    // Apply sorting
    const validSortFields = ["name", "email", "createdAt", "role"];
    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    query = query.order(sortField, { ascending: sortOrder === "asc" });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    console.log("[Dashboard Users] Query result:", {
      dataLength: data?.length || 0,
      count,
      error: error ? { message: error.message, code: error.code, details: error.details } : null
    });

    if (error) {
      console.error("[Dashboard Users] Supabase error:", error);
      return NextResponse.json(
        { error: `Failed to fetch users: ${error.message}` },
        { status: 500 }
      );
    }

    const total = count || 0;
    const items: AdminUserListItem[] = (data || []).map((row: Record<string, unknown>) => ({
      id: row.id as string,
      name: row.name as string | null,
      email: row.email as string,
      image: row.image as string | null,
      role: (row.role as UserRole) || "user",
      isBetaTester: (row.isBetaTester as boolean) || false,
      emailVerified: (row.emailVerified as boolean) || false,
      banned: (row.banned as boolean) || false,
      createdAt: row.createdAt ? new Date(row.createdAt as string).toISOString() : new Date().toISOString(),
    }));

    console.log("[Dashboard Users] Returning", items.length, "users out of", total, "total");

    const response: PaginatedResponse<AdminUserListItem> = {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("[Dashboard Users List Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get users" },
      { status: 500 }
    );
  }
}
