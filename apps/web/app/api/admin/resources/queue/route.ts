/**
 * Resource Discovery Queue API
 *
 * GET /api/admin/resources/queue - List queue items with filters
 * POST /api/admin/resources/queue - Add item to queue
 *
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

    // Extract the payload-token from cookies
    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user using Payload's auth
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
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const source = searchParams.get("source");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const sort = searchParams.get("sort") || "-createdAt";

    // Build where clause
    type WhereClause = {
      status?: { equals: string };
      priority?: { equals: string };
      source?: { equals: number };
    };
    const where: WhereClause = {};
    if (status) {
      where.status = { equals: status };
    }
    if (priority) {
      where.priority = { equals: priority };
    }
    if (source) {
      where.source = { equals: parseInt(source) };
    }

    // Fetch queue items
    const queueItems = await payload.find({
      collection: "resource-discovery-queue",
      where: where as Parameters<typeof payload.find>[0]["where"],
      page,
      limit,
      sort,
      depth: 1, // Include related documents
    });

    // Get stats for dashboard
    const stats = await Promise.all([
      payload.count({
        collection: "resource-discovery-queue",
        where: { status: { equals: "pending" } },
      }),
      payload.count({
        collection: "resource-discovery-queue",
        where: { status: { equals: "approved" } },
      }),
      payload.count({
        collection: "resource-discovery-queue",
        where: { status: { equals: "rejected" } },
      }),
      payload.count({
        collection: "resource-discovery-queue",
        where: { priority: { equals: "high" } },
      }),
    ]);

    return NextResponse.json({
      items: queueItems.docs,
      pagination: {
        page: queueItems.page,
        totalPages: queueItems.totalPages,
        totalDocs: queueItems.totalDocs,
        hasNextPage: queueItems.hasNextPage,
        hasPrevPage: queueItems.hasPrevPage,
      },
      stats: {
        pending: stats[0].totalDocs,
        approved: stats[1].totalDocs,
        rejected: stats[2].totalDocs,
        highPriority: stats[3].totalDocs,
      },
    });
  } catch (error) {
    console.error("Queue fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch queue" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Extract the payload-token from cookies
    const tokenMatch = cookie.match(/payload-token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;

    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verify the user using Payload's auth
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

    // Parse request body
    const body = await request.json();
    const {
      title,
      description,
      url,
      suggestedCategory,
      suggestedSubcategory,
      suggestedTags,
      suggestedDifficulty,
      suggestedStatus,
      github,
      package: packageInfo,
      source,
      sourceUrl,
      rawData,
      aiAnalysis,
      priority = "normal",
    } = body;

    // Validate required fields
    if (!title || !description || !url) {
      return NextResponse.json(
        { error: "Title, description, and URL are required" },
        { status: 400 }
      );
    }

    // Check for duplicates by URL
    const existingByUrl = await payload.find({
      collection: "resource-discovery-queue",
      where: {
        url: { equals: url },
        status: { not_equals: "rejected" },
      },
      limit: 1,
    });

    if (existingByUrl.totalDocs > 0) {
      return NextResponse.json(
        { error: "This URL is already in the queue", duplicate: existingByUrl.docs[0] },
        { status: 409 }
      );
    }

    // Check if URL already exists in Resources
    const existingResource = await payload.find({
      collection: "resources",
      where: { url: { equals: url } },
      limit: 1,
    });

    if (existingResource.totalDocs > 0) {
      return NextResponse.json(
        { error: "This URL already exists as a resource", existing: existingResource.docs[0] },
        { status: 409 }
      );
    }

    // Create queue item
    const queueItem = await payload.create({
      collection: "resource-discovery-queue",
      data: {
        title,
        description,
        url,
        suggestedCategory,
        suggestedSubcategory,
        suggestedTags,
        suggestedDifficulty,
        suggestedStatus: suggestedStatus || "community",
        github,
        package: packageInfo,
        source,
        sourceUrl,
        rawData,
        aiAnalysis: aiAnalysis
          ? {
              ...aiAnalysis,
              analyzedAt: new Date().toISOString(),
            }
          : undefined,
        status: "pending",
        priority,
      },
    });

    return NextResponse.json({
      success: true,
      item: queueItem,
    });
  } catch (error) {
    console.error("Queue add error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to add to queue" },
      { status: 500 }
    );
  }
}
