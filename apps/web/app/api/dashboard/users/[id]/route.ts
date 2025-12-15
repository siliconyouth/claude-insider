/**
 * Dashboard User Detail API
 *
 * Get and update individual user (admin only).
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, canManageRole, ROLES, isValidRole, type UserRole } from "@/lib/roles";
import type { UpdateUserRequest } from "@/types/admin";

/**
 * Get a single user's details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - admin only
    const userRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const result = await pool.query(
      `
      SELECT
        u.id,
        u.name,
        u.email,
        u.username,
        u.image,
        u.role,
        u."isBetaTester",
        u."emailVerified",
        u.banned,
        u."banReason",
        u."bannedAt",
        u.created_at,
        u.bio,
        u."socialLinks",
        u."hasPassword",
        (SELECT COUNT(*) FROM feedback WHERE user_id = u.id) as feedback_count,
        (SELECT provider FROM account WHERE "userId" = u.id LIMIT 1) as provider
      FROM "user" u
      WHERE u.id = $1
    `,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const row = result.rows[0];

    // Get beta application if exists
    const betaResult = await pool.query(
      `SELECT id, status, motivation, experience_level, use_case, created_at, reviewed_at, review_notes
       FROM beta_applications WHERE user_id = $1`,
      [id]
    );

    const betaApplication = betaResult.rows.length > 0 ? {
      id: betaResult.rows[0].id,
      status: betaResult.rows[0].status,
      motivation: betaResult.rows[0].motivation,
      experienceLevel: betaResult.rows[0].experience_level,
      useCase: betaResult.rows[0].use_case,
      submittedAt: betaResult.rows[0].created_at?.toISOString(),
      reviewedAt: betaResult.rows[0].reviewed_at?.toISOString(),
      reviewNotes: betaResult.rows[0].review_notes,
    } : undefined;

    return NextResponse.json({
      id: row.id,
      name: row.name,
      email: row.email,
      username: row.username,
      image: row.image,
      role: row.role || "user",
      isBetaTester: row.isBetaTester || false,
      emailVerified: row.emailVerified || false,
      banned: row.banned || false,
      banReason: row.banReason,
      bannedAt: row.bannedAt?.toISOString(),
      createdAt: row.created_at.toISOString(),
      bio: row.bio,
      socialLinks: row.socialLinks,
      hasPassword: row.hasPassword || false,
      provider: row.provider,
      feedbackCount: parseInt(row.feedback_count) || 0,
      suggestionsCount: 0, // Will be implemented later
      commentsCount: 0, // Will be implemented later
      betaApplication,
    });
  } catch (error) {
    console.error("[Dashboard User Get Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to get user" },
      { status: 500 }
    );
  }
}

/**
 * Update user (role, ban status)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - admin only
    const adminRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(adminRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot modify yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot modify your own account" },
        { status: 400 }
      );
    }

    const body: UpdateUserRequest = await request.json();

    // Get target user's current role
    const targetResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [id]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const targetRole = (targetResult.rows[0].role || "user") as UserRole;

    // Check if admin can manage this user's role
    if (!canManageRole(adminRole, targetRole)) {
      return NextResponse.json(
        { error: "Cannot modify a user with equal or higher role" },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const values: (string | boolean | null)[] = [];
    const details: Record<string, unknown> = {};

    // Handle role change
    if (body.role !== undefined) {
      if (!isValidRole(body.role)) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }

      // Admin can only assign roles lower than their own
      if (!canManageRole(adminRole, body.role)) {
        return NextResponse.json(
          { error: "Cannot assign a role equal to or higher than your own" },
          { status: 403 }
        );
      }

      values.push(body.role);
      updates.push(`role = $${values.length}`);
      details.previousRole = targetRole;
      details.newRole = body.role;
    }

    // Handle name change
    if (body.name !== undefined) {
      const name = body.name.trim();
      if (name.length < 1 || name.length > 100) {
        return NextResponse.json({ error: "Name must be 1-100 characters" }, { status: 400 });
      }
      values.push(name);
      updates.push(`name = $${values.length}`);
      details.nameUpdated = true;
    }

    // Handle bio change
    if (body.bio !== undefined) {
      const bio = body.bio.trim() || null;
      if (bio && bio.length > 500) {
        return NextResponse.json({ error: "Bio must be under 500 characters" }, { status: 400 });
      }
      values.push(bio);
      updates.push(`bio = $${values.length}`);
      details.bioUpdated = true;
    }

    // Handle username change
    if (body.username !== undefined) {
      const username = body.username.trim().toLowerCase() || null;
      if (username) {
        if (!/^[a-z0-9_-]{3,30}$/.test(username)) {
          return NextResponse.json(
            { error: "Username must be 3-30 characters, lowercase letters, numbers, hyphens, underscores" },
            { status: 400 }
          );
        }
        // Check uniqueness
        const existing = await pool.query(
          `SELECT id FROM "user" WHERE LOWER(username) = $1 AND id != $2`,
          [username, id]
        );
        if (existing.rows.length > 0) {
          return NextResponse.json({ error: "Username already taken" }, { status: 400 });
        }
      }
      values.push(username);
      updates.push(`username = $${values.length}`);
      details.usernameUpdated = true;
    }

    // Handle beta tester toggle
    if (body.isBetaTester !== undefined) {
      values.push(body.isBetaTester);
      updates.push(`"isBetaTester" = $${values.length}`);
      details.betaTesterStatus = body.isBetaTester ? "added" : "removed";
    }

    // Handle ban/unban
    if (body.isBanned !== undefined) {
      values.push(body.isBanned);
      updates.push(`banned = $${values.length}`);

      if (body.isBanned && body.banReason) {
        values.push(body.banReason);
        updates.push(`"banReason" = $${values.length}`);
        values.push(new Date().toISOString());
        updates.push(`"bannedAt" = $${values.length}`);
      } else if (!body.isBanned) {
        // Clear ban reason when unbanning
        values.push(null as unknown as string);
        updates.push(`"banReason" = $${values.length}`);
        values.push(null as unknown as string);
        updates.push(`"bannedAt" = $${values.length}`);
      }

      details.banStatus = body.isBanned ? "banned" : "unbanned";
      if (body.banReason) details.banReason = body.banReason;
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: "No updates provided" }, { status: 400 });
    }

    // Update user
    values.push(id);
    await pool.query(
      `UPDATE "user" SET ${updates.join(", ")} WHERE id = $${values.length}`,
      values
    );

    // Log the action
    const action = body.role ? "change_role" : "update_user";
    await pool.query(
      `
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, $2, 'user', $3, $4)
    `,
      [session.user.id, action, id, JSON.stringify(details)]
    );

    return NextResponse.json({
      success: true,
      updated: Object.keys(details),
    });
  } catch (error) {
    console.error("[Dashboard User Update Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update user" },
      { status: 500 }
    );
  }
}

/**
 * Delete a user (admin only)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Check authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check role - admin only
    const adminRole = ((session.user as Record<string, unknown>).role as UserRole) || "user";
    if (!hasMinRole(adminRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Cannot delete yourself
    if (id === session.user.id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    // Get target user's info for logging
    const targetResult = await pool.query(
      `SELECT name, email, role FROM "user" WHERE id = $1`,
      [id]
    );

    if (targetResult.rows.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const target = targetResult.rows[0];
    const targetRole = (target.role || "user") as UserRole;

    // Cannot delete users with equal or higher role
    if (!canManageRole(adminRole, targetRole)) {
      return NextResponse.json(
        { error: "Cannot delete a user with equal or higher role" },
        { status: 403 }
      );
    }

    // Delete user (cascade will handle related records)
    await pool.query(`DELETE FROM "user" WHERE id = $1`, [id]);

    // Log the action
    await pool.query(
      `
      INSERT INTO admin_logs (admin_id, action, target_type, target_id, details)
      VALUES ($1, 'delete_user', 'user', $2, $3)
    `,
      [
        session.user.id,
        id,
        JSON.stringify({
          deletedUserName: target.name,
          deletedUserEmail: target.email,
          deletedUserRole: targetRole,
        }),
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Dashboard User Delete Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete user" },
      { status: 500 }
    );
  }
}
