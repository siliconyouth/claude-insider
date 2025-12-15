/**
 * Visitor Management API
 *
 * List, block, unblock, and manage visitor fingerprints.
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  getVisitors,
  getVisitorByFingerprint,
  blockVisitor,
  unblockVisitor,
  updateVisitorTrustScore,
  addVisitorTags,
  addVisitorNote,
} from "@/lib/fingerprint";
import type { TrustLevel } from "@/lib/trust-score";

/**
 * GET - List visitors with filters
 */
export async function GET(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);
    const offset = parseInt(searchParams.get("offset") || "0", 10);
    const isBlocked = searchParams.get("isBlocked");
    const trustLevel = searchParams.get("trustLevel") as TrustLevel | null;
    const hasLinkedUser = searchParams.get("hasLinkedUser");
    const sortBy = (searchParams.get("sortBy") || "last_seen") as
      | "last_seen"
      | "trust_score"
      | "total_requests"
      | "bot_requests";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";

    const { visitors, total } = await getVisitors({
      limit,
      offset,
      isBlocked: isBlocked !== null ? isBlocked === "true" : undefined,
      trustLevel: trustLevel || undefined,
      hasLinkedUser: hasLinkedUser !== null ? hasLinkedUser === "true" : undefined,
      sortBy,
      sortOrder,
    });

    return NextResponse.json({
      success: true,
      visitors,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + visitors.length < total,
      },
    });
  } catch (error) {
    console.error("[Visitors GET Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get visitors" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update visitor (block, unblock, add tags, notes)
 */
export async function PATCH(request: NextRequest) {
  try {
    // Check authentication - admin only
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden - Admin only" }, { status: 403 });
    }

    const body = await request.json();
    const { visitorId, action, reason, tags, note } = body as {
      visitorId: string;
      action: "block" | "unblock" | "add_tags" | "add_note" | "recalculate_trust";
      reason?: string;
      tags?: string[];
      note?: string;
    };

    if (!visitorId || !action) {
      return NextResponse.json(
        { error: "visitorId and action are required" },
        { status: 400 }
      );
    }

    // Verify visitor exists
    const visitor = await getVisitorByFingerprint(visitorId);
    if (!visitor) {
      return NextResponse.json({ error: "Visitor not found" }, { status: 404 });
    }

    switch (action) {
      case "block":
        if (!reason) {
          return NextResponse.json(
            { error: "Reason is required for blocking" },
            { status: 400 }
          );
        }
        await blockVisitor(visitorId, reason, session.user.id);
        return NextResponse.json({
          success: true,
          message: "Visitor blocked",
          visitorId,
        });

      case "unblock":
        await unblockVisitor(visitorId);
        return NextResponse.json({
          success: true,
          message: "Visitor unblocked",
          visitorId,
        });

      case "add_tags":
        if (!tags || !Array.isArray(tags) || tags.length === 0) {
          return NextResponse.json(
            { error: "Tags array is required" },
            { status: 400 }
          );
        }
        await addVisitorTags(visitorId, tags);
        return NextResponse.json({
          success: true,
          message: "Tags added",
          visitorId,
          tags,
        });

      case "add_note":
        if (!note) {
          return NextResponse.json(
            { error: "Note is required" },
            { status: 400 }
          );
        }
        await addVisitorNote(visitorId, note);
        return NextResponse.json({
          success: true,
          message: "Note added",
          visitorId,
        });

      case "recalculate_trust":
        const trustResult = await updateVisitorTrustScore(visitorId);
        return NextResponse.json({
          success: true,
          message: "Trust score recalculated",
          visitorId,
          trustScore: trustResult?.score,
          trustLevel: trustResult?.level,
          factors: trustResult?.factors,
        });

      default:
        return NextResponse.json(
          { error: "Invalid action" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("[Visitors PATCH Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update visitor" },
      { status: 500 }
    );
  }
}
