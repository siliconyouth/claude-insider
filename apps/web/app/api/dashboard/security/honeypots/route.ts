/**
 * Honeypot Configuration API
 *
 * CRUD operations for honeypot configurations.
 * Admin only endpoint.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { pool } from "@/lib/db";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import {
  getEnabledHoneypots,
  getHoneypotById,
  createHoneypot,
  updateHoneypot,
  deleteHoneypot,
  type HoneypotResponseType,
} from "@/lib/honeypot";

/**
 * GET - List all honeypot configurations
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

    // Get specific honeypot by ID if provided
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (id) {
      const honeypot = await getHoneypotById(id);
      if (!honeypot) {
        return NextResponse.json({ error: "Honeypot not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, honeypot });
    }

    // Get all honeypots (including disabled ones for admin)
    const result = await pool.query(
      `SELECT * FROM honeypot_configs ORDER BY priority ASC, created_at DESC`
    );

    const honeypots = result.rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      pathPattern: row.path_pattern,
      method: row.method,
      priority: row.priority,
      responseType: row.response_type,
      responseDelayMs: row.response_delay_ms,
      responseData: row.response_data,
      responseTemplate: row.response_template,
      redirectUrl: row.redirect_url,
      statusCode: row.status_code,
      targetBotsOnly: row.target_bots_only,
      targetLowTrust: row.target_low_trust,
      trustThreshold: parseFloat(row.trust_threshold),
      targetBlockedVisitors: row.target_blocked_visitors,
      triggerCount: row.trigger_count,
      lastTriggeredAt: row.last_triggered_at,
      uniqueVisitorsTriggered: row.unique_visitors_triggered,
      enabled: row.enabled,
      createdBy: row.created_by,
      updatedBy: row.updated_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    }));

    return NextResponse.json({
      success: true,
      honeypots,
      total: honeypots.length,
    });
  } catch (error) {
    console.error("[Honeypots GET Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get honeypots" },
      { status: 500 }
    );
  }
}

/**
 * POST - Create a new honeypot configuration
 */
export async function POST(request: NextRequest) {
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
    const {
      name,
      description,
      pathPattern,
      method = "ALL",
      priority = 100,
      responseType,
      responseDelayMs = 0,
      responseData,
      responseTemplate,
      redirectUrl,
      statusCode = 200,
      targetBotsOnly = true,
      targetLowTrust = false,
      trustThreshold = 30,
      targetBlockedVisitors = true,
      enabled = true,
    } = body;

    // Validation
    if (!name || !pathPattern || !responseType) {
      return NextResponse.json(
        { error: "name, pathPattern, and responseType are required" },
        { status: 400 }
      );
    }

    const validResponseTypes: HoneypotResponseType[] = [
      "fake_data",
      "delay",
      "redirect",
      "block",
      "template",
    ];
    if (!validResponseTypes.includes(responseType)) {
      return NextResponse.json(
        { error: `Invalid responseType. Must be one of: ${validResponseTypes.join(", ")}` },
        { status: 400 }
      );
    }

    if (responseType === "redirect" && !redirectUrl) {
      return NextResponse.json(
        { error: "redirectUrl is required for redirect response type" },
        { status: 400 }
      );
    }

    const honeypot = await createHoneypot({
      name,
      description,
      pathPattern,
      method,
      priority,
      responseType,
      responseDelayMs,
      responseData,
      responseTemplate,
      redirectUrl,
      statusCode,
      targetBotsOnly,
      targetLowTrust,
      trustThreshold,
      targetBlockedVisitors,
      enabled,
      createdBy: session.user.id,
      updatedBy: null,
    });

    return NextResponse.json({
      success: true,
      honeypot,
    });
  } catch (error) {
    console.error("[Honeypots POST Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create honeypot" },
      { status: 500 }
    );
  }
}

/**
 * PATCH - Update a honeypot configuration
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
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify honeypot exists
    const existing = await getHoneypotById(id);
    if (!existing) {
      return NextResponse.json({ error: "Honeypot not found" }, { status: 404 });
    }

    // Add updatedBy
    updates.updatedBy = session.user.id;

    const honeypot = await updateHoneypot(id, updates);

    return NextResponse.json({
      success: true,
      honeypot,
    });
  } catch (error) {
    console.error("[Honeypots PATCH Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update honeypot" },
      { status: 500 }
    );
  }
}

/**
 * DELETE - Delete a honeypot configuration
 */
export async function DELETE(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    // Verify honeypot exists
    const existing = await getHoneypotById(id);
    if (!existing) {
      return NextResponse.json({ error: "Honeypot not found" }, { status: 404 });
    }

    await deleteHoneypot(id);

    return NextResponse.json({
      success: true,
      message: "Honeypot deleted",
      id,
    });
  } catch (error) {
    console.error("[Honeypots DELETE Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete honeypot" },
      { status: 500 }
    );
  }
}
