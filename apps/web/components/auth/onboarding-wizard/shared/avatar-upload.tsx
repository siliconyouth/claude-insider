"use client";

/**
 * Avatar Upload
 *
 * Drag-and-drop avatar upload with preview and delete functionality.
 * Shows current avatar (from OAuth or uploaded) with option to change.
 */

import { useState, useRef, useCallback } from "react";
import { cn } from "@/lib/design-system";
import { useWizard } from "../wizard-context";
import { useAuth } from "@/components/providers/auth-provider";

const MAX_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export function AvatarUpload() {
  const { data, updateData } = useWizard();
  const { user } = useAuth();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Upload state for future async upload support
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isUploading, _setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get display avatar: uploaded preview > user avatar > OAuth image > initials
  const displayAvatar = data.avatarPreview || user?.avatarUrl || user?.image;

  const validateFile = useCallback((file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Please upload a JPEG, PNG, WebP, or GIF image";
    }
    if (file.size > MAX_SIZE) {
      return "Image must be less than 2MB";
    }
    return null;
  }, []);

  const handleFile = useCallback(
    (file: File) => {
      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      setError(null);

      // Create preview URL
      const previewUrl = URL.createObjectURL(file);

      // Store file and preview in wizard data
      updateData({
        avatarFile: file,
        avatarPreview: previewUrl,
      });
    },
    [validateFile, updateData]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
        handleFile(file);
      }
    },
    [handleFile]
  );

  const handleRemove = useCallback(() => {
    updateData({
      avatarFile: null,
      avatarPreview: null,
    });
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [updateData]);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const initials =
    (data.displayName || user?.name)?.charAt(0)?.toUpperCase() || "U";

  return (
    <div className="space-y-4">
      {/* Avatar preview and upload area */}
      <div className="flex items-center gap-6">
        {/* Current avatar display */}
        <div className="relative flex-shrink-0">
          {displayAvatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={displayAvatar}
              alt="Profile"
              className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-[#262626] shadow-lg"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center text-white text-3xl font-bold border-4 border-white dark:border-[#262626] shadow-lg">
              {initials}
            </div>
          )}

          {/* Remove button (only if we have a custom upload or if they want to clear) */}
          {data.avatarFile && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
              title="Remove photo"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>

        {/* Upload drop zone */}
        <div
          onClick={handleClick}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          className={cn(
            "flex-1 border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all duration-200",
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-900/20"
              : "border-gray-300 dark:border-gray-700 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50",
            isUploading && "pointer-events-none opacity-50"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={ALLOWED_TYPES.join(",")}
            onChange={handleInputChange}
            className="hidden"
          />

          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {isDragging ? "Drop your image" : "Click or drag to upload"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                JPEG, PNG, WebP, or GIF up to 2MB
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Error message */}
      {error && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}
    </div>
  );
}
