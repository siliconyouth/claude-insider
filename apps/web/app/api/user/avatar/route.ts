/**
 * Avatar Upload API
 *
 * Handles avatar image upload and deletion for user profiles.
 * Uses Supabase Storage for file storage with signed URLs.
 *
 * POST: Upload new avatar (multipart/form-data)
 * DELETE: Remove current avatar
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadAvatar, deleteAvatar, cleanupOldAvatars } from "@/lib/storage";
import { pool } from "@/lib/db";

/**
 * Upload a new avatar image
 */
export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse multipart form data
    const formData = await request.formData();
    const file = formData.get("avatar") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const result = await uploadAvatar(session.user.id, file);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update user's avatarUrl in database
    await pool.query(
      `UPDATE "user" SET "avatarUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [result.url, session.user.id]
    );

    // Clean up old avatars (keep only the new one)
    if (result.path) {
      await cleanupOldAvatars(session.user.id, result.path);
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error("[Avatar Upload Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload avatar" },
      { status: 500 }
    );
  }
}

/**
 * Delete current avatar
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get path from query or body
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (path) {
      // Delete specific avatar file
      const result = await deleteAvatar(path);
      if (!result.success) {
        console.warn("[Avatar Delete] Failed to delete file:", result.error);
      }
    }

    // Clear avatarUrl in database (set to null to fall back to OAuth avatar)
    await pool.query(
      `UPDATE "user" SET "avatarUrl" = NULL, "updatedAt" = NOW() WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Avatar Delete Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete avatar" },
      { status: 500 }
    );
  }
}
