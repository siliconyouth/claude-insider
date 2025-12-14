/**
 * Audit Logs API
 *
 * GET /api/admin/audit-logs
 *
 * Returns audit logs with filtering and pagination.
 * Admin only.
 */

import { getPayload } from "payload";
import config from "@payload-config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { hasRole } from "@/collections/Users";
import { getAuditLogs, getAuditStats, type AuditAction, type AuditStatus } from "@/lib/audit";

export async function GET(request: Request) {
  try {
    const payload = await getPayload({ config });

    // Get the auth token from cookies
    const headersList = await headers();
    const cookie = headersList.get("cookie") || "";

    // Verify the user is admin
    let user;
    try {
      const authResult = await payload.auth({
        headers: new Headers({ cookie }),
      });
      user = authResult.user;
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    if (!user || !hasRole(user, ["admin"])) {
      return NextResponse.json(
        { error: "Forbidden - admin only" },
        { status: 403 }
      );
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action") as AuditAction | null;
    const userId = searchParams.get("userId");
    const collection = searchParams.get("collection");
    const status = searchParams.get("status") as AuditStatus | null;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const includeStats = searchParams.get("includeStats") === "true";

    // Get logs with filters
    const logs = await getAuditLogs({
      action: action || undefined,
      userId: userId || undefined,
      collection: collection || undefined,
      status: status || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      limit,
    });

    // Optionally include stats
    let stats = null;
    if (includeStats) {
      stats = await getAuditStats(7);
    }

    return NextResponse.json({
      success: true,
      ...logs,
      stats,
    });
  } catch (error) {
    console.error("Audit logs API error:", error);
    return NextResponse.json(
      { error: "Failed to fetch audit logs" },
      { status: 500 }
    );
  }
}
