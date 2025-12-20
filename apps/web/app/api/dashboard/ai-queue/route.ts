/**
 * AI Operation Queue API
 *
 * Manages the queue of AI operations for Claude Code CLI.
 * - GET: List queued operations (optionally filtered by target)
 * - POST: Queue a new operation
 *
 * Requires moderator or admin role.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

// Valid operation types
const VALID_OPERATIONS = [
  'analyze_relationships',
  'enhance_resource',
  'rewrite_doc',
  'bulk_analyze',
  'bulk_enhance',
] as const;

// Valid target types
const VALID_TARGETS = ['documentation', 'resource', 'all'] as const;

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse query params
    const { searchParams } = new URL(request.url);
    const targetType = searchParams.get('target_type');
    const targetId = searchParams.get('target_id');
    const status = searchParams.get('status') || 'pending';

    // Build query
    let query = `
      SELECT id, operation_type, target_type, target_id, priority, status,
             requested_at, started_at, completed_at, cli_command, notes
      FROM ai_operation_queue
      WHERE 1=1
    `;
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status && status !== 'all') {
      query += ` AND status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (targetType) {
      query += ` AND target_type = $${paramIndex}`;
      params.push(targetType);
      paramIndex++;
    }

    if (targetId) {
      query += ` AND target_id = $${paramIndex}`;
      params.push(targetId);
      paramIndex++;
    }

    query += ` ORDER BY priority DESC, requested_at ASC LIMIT 100`;

    const result = await pool.query(query, params);

    return NextResponse.json({ operations: result.rows });
  } catch (error) {
    console.error("[AI Queue GET Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get queue" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role from database
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.MODERATOR)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Parse body
    const body = await request.json();
    const { operation_type, target_type, target_id, priority = 0, notes } = body;

    // Validate
    if (!operation_type || !VALID_OPERATIONS.includes(operation_type)) {
      return NextResponse.json(
        { error: `Invalid operation_type. Must be one of: ${VALID_OPERATIONS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!target_type || !VALID_TARGETS.includes(target_type)) {
      return NextResponse.json(
        { error: `Invalid target_type. Must be one of: ${VALID_TARGETS.join(', ')}` },
        { status: 400 }
      );
    }

    if (!target_id) {
      return NextResponse.json({ error: "target_id is required" }, { status: 400 });
    }

    // Use the database function to queue the operation
    const result = await pool.query(
      `SELECT queue_ai_operation($1, $2, $3, $4, $5, $6) as id`,
      [operation_type, target_type, target_id, session.user.id, priority, notes]
    );

    const operationId = result.rows[0]?.id;

    // Get the full operation record to return
    const opResult = await pool.query(
      `SELECT id, operation_type, target_type, target_id, status, cli_command
       FROM ai_operation_queue WHERE id = $1`,
      [operationId]
    );

    return NextResponse.json({
      success: true,
      id: operationId,
      ...opResult.rows[0],
    });
  } catch (error) {
    console.error("[AI Queue POST Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to queue operation" },
      { status: 500 }
    );
  }
}
