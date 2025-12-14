/**
 * Bulk Queue Operations API
 *
 * POST /api/admin/resources/queue/bulk
 *
 * Perform bulk actions on multiple queue items.
 * Requires admin or moderator authentication.
 *
 * Request body:
 * - action: 'approve' | 'reject' | 'delete' | 'update_priority'
 * - ids: number[] - IDs of queue items to operate on
 * - data: object - Additional data for the action
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";

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

    const body = await request.json();
    const { action, ids, data = {} } = body;

    if (!action || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "Action and non-empty ids array are required" },
        { status: 400 }
      );
    }

    // Limit bulk operations
    if (ids.length > 50) {
      return NextResponse.json(
        { error: "Maximum 50 items per bulk operation" },
        { status: 400 }
      );
    }

    const results: { id: number; success: boolean; error?: string; resource?: unknown }[] = [];

    switch (action) {
      case "approve": {
        // Bulk approve - create resources for each item
        for (const id of ids) {
          try {
            const queueItem = await payload.findByID({
              collection: "resource-discovery-queue",
              id,
              depth: 1,
            });

            // Skip if already processed
            if (queueItem.status !== "pending") {
              results.push({
                id,
                success: false,
                error: `Already ${queueItem.status}`,
              });
              continue;
            }

            // Skip if no category is set
            if (!queueItem.suggestedCategory) {
              results.push({
                id,
                success: false,
                error: "Missing required category",
              });
              continue;
            }

            // Create resource
            const resource = await payload.create({
              collection: "resources",
              draft: false,
              data: {
                title: queueItem.title,
                description: queueItem.description,
                url: queueItem.url,
                category: queueItem.suggestedCategory,
                subcategory: queueItem.suggestedSubcategory ?? undefined,
                tags: queueItem.suggestedTags ?? undefined,
                difficulty: queueItem.suggestedDifficulty ?? undefined,
                status: queueItem.suggestedStatus || "community",
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
                  reviewNotes: "Bulk approved",
                },
                addedDate: new Date().toISOString(),
                lastVerified: new Date().toISOString(),
              },
            });

            // Update queue item
            await payload.update({
              collection: "resource-discovery-queue",
              id,
              data: {
                status: "approved",
                reviewedBy: user.id,
                reviewedAt: new Date().toISOString(),
                reviewNotes: "Bulk approved",
                createdResource: resource.id,
              },
            });

            results.push({ id, success: true, resource });
          } catch (error) {
            results.push({
              id,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        break;
      }

      case "reject": {
        const rejectionReason = data.rejectionReason || "Bulk rejected - did not meet standards";

        for (const id of ids) {
          try {
            await payload.update({
              collection: "resource-discovery-queue",
              id,
              data: {
                status: "rejected",
                reviewedBy: user.id,
                reviewedAt: new Date().toISOString(),
                rejectionReason,
              },
            });
            results.push({ id, success: true });
          } catch (error) {
            results.push({
              id,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        break;
      }

      case "delete": {
        // Only admins can bulk delete
        if (!hasRole(user, ["admin"])) {
          return NextResponse.json(
            { error: "Only admins can bulk delete" },
            { status: 403 }
          );
        }

        for (const id of ids) {
          try {
            await payload.delete({
              collection: "resource-discovery-queue",
              id,
            });
            results.push({ id, success: true });
          } catch (error) {
            results.push({
              id,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        break;
      }

      case "update_priority": {
        const { priority } = data;
        if (!["high", "normal", "low"].includes(priority)) {
          return NextResponse.json(
            { error: "Invalid priority value" },
            { status: 400 }
          );
        }

        for (const id of ids) {
          try {
            await payload.update({
              collection: "resource-discovery-queue",
              id,
              data: { priority },
            });
            results.push({ id, success: true });
          } catch (error) {
            results.push({
              id,
              success: false,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }
        break;
      }

      default:
        return NextResponse.json(
          { error: "Invalid action. Use 'approve', 'reject', 'delete', or 'update_priority'" },
          { status: 400 }
        );
    }

    const successful = results.filter((r) => r.success).length;
    const failed = results.filter((r) => !r.success).length;

    return NextResponse.json({
      success: true,
      action,
      summary: {
        total: ids.length,
        successful,
        failed,
      },
      results,
    });
  } catch (error) {
    console.error("Bulk operation error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Bulk operation failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({
    message: "POST to perform bulk operations on queue items",
    actions: {
      approve: { description: "Bulk approve and create resources" },
      reject: {
        description: "Bulk reject",
        data: { rejectionReason: "Optional rejection reason" },
      },
      delete: { description: "Bulk delete (admin only)" },
      update_priority: {
        description: "Update priority",
        data: { priority: "high|normal|low" },
      },
    },
    example: {
      action: "approve",
      ids: [1, 2, 3],
    },
  });
}
