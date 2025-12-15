/**
 * Dashboard User Detail API
 *
 * Get and update individual user (admin only).
 * Uses Supabase admin client for reliable read access.
 */

import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
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
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get role directly from database (session cookie cache may be stale)
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Use Supabase admin client for reliable access
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = (await createAdminClient()) as any;

    // Fetch user
    const { data: userData, error: userError } = await supabase
      .from("user")
      .select("id, name, email, username, image, role, isBetaTester, emailVerified, banned, banReason, bannedAt, createdAt, bio, socialLinks, hasPassword")
      .eq("id", id)
      .single();

    if (userError || !userData) {
      console.error("[Dashboard User Detail] Error:", userError);
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Fetch feedback count
    const { count: feedbackCount } = await supabase
      .from("feedback")
      .select("*", { count: "exact", head: true })
      .eq("user_id", id);

    // Fetch provider from account
    const { data: accountData } = await supabase
      .from("account")
      .select("providerId")
      .eq("userId", id)
      .limit(1)
      .single();

    // Fetch beta application if exists
    const { data: betaData } = await supabase
      .from("beta_applications")
      .select("id, status, motivation, experience_level, use_case, created_at, reviewed_at, review_notes")
      .eq("user_id", id)
      .single();

    const betaApplication = betaData ? {
      id: betaData.id,
      status: betaData.status,
      motivation: betaData.motivation,
      experienceLevel: betaData.experience_level,
      useCase: betaData.use_case,
      submittedAt: betaData.created_at,
      reviewedAt: betaData.reviewed_at,
      reviewNotes: betaData.review_notes,
    } : undefined;

    return NextResponse.json({
      id: userData.id,
      name: userData.name,
      email: userData.email,
      username: userData.username,
      image: userData.image,
      role: userData.role || "user",
      isBetaTester: userData.isBetaTester || false,
      emailVerified: userData.emailVerified || false,
      banned: userData.banned || false,
      banReason: userData.banReason,
      bannedAt: userData.bannedAt,
      createdAt: userData.createdAt || new Date().toISOString(),
      bio: userData.bio,
      socialLinks: userData.socialLinks,
      hasPassword: userData.hasPassword || false,
      provider: accountData?.providerId,
      feedbackCount: feedbackCount || 0,
      suggestionsCount: 0,
      commentsCount: 0,
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

    // Get role directly from database (session cookie cache may be stale)
    const adminRoleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const adminRole = (adminRoleResult.rows[0]?.role as UserRole) || "user";
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

    // Get role directly from database (session cookie cache may be stale)
    const adminRoleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const adminRole = (adminRoleResult.rows[0]?.role as UserRole) || "user";
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
