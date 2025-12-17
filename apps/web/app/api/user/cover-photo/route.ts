/**
 * Cover Photo Upload API
 *
 * Handles cover photo upload and deletion for user profiles.
 * Uses Supabase Storage for file storage with signed URLs.
 *
 * POST: Upload new cover photo (multipart/form-data with pre-cropped image)
 * DELETE: Remove current cover photo (revert to default gradient)
 */

import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { uploadCoverPhoto, deleteCoverPhoto, cleanupOldCoverPhotos } from "@/lib/storage";
import { pool } from "@/lib/db";

/**
 * Upload a new cover photo
 *
 * Expects a pre-cropped image (3:1 aspect ratio, ideally 1500x500px)
 * from the client-side cropping tool.
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
    const file = formData.get("coverPhoto") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Upload to Supabase Storage
    const result = await uploadCoverPhoto(session.user.id, file);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    // Update user's cover photo fields in database
    await pool.query(
      `UPDATE "user"
       SET "coverPhotoUrl" = $1, "coverPhotoPath" = $2, "updatedAt" = NOW()
       WHERE id = $3`,
      [result.url, result.path, session.user.id]
    );

    // Clean up old cover photos (keep only the new one)
    if (result.path) {
      await cleanupOldCoverPhotos(session.user.id, result.path);
    }

    return NextResponse.json({
      success: true,
      url: result.url,
      path: result.path,
    });
  } catch (error) {
    console.error("[Cover Photo Upload Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to upload cover photo" },
      { status: 500 }
    );
  }
}

/**
 * Delete current cover photo
 *
 * Removes the cover photo and reverts to the default animated gradient.
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const session = await getSession();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get current cover photo path from database
    const { rows } = await pool.query(
      `SELECT "coverPhotoPath" FROM "user" WHERE id = $1`,
      [session.user.id]
    );

    const coverPhotoPath = rows[0]?.coverPhotoPath;

    // Delete file from storage if exists
    if (coverPhotoPath) {
      const result = await deleteCoverPhoto(coverPhotoPath);
      if (!result.success) {
        console.warn("[Cover Photo Delete] Failed to delete file:", result.error);
        // Continue anyway - we still want to clear the database fields
      }
    }

    // Clear cover photo fields in database
    await pool.query(
      `UPDATE "user"
       SET "coverPhotoUrl" = NULL, "coverPhotoPath" = NULL, "updatedAt" = NOW()
       WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Cover Photo Delete Error]:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete cover photo" },
      { status: 500 }
    );
  }
}
