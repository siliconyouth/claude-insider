/**
 * Admin Resources API
 *
 * POST /api/admin/resources - Create new resource
 *
 * Requires admin or moderator authentication.
 */

import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getPayload } from "payload";
import config from "@payload-config";
import { hasRole } from "@/collections/Users";
import { createResource, type CreateResourceInput } from "@/lib/resources/mutations";

/**
 * Create a new resource
 */
export async function POST(request: Request) {
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

    const body = (await request.json()) as CreateResourceInput;

    // Validate required fields
    if (!body.slug || !body.title || !body.description || !body.url || !body.category) {
      return NextResponse.json(
        { error: "Missing required fields: slug, title, description, url, category" },
        { status: 400 }
      );
    }

    const result = await createResource(body);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || "Failed to create resource" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: result.id,
      message: "Resource created successfully",
    });
  } catch (error) {
    console.error("Create resource error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Create failed" },
      { status: 500 }
    );
  }
}
