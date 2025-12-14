/**
 * Resource Sources API
 *
 * GET /api/admin/resources/sources
 *
 * List and manage discovery sources.
 * Requires admin or moderator authentication.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin", "moderator"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "50", 10);
    const isActive = searchParams.get("isActive");

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};
    if (isActive !== null && isActive !== undefined) {
      where.isActive = { equals: isActive === "true" };
    }

    const sources = await payload.find({
      collection: "resource-sources",
      where,
      page,
      limit,
      sort: "-createdAt",
    });

    return NextResponse.json(sources);
  } catch (error) {
    console.error("Sources API error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch sources" },
      { status: 500 }
    );
  }
}
