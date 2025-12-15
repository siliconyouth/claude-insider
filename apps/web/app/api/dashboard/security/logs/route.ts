/**
 * Security Logs API
 *
 * Returns paginated and filterable security logs.
 * Super Admin only endpoint - contains sensitive IP and user agent data.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { isSuperAdmin, type UserRole } from "@/lib/roles";
import {
  getSecurityLogs,
  type SecurityEventType,
  type SecuritySeverity,
} from "@/lib/security-logger";

export async function GET(request: NextRequest) {
  try {
    // Check authentication - superadmin only (contains PII)
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!isSuperAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden - Super Admin only" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const eventType = searchParams.get("eventType") as SecurityEventType | null;
    const severity = searchParams.get("severity") as SecuritySeverity | null;
    const isBot = searchParams.get("isBot");
    const honeypotServed = searchParams.get("honeypotServed");
    const visitorId = searchParams.get("visitorId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    // Get filtered logs
    const { logs, total } = await getSecurityLogs({
      limit,
      offset,
      eventType: eventType || undefined,
      severity: severity || undefined,
      isBot: isBot !== null ? isBot === "true" : undefined,
      honeypotServed: honeypotServed !== null ? honeypotServed === "true" : undefined,
      visitorId: visitorId || undefined,
      userId: userId || undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      logs,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + logs.length < total,
      },
    });
  } catch (error) {
    console.error("[Security Logs Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get security logs" },
      { status: 500 }
    );
  }
}
