/**
 * Prompt Versions API
 *
 * GET: List versions for a prompt
 * POST: Create a new version or restore an old version
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/prompts/[id]/versions
 * List all versions for a prompt
 */
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Check if prompt exists and is viewable
    const promptCheck = await pool.query(
      `SELECT id, visibility, author_id, is_system FROM prompts WHERE id = $1`,
      [id]
    );

    if (promptCheck.rows.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const prompt = promptCheck.rows[0];
    const session = await getSession();
    const userId = session?.user?.id;

    // Check visibility
    const canView =
      prompt.visibility === "public" ||
      prompt.visibility === "unlisted" ||
      prompt.is_system ||
      prompt.author_id === userId;

    if (!canView && !userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!canView) {
      // Check if admin
      const roleResult = await pool.query(
        'SELECT role FROM "user" WHERE id = $1',
        [userId]
      );
      const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
      if (!hasMinRole(userRole, ROLES.ADMIN)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    // Fetch versions
    const result = await pool.query(
      `SELECT
        v.id,
        v.version_number,
        v.content,
        v.variables,
        v.change_summary,
        v.created_at,
        v.created_by,
        u.name as creator_name,
        u.image as creator_image
      FROM prompt_versions v
      LEFT JOIN "user" u ON u.id = v.created_by
      WHERE v.prompt_id = $1
      ORDER BY v.version_number DESC`,
      [id]
    );

    const versions = result.rows.map((row) => ({
      id: row.id,
      versionNumber: row.version_number,
      content: row.content,
      variables: row.variables || [],
      changeSummary: row.change_summary,
      createdAt: row.created_at,
      createdBy: row.created_by
        ? {
            id: row.created_by,
            name: row.creator_name,
            image: row.creator_image,
          }
        : null,
    }));

    return NextResponse.json({ versions });
  } catch (error) {
    console.error("Error fetching versions:", error);
    return NextResponse.json(
      { error: "Failed to fetch versions" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/prompts/[id]/versions
 * Create a new version or restore an old version
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { id } = await context.params;
    const body = await request.json();

    // Check prompt ownership or admin status
    const promptCheck = await pool.query(
      `SELECT id, author_id, content, variables, current_version, is_system
       FROM prompts WHERE id = $1`,
      [id]
    );

    if (promptCheck.rows.length === 0) {
      return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
    }

    const prompt = promptCheck.rows[0];
    const isOwner = prompt.author_id === userId;

    // Check admin role if not owner
    let canEdit = isOwner;
    if (!canEdit) {
      const roleResult = await pool.query(
        'SELECT role FROM "user" WHERE id = $1',
        [userId]
      );
      const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
      canEdit = hasMinRole(userRole, ROLES.ADMIN);
    }

    if (!canEdit) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Handle restore action
    if (body.action === "restore" && body.versionId) {
      // Fetch the version to restore
      const versionResult = await pool.query(
        `SELECT content, variables FROM prompt_versions WHERE id = $1 AND prompt_id = $2`,
        [body.versionId, id]
      );

      if (versionResult.rows.length === 0) {
        return NextResponse.json(
          { error: "Version not found" },
          { status: 404 }
        );
      }

      const versionToRestore = versionResult.rows[0];

      // Save current state as a new version first
      const currentVersion = prompt.current_version || 0;
      const newVersionNumber = currentVersion + 1;

      await pool.query(
        `INSERT INTO prompt_versions (
          prompt_id, version_number, content, variables, change_summary, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          newVersionNumber,
          prompt.content,
          JSON.stringify(prompt.variables || []),
          `Saved before restoring to previous version`,
          userId,
        ]
      );

      // Update prompt with restored content
      await pool.query(
        `UPDATE prompts
         SET content = $1,
             variables = $2,
             current_version = $3,
             updated_at = NOW()
         WHERE id = $4`,
        [
          versionToRestore.content,
          JSON.stringify(versionToRestore.variables || []),
          newVersionNumber + 1,
          id,
        ]
      );

      // Create another version entry for the restore
      await pool.query(
        `INSERT INTO prompt_versions (
          prompt_id, version_number, content, variables, change_summary, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          newVersionNumber + 1,
          versionToRestore.content,
          JSON.stringify(versionToRestore.variables || []),
          `Restored from version ${body.versionId}`,
          userId,
        ]
      );

      return NextResponse.json({
        success: true,
        action: "restored",
        newVersion: newVersionNumber + 1,
      });
    }

    // Handle create new version (save current before edit)
    if (body.action === "save" || body.content) {
      const currentVersion = prompt.current_version || 0;
      const newVersionNumber = currentVersion + 1;

      // Save current state as a version
      await pool.query(
        `INSERT INTO prompt_versions (
          prompt_id, version_number, content, variables, change_summary, created_by
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          id,
          newVersionNumber,
          prompt.content,
          JSON.stringify(prompt.variables || []),
          body.changeSummary || "Manual save",
          userId,
        ]
      );

      // Update prompt version counter
      await pool.query(
        `UPDATE prompts SET current_version = $1, updated_at = NOW() WHERE id = $2`,
        [newVersionNumber, id]
      );

      return NextResponse.json({
        success: true,
        action: "saved",
        versionNumber: newVersionNumber,
      });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error managing version:", error);
    return NextResponse.json(
      { error: "Failed to manage version" },
      { status: 500 }
    );
  }
}
