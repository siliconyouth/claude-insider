/**
 * Single Queue Item API
 *
 * GET /api/admin/resources/queue/[id] - Get queue item
 * PATCH /api/admin/resources/queue/[id] - Update queue item (approve/reject)
 * DELETE /api/admin/resources/queue/[id] - Delete queue item
 *
 * Requires admin or moderator authentication.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";

type Params = Promise<{ id: string }>;

export async function GET(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
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

    const item = await payload.findByID({
      collection: "resource-discovery-queue",
      id: parseInt(id),
      depth: 2,
    });

    return NextResponse.json({ item });
  } catch (error) {
    console.error("Queue item fetch error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Item not found" },
      { status: 404 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
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

    const body = await request.json();
    const { action, ...updateData } = body;

    // Handle approve action
    if (action === "approve") {
      // Fetch the queue item
      const queueItem = await payload.findByID({
        collection: "resource-discovery-queue",
        id: parseInt(id),
        depth: 1,
      });

      // Create the resource
      const resource = await payload.create({
        collection: "resources",
        draft: false,
        data: {
          title: updateData.title || queueItem.title,
          description: updateData.description || queueItem.description,
          url: queueItem.url,
          category: updateData.category || queueItem.suggestedCategory,
          subcategory: updateData.subcategory || queueItem.suggestedSubcategory,
          tags: updateData.tags || queueItem.suggestedTags,
          difficulty: updateData.difficulty || queueItem.suggestedDifficulty,
          status: updateData.resourceStatus || queueItem.suggestedStatus || "community",
          publishStatus: "published",
          github: queueItem.github
            ? {
                owner: queueItem.github.owner,
                repo: queueItem.github.repo,
                stars: queueItem.github.stars || 0,
                forks: queueItem.github.forks || 0,
                lastUpdated: queueItem.github.lastCommit,
              }
            : undefined,
          discovery: {
            source: queueItem.source,
            discoveredAt: queueItem.createdAt,
            discoveredBy: "ai",
            aiConfidenceScore: queueItem.aiAnalysis?.confidenceScore,
            aiNotes: queueItem.aiAnalysis?.reasoning,
          },
          review: {
            reviewedBy: user.id,
            reviewedAt: new Date().toISOString(),
            reviewNotes: updateData.reviewNotes,
          },
          addedDate: new Date().toISOString(),
          lastVerified: new Date().toISOString(),
        },
      });

      // Update queue item status
      const updatedItem = await payload.update({
        collection: "resource-discovery-queue",
        id: parseInt(id),
        data: {
          status: "approved",
          reviewedBy: user.id,
          reviewedAt: new Date().toISOString(),
          reviewNotes: updateData.reviewNotes,
          createdResource: resource.id,
        },
      });

      return NextResponse.json({
        success: true,
        action: "approved",
        queueItem: updatedItem,
        resource,
      });
    }

    // Handle reject action
    if (action === "reject") {
      const updatedItem = await payload.update({
        collection: "resource-discovery-queue",
        id: parseInt(id),
        data: {
          status: "rejected",
          reviewedBy: user.id,
          reviewedAt: new Date().toISOString(),
          reviewNotes: updateData.reviewNotes,
          rejectionReason: updateData.rejectionReason || "Did not meet quality standards",
        },
      });

      return NextResponse.json({
        success: true,
        action: "rejected",
        item: updatedItem,
      });
    }

    // Handle duplicate action
    if (action === "duplicate") {
      if (!updateData.duplicateOf) {
        return NextResponse.json(
          { error: "duplicateOf is required for duplicate action" },
          { status: 400 }
        );
      }

      const updatedItem = await payload.update({
        collection: "resource-discovery-queue",
        id: parseInt(id),
        data: {
          status: "duplicate",
          reviewedBy: user.id,
          reviewedAt: new Date().toISOString(),
          duplicateOf: updateData.duplicateOf,
          reviewNotes: updateData.reviewNotes,
        },
      });

      return NextResponse.json({
        success: true,
        action: "duplicate",
        item: updatedItem,
      });
    }

    // General update
    const updatedItem = await payload.update({
      collection: "resource-discovery-queue",
      id: parseInt(id),
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      item: updatedItem,
    });
  } catch (error) {
    console.error("Queue item update error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Update failed" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Params }
) {
  try {
    const { id } = await params;
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

    // Only admins can delete
    if (!user || !hasRole(user, ["admin"])) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await payload.delete({
      collection: "resource-discovery-queue",
      id: parseInt(id),
    });

    return NextResponse.json({
      success: true,
      message: "Queue item deleted",
    });
  } catch (error) {
    console.error("Queue item delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
