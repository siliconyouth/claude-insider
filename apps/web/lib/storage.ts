/**
 * Supabase Storage Utilities
 *
 * Helper functions for managing file uploads to Supabase Storage.
 * Used for avatar uploads, cover photos, and feedback screenshots.
 *
 * NOTE: Uses createAdminClient() to bypass RLS policies because
 * the app uses Better Auth instead of Supabase Auth. Authentication
 * is verified at the API route level before these functions are called.
 */

import { createAdminClient } from "@/lib/supabase/server";

// Avatar configuration
const AVATAR_BUCKET = "avatars";
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

// Cover photo configuration
const COVER_PHOTO_BUCKET = "covers";
const MAX_COVER_PHOTO_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_COVER_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface UploadResult {
  success: boolean;
  url?: string;
  path?: string;
  error?: string;
}

/**
 * Upload an avatar image to Supabase Storage
 *
 * @param userId - The user's ID (used in file path)
 * @param file - The image file to upload
 * @returns Upload result with signed URL
 */
export async function uploadAvatar(userId: string, file: File): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_AVATAR_SIZE) {
    return {
      success: false,
      error: `File size must be less than ${MAX_AVATAR_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validate file type
  if (!ALLOWED_AVATAR_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "File must be JPEG, PNG, WebP, or GIF",
    };
  }

  try {
    const supabase = await createAdminClient();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false, // Don't overwrite existing files
      });

    if (uploadError) {
      console.error("[Storage] Avatar upload error:", uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Generate signed URL (1 year expiry)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(AVATAR_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    if (signedError || !signedData) {
      console.error("[Storage] Signed URL error:", signedError);
      return {
        success: false,
        error: "Failed to generate URL",
      };
    }

    return {
      success: true,
      url: signedData.signedUrl,
      path,
    };
  } catch (error) {
    console.error("[Storage] Upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete an avatar from Supabase Storage
 *
 * @param path - The file path in the bucket
 * @returns Success status
 */
export async function deleteAvatar(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.storage.from(AVATAR_BUCKET).remove([path]);

    if (error) {
      console.error("[Storage] Delete error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Storage] Delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * Get public URL for an avatar
 *
 * @param path - The file path in the bucket
 * @returns Public URL
 */
export async function getAvatarPublicUrl(path: string): Promise<string | null> {
  try {
    const supabase = await createAdminClient();

    const { data } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path);

    return data?.publicUrl || null;
  } catch (error) {
    console.error("[Storage] Get URL error:", error);
    return null;
  }
}

/**
 * List all avatars for a user
 *
 * @param userId - The user's ID
 * @returns Array of file paths
 */
export async function listUserAvatars(userId: string): Promise<string[]> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase.storage.from(AVATAR_BUCKET).list(userId);

    if (error) {
      console.error("[Storage] List error:", error);
      return [];
    }

    return data?.map((file) => `${userId}/${file.name}`) || [];
  } catch (error) {
    console.error("[Storage] List error:", error);
    return [];
  }
}

/**
 * Delete all avatars for a user except the current one
 *
 * @param userId - The user's ID
 * @param keepPath - Path to keep (current avatar)
 */
export async function cleanupOldAvatars(userId: string, keepPath: string): Promise<void> {
  try {
    const avatars = await listUserAvatars(userId);
    const toDelete = avatars.filter((path) => path !== keepPath);

    if (toDelete.length > 0) {
      const supabase = await createAdminClient();
      await supabase.storage.from(AVATAR_BUCKET).remove(toDelete);
    }
  } catch (error) {
    console.error("[Storage] Cleanup error:", error);
  }
}

/**
 * Upload a feedback screenshot
 *
 * @param userId - The user's ID
 * @param feedbackId - The feedback ID
 * @param file - The screenshot file
 * @returns Upload result with URL
 */
export async function uploadFeedbackScreenshot(
  userId: string,
  feedbackId: string,
  file: File
): Promise<UploadResult> {
  const FEEDBACK_BUCKET = "feedback-screenshots";

  if (file.size > MAX_AVATAR_SIZE) {
    return {
      success: false,
      error: "Screenshot must be less than 2MB",
    };
  }

  try {
    const supabase = await createAdminClient();

    const ext = file.name.split(".").pop() || "png";
    const path = `${userId}/${feedbackId}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from(FEEDBACK_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      return {
        success: false,
        error: uploadError.message,
      };
    }

    const { data: signedData } = await supabase.storage
      .from(FEEDBACK_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 30); // 30 days

    return {
      success: true,
      url: signedData?.signedUrl,
      path,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// =============================================================================
// Cover Photo Functions
// =============================================================================

/**
 * Upload a cover photo to Supabase Storage
 *
 * @param userId - The user's ID (used in file path)
 * @param file - The image file to upload (should be pre-cropped to 3:1 aspect ratio)
 * @returns Upload result with signed URL
 */
export async function uploadCoverPhoto(userId: string, file: File): Promise<UploadResult> {
  // Validate file size
  if (file.size > MAX_COVER_PHOTO_SIZE) {
    return {
      success: false,
      error: `File size must be less than ${MAX_COVER_PHOTO_SIZE / 1024 / 1024}MB`,
    };
  }

  // Validate file type
  if (!ALLOWED_COVER_PHOTO_TYPES.includes(file.type)) {
    return {
      success: false,
      error: "File must be JPEG, PNG, or WebP",
    };
  }

  try {
    const supabase = await createAdminClient();

    // Generate unique filename
    const ext = file.name.split(".").pop() || "jpg";
    const timestamp = Date.now();
    const path = `${userId}/${timestamp}.${ext}`;

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(COVER_PHOTO_BUCKET)
      .upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("[Storage] Cover photo upload error:", uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    // Generate signed URL (1 year expiry)
    const { data: signedData, error: signedError } = await supabase.storage
      .from(COVER_PHOTO_BUCKET)
      .createSignedUrl(path, 60 * 60 * 24 * 365); // 1 year

    if (signedError || !signedData) {
      console.error("[Storage] Cover photo signed URL error:", signedError);
      return {
        success: false,
        error: "Failed to generate URL",
      };
    }

    return {
      success: true,
      url: signedData.signedUrl,
      path,
    };
  } catch (error) {
    console.error("[Storage] Cover photo upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

/**
 * Delete a cover photo from Supabase Storage
 *
 * @param path - The file path in the bucket
 * @returns Success status
 */
export async function deleteCoverPhoto(path: string): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createAdminClient();

    const { error } = await supabase.storage.from(COVER_PHOTO_BUCKET).remove([path]);

    if (error) {
      console.error("[Storage] Cover photo delete error:", error);
      return {
        success: false,
        error: error.message,
      };
    }

    return { success: true };
  } catch (error) {
    console.error("[Storage] Cover photo delete error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Delete failed",
    };
  }
}

/**
 * List all cover photos for a user (for cleanup)
 *
 * @param userId - The user's ID
 * @returns Array of file paths
 */
export async function listUserCoverPhotos(userId: string): Promise<string[]> {
  try {
    const supabase = await createAdminClient();

    const { data, error } = await supabase.storage.from(COVER_PHOTO_BUCKET).list(userId);

    if (error) {
      console.error("[Storage] Cover photo list error:", error);
      return [];
    }

    return data?.map((file) => `${userId}/${file.name}`) || [];
  } catch (error) {
    console.error("[Storage] Cover photo list error:", error);
    return [];
  }
}

/**
 * Delete all cover photos for a user except the current one
 *
 * @param userId - The user's ID
 * @param keepPath - Path to keep (current cover photo)
 */
export async function cleanupOldCoverPhotos(userId: string, keepPath: string): Promise<void> {
  try {
    const coverPhotos = await listUserCoverPhotos(userId);
    const toDelete = coverPhotos.filter((path) => path !== keepPath);

    if (toDelete.length > 0) {
      const supabase = await createAdminClient();
      await supabase.storage.from(COVER_PHOTO_BUCKET).remove(toDelete);
    }
  } catch (error) {
    console.error("[Storage] Cover photo cleanup error:", error);
  }
}
