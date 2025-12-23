/**
 * Setup AI Assistant Avatar
 *
 * One-time admin endpoint to upload the website icon as the AI assistant's
 * profile avatar to Supabase storage and update the database.
 *
 * This mimics how a regular user would upload their profile photo.
 */

import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { pool } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hasMinRole, ROLES, type UserRole } from "@/lib/roles";
import * as fs from "fs";
import * as path from "path";

const AI_ASSISTANT_USER_ID = "ai-assistant-claudeinsider";
const AVATAR_BUCKET = "avatars";

export async function POST(_request: NextRequest) {
  try {
    // Verify admin authentication
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check admin role
    const roleResult = await pool.query(
      `SELECT role FROM "user" WHERE id = $1`,
      [session.user.id]
    );
    const userRole = (roleResult.rows[0]?.role as UserRole) || "user";
    if (!hasMinRole(userRole, ROLES.ADMIN)) {
      return NextResponse.json({ error: "Admin access required" }, { status: 403 });
    }

    // Read the icon file
    const iconPath = path.join(process.cwd(), "public", "icons", "icon-512x512.png");

    if (!fs.existsSync(iconPath)) {
      return NextResponse.json(
        { error: "Icon file not found at public/icons/icon-512x512.png" },
        { status: 404 }
      );
    }

    const iconBuffer = fs.readFileSync(iconPath);
    const iconBlob = new Blob([iconBuffer], { type: "image/png" });

    // Upload to Supabase Storage (same pattern as user avatar upload)
    const supabase = await createAdminClient();
    const timestamp = Date.now();
    const storagePath = `${AI_ASSISTANT_USER_ID}/${timestamp}.png`;

    // Delete any existing avatars for AI assistant
    const { data: existingFiles } = await supabase.storage
      .from(AVATAR_BUCKET)
      .list(AI_ASSISTANT_USER_ID);

    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map((f: { name: string }) => `${AI_ASSISTANT_USER_ID}/${f.name}`);
      await supabase.storage.from(AVATAR_BUCKET).remove(filesToDelete);
    }

    // Upload new avatar
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(storagePath, iconBlob, {
        cacheControl: "31536000", // 1 year cache
        contentType: "image/png",
        upsert: false,
      });

    if (uploadError) {
      console.error("[AI Avatar] Upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    // Generate signed URL (1 year expiry, same as regular user avatars)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(storagePath, 60 * 60 * 24 * 365); // 1 year

    if (signedError || !signedData) {
      console.error("[AI Avatar] Signed URL error:", signedError);
      return NextResponse.json(
        { error: "Failed to generate signed URL" },
        { status: 500 }
      );
    }

    const avatarUrl = signedData.signedUrl;

    // Update the user table (where Better Auth stores avatarUrl)
    await pool.query(
      `UPDATE "user" SET "avatarUrl" = $1, "updatedAt" = NOW() WHERE id = $2`,
      [avatarUrl, AI_ASSISTANT_USER_ID]
    );

    // Also update the profiles table (where messaging system looks)
    await pool.query(
      `UPDATE profiles SET avatar_url = $1, updated_at = NOW() WHERE user_id = $2`,
      [avatarUrl, AI_ASSISTANT_USER_ID]
    );

    return NextResponse.json({
      success: true,
      message: "AI assistant avatar uploaded and profile updated",
      avatarUrl,
      storagePath,
    });
  } catch (error) {
    console.error("[AI Avatar Setup] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Setup failed" },
      { status: 500 }
    );
  }
}

// GET method to check current avatar status
export async function GET() {
  try {
    // Get current avatar URLs from both tables
    const userResult = await pool.query(
      `SELECT id, name, "avatarUrl" FROM "user" WHERE id = $1`,
      [AI_ASSISTANT_USER_ID]
    );

    const profileResult = await pool.query(
      `SELECT user_id, display_name, avatar_url FROM profiles WHERE user_id = $1`,
      [AI_ASSISTANT_USER_ID]
    );

    return NextResponse.json({
      user: userResult.rows[0] || null,
      profile: profileResult.rows[0] || null,
    });
  } catch (error) {
    console.error("[AI Avatar Status] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Check failed" },
      { status: 500 }
    );
  }
}
