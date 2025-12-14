/**
 * Resource Analytics API
 *
 * GET /api/admin/resources/analytics
 *
 * Returns statistics and metrics for the resource admin dashboard.
 * Requires admin or moderator authentication.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";

interface DailyStats {
  date: string;
  discovered: number;
  approved: number;
  rejected: number;
}

interface CategoryStats {
  category: string;
  count: number;
  percentage: number;
}

interface SourceStats {
  sourceId: number;
  sourceName: string;
  sourceType: string;
  discovered: number;
  approved: number;
  successRate: number;
}

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Verify the user
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
    const days = parseInt(searchParams.get("days") || "30");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch all necessary data in parallel
    const [
      totalResources,
      pendingQueue,
      recentQueue,
      sources,
      resourcesByCategory,
    ] = await Promise.all([
      // Total resources
      payload.count({ collection: "resources" }),

      // Pending queue count
      payload.count({
        collection: "resource-discovery-queue",
        where: { status: { equals: "pending" } },
      }),

      // Recent queue items for time series
      payload.find({
        collection: "resource-discovery-queue",
        where: {
          createdAt: { greater_than_equal: startDate.toISOString() },
        },
        limit: 10000,
        sort: "createdAt",
      }),

      // All sources
      payload.find({
        collection: "resource-sources",
        limit: 100,
      }),

      // Resources by category
      payload.find({
        collection: "resources",
        limit: 10000,
      }),
    ]);

    // Calculate daily stats
    const dailyMap = new Map<string, DailyStats>();
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      const dateStr = date.toISOString().split("T")[0];
      if (dateStr) {
        dailyMap.set(dateStr, {
          date: dateStr,
          discovered: 0,
          approved: 0,
          rejected: 0,
        });
      }
    }

    // Populate daily stats from queue items
    for (const item of recentQueue.docs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const doc = item as any;
      const dateStr = new Date(doc.createdAt).toISOString().split("T")[0];
      if (dateStr) {
        const day = dailyMap.get(dateStr);
        if (day) {
          day.discovered++;
          if (doc.status === "approved") day.approved++;
          if (doc.status === "rejected") day.rejected++;
        }
      }
    }

    const dailyStats: DailyStats[] = Array.from(dailyMap.values());

    // Calculate category distribution
    const categoryMap = new Map<string, number>();
    for (const resource of resourcesByCategory.docs) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const cat = (resource as any).category || "uncategorized";
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    }

    const totalCat = resourcesByCategory.docs.length || 1;
    const categoryStats: CategoryStats[] = Array.from(categoryMap.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: Math.round((count / totalCat) * 100),
      }))
      .sort((a, b) => b.count - a.count);

    // Calculate source performance
    const sourceStats: SourceStats[] = sources.docs.map((source) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const src = source as any;
      // Count queue items from this source
      const fromSource = recentQueue.docs.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.source?.toString() === src.id?.toString()
      );
      const approved = fromSource.filter(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (item: any) => item.status === "approved"
      ).length;

      return {
        sourceId: src.id,
        sourceName: src.name,
        sourceType: src.type,
        discovered: fromSource.length,
        approved,
        successRate:
          fromSource.length > 0
            ? Math.round((approved / fromSource.length) * 100)
            : 0,
      };
    }).sort((a, b) => b.discovered - a.discovered);

    // Calculate summary stats
    const totalDiscovered = recentQueue.totalDocs;
    const totalApproved = recentQueue.docs.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => item.status === "approved"
    ).length;
    const totalRejected = recentQueue.docs.filter(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (item: any) => item.status === "rejected"
    ).length;

    // Approval rate
    const processedCount = totalApproved + totalRejected;
    const approvalRate =
      processedCount > 0 ? Math.round((totalApproved / processedCount) * 100) : 0;

    return NextResponse.json({
      success: true,
      period: {
        days,
        startDate: startDate.toISOString(),
        endDate: new Date().toISOString(),
      },
      summary: {
        totalResources: totalResources.totalDocs,
        pendingQueue: pendingQueue.totalDocs,
        totalDiscovered,
        totalApproved,
        totalRejected,
        approvalRate,
        activeSources: sources.docs.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (s: any) => s.isActive
        ).length,
      },
      charts: {
        dailyStats,
        categoryDistribution: categoryStats.slice(0, 10),
        sourcePerformance: sourceStats.slice(0, 10),
      },
    });
  } catch (error) {
    console.error("Analytics API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
