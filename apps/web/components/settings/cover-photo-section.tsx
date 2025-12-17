"use client";

/**
 * Cover Photo Settings Section
 *
 * A section in the settings page for managing cover photos.
 * Shows current cover or default gradient, with options to upload or remove.
 */

import { useState, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { DefaultCover } from "@/components/profile";
import { CoverPhotoCropper } from "./cover-photo-cropper";
import { useToast } from "@/components/toast";

interface CoverPhotoSectionProps {
  /** Current cover photo URL */
  currentCoverUrl?: string | null;
  /** User's avatar URL (for preview in cropper) */
  avatarUrl?: string | null;
  /** User's name (for preview in cropper) */
  userName?: string;
  /** Callback when cover photo changes */
  onCoverPhotoChange?: (url: string | null) => void;
}

export function CoverPhotoSection({
  currentCoverUrl,
  avatarUrl,
  userName = "User",
  onCoverPhotoChange,
}: CoverPhotoSectionProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(currentCoverUrl || null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const toast = useToast();

  const handleUploadComplete = useCallback(
    (url: string) => {
      setCoverUrl(url);
      onCoverPhotoChange?.(url);
      toast.success("Cover photo updated");
    },
    [onCoverPhotoChange, toast]
  );

  const handleRemoveCover = async () => {
    if (!coverUrl) return;

    setIsDeleting(true);
    try {
      const response = await fetch("/api/user/cover-photo", {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to remove cover photo");
      }

      setCoverUrl(null);
      onCoverPhotoChange?.(null);
      toast.success("Cover photo removed");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to remove cover photo");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <section id="cover-photo" className="scroll-mt-24">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
        Cover Photo
      </h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Customize the banner at the top of your profile. The recommended size is 1500 x 500 pixels (3:1 aspect ratio).
      </p>

      {/* Current Cover Preview */}
      <div className="mb-4">
        <div
          className={cn(
            "relative rounded-xl overflow-hidden",
            "border border-gray-200 dark:border-[#262626]",
            "aspect-[3/1]"
          )}
        >
          {coverUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={coverUrl}
              alt="Current cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <DefaultCover className="w-full h-full" />
          )}

          {/* Avatar overlay for context */}
          <div className="absolute bottom-2 left-4 flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-[#111111] ring-2 ring-white dark:ring-[#111111] shadow-lg overflow-hidden">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold text-sm">
                  {userName[0]?.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => setIsCropperOpen(true)}
          className={cn(
            "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg",
            "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
            "text-white shadow-lg shadow-blue-500/25",
            "hover:shadow-xl hover:-translate-y-0.5",
            "transition-all duration-200"
          )}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
          {coverUrl ? "Change Cover" : "Upload Cover Photo"}
        </button>

        {coverUrl && (
          <button
            onClick={handleRemoveCover}
            disabled={isDeleting}
            className={cn(
              "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg",
              "border border-gray-200 dark:border-[#262626]",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors disabled:opacity-50"
            )}
          >
            {isDeleting ? (
              <>
                <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Removing...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
                Remove Cover
              </>
            )}
          </button>
        )}
      </div>

      {/* Tip */}
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">
        <strong>Tip:</strong> You can also click directly on your cover photo on your profile page to edit it.
      </p>

      {/* Cropper Modal */}
      <CoverPhotoCropper
        isOpen={isCropperOpen}
        onClose={() => setIsCropperOpen(false)}
        onUploadComplete={handleUploadComplete}
        currentCoverUrl={coverUrl}
        avatarUrl={avatarUrl}
        userName={userName}
      />
    </section>
  );
}
