"use client";

/**
 * Cover Photo Cropper Modal
 *
 * A modal dialog for uploading and cropping cover photos.
 * Uses react-image-crop for client-side cropping with 3:1 aspect ratio.
 * Shows a live preview of how the cover will look on the profile.
 */

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { cn } from "@/lib/design-system";
import { DefaultCover } from "@/components/profile";

interface CoverPhotoCropperProps {
  /** Whether the modal is open */
  isOpen: boolean;
  /** Callback to close the modal */
  onClose: () => void;
  /** Callback when cover photo is successfully uploaded */
  onUploadComplete: (url: string) => void;
  /** Current cover photo URL (for preview) */
  currentCoverUrl?: string | null;
  /** User's avatar URL (for preview) */
  avatarUrl?: string | null;
  /** User's name (for preview) */
  userName?: string;
}

// Cover photo aspect ratio: 3:1 (like Twitter)
const ASPECT_RATIO = 3 / 1;

// Maximum output dimensions
const MAX_OUTPUT_WIDTH = 1500;
const MAX_OUTPUT_HEIGHT = 500;

/**
 * Helper to create a centered crop with the correct aspect ratio
 */
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

/**
 * Create a canvas element with the cropped image
 */
async function getCroppedImage(
  image: HTMLImageElement,
  crop: Crop,
  maxWidth: number,
  maxHeight: number
): Promise<Blob | null> {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  // Validate crop values
  if (!crop || crop.width <= 0 || crop.height <= 0) {
    console.error("[CoverPhotoCropper] Invalid crop dimensions");
    return null;
  }

  // Calculate the actual pixel values from percentage
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;

  // Clamp crop values to valid range
  const clampedCrop = {
    x: Math.max(0, Math.min(100, crop.x)),
    y: Math.max(0, Math.min(100, crop.y)),
    width: Math.max(1, Math.min(100, crop.width)),
    height: Math.max(1, Math.min(100, crop.height)),
  };

  const pixelCrop = {
    x: Math.max(0, (clampedCrop.x / 100) * image.width * scaleX),
    y: Math.max(0, (clampedCrop.y / 100) * image.height * scaleY),
    width: Math.max(1, (clampedCrop.width / 100) * image.width * scaleX),
    height: Math.max(1, (clampedCrop.height / 100) * image.height * scaleY),
  };

  // Ensure we don't exceed image bounds
  pixelCrop.x = Math.min(pixelCrop.x, image.naturalWidth - pixelCrop.width);
  pixelCrop.y = Math.min(pixelCrop.y, image.naturalHeight - pixelCrop.height);

  // Determine output size (respect max dimensions)
  let outputWidth = pixelCrop.width;
  let outputHeight = pixelCrop.height;

  if (outputWidth > maxWidth) {
    outputHeight = (maxWidth / outputWidth) * outputHeight;
    outputWidth = maxWidth;
  }
  if (outputHeight > maxHeight) {
    outputWidth = (maxHeight / outputHeight) * outputWidth;
    outputHeight = maxHeight;
  }

  canvas.width = outputWidth;
  canvas.height = outputHeight;

  // Draw the cropped image
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    outputWidth,
    outputHeight
  );

  // Convert to blob
  return new Promise((resolve) => {
    canvas.toBlob(
      (blob) => {
        resolve(blob);
      },
      "image/jpeg",
      0.9 // Quality
    );
  });
}

export function CoverPhotoCropper({
  isOpen,
  onClose,
  onUploadComplete,
  currentCoverUrl,
  avatarUrl,
  userName = "User",
}: CoverPhotoCropperProps) {
  const [imgSrc, setImgSrc] = useState<string>("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<Crop>();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setImgSrc("");
      setCrop(undefined);
      setCompletedCrop(undefined);
      setError(null);
    }
  }, [isOpen]);

  // Handle file selection
  const onSelectFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Please select a JPEG, PNG, or WebP image");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError("Image must be less than 5MB");
      return;
    }

    setError(null);

    // Read file as data URL
    const reader = new FileReader();
    reader.onload = () => {
      setImgSrc(reader.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  // Initialize crop when image loads
  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
    },
    []
  );

  // Handle upload
  const handleUpload = async () => {
    if (!imgRef.current || !completedCrop) return;

    setIsUploading(true);
    setError(null);

    try {
      // Get cropped image as blob
      const croppedBlob = await getCroppedImage(
        imgRef.current,
        completedCrop,
        MAX_OUTPUT_WIDTH,
        MAX_OUTPUT_HEIGHT
      );

      if (!croppedBlob) {
        throw new Error("Failed to process image");
      }

      // Create form data
      const formData = new FormData();
      formData.append("coverPhoto", croppedBlob, "cover.jpg");

      // Upload to API
      const response = await fetch("/api/user/cover-photo", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Upload failed");
      }

      // Success
      onUploadComplete(data.url);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  };

  // Track where mousedown originated to prevent closing when dragging from content to backdrop
  // This is the standard solution used by Bootstrap and react-modal (see GitHub issues #13816, #475)
  const mouseDownTargetRef = useRef<EventTarget | null>(null);

  // Handle mousedown on backdrop - track that it started on backdrop
  const handleBackdropMouseDown = (e: React.MouseEvent) => {
    mouseDownTargetRef.current = e.target;
  };

  // Handle click on backdrop - only close if mousedown ALSO started on backdrop
  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close if:
    // 1. The click target is the backdrop itself (not a child)
    // 2. The mousedown also started on the backdrop (not dragged from content)
    // 3. We're not currently uploading
    const clickedOnBackdrop = e.target === e.currentTarget;
    const mouseDownOnBackdrop = mouseDownTargetRef.current === e.currentTarget;

    if (clickedOnBackdrop && mouseDownOnBackdrop && !isUploading) {
      onClose();
    }

    // Reset the mousedown target
    mouseDownTargetRef.current = null;
  };

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isUploading) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen, isUploading, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onMouseDown={handleBackdropMouseDown}
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="cropper-title"
    >
      <div
        className={cn(
          "bg-white dark:bg-[#111111] rounded-2xl",
          "border border-gray-200 dark:border-[#262626]",
          "shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden",
          "flex flex-col"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[#262626]">
          <h2
            id="cropper-title"
            className="text-lg font-semibold text-gray-900 dark:text-white"
          >
            {imgSrc ? "Crop Cover Photo" : "Upload Cover Photo"}
          </h2>
          <button
            onClick={onClose}
            disabled={isUploading}
            className={cn(
              "p-2 rounded-lg",
              "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors disabled:opacity-50"
            )}
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Preview Section */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Preview
            </label>
            <div
              className={cn(
                "relative rounded-xl overflow-hidden",
                "border border-gray-200 dark:border-[#262626]",
                "aspect-[3/1]"
              )}
            >
              {imgSrc && completedCrop ? (
                <canvas
                  ref={(canvas) => {
                    if (canvas && imgRef.current && completedCrop) {
                      const ctx = canvas.getContext("2d");
                      if (!ctx) return;

                      const image = imgRef.current;

                      // Validate completed crop
                      if (!completedCrop.width || !completedCrop.height ||
                          completedCrop.width <= 0 || completedCrop.height <= 0) {
                        return;
                      }

                      const scaleX = image.naturalWidth / image.width;
                      const scaleY = image.naturalHeight / image.height;

                      // Clamp values to valid range
                      const clampedCrop = {
                        x: Math.max(0, Math.min(100, completedCrop.x)),
                        y: Math.max(0, Math.min(100, completedCrop.y)),
                        width: Math.max(1, Math.min(100, completedCrop.width)),
                        height: Math.max(1, Math.min(100, completedCrop.height)),
                      };

                      const pixelCrop = {
                        x: Math.max(0, (clampedCrop.x / 100) * image.width * scaleX),
                        y: Math.max(0, (clampedCrop.y / 100) * image.height * scaleY),
                        width: Math.max(1, (clampedCrop.width / 100) * image.width * scaleX),
                        height: Math.max(1, (clampedCrop.height / 100) * image.height * scaleY),
                      };

                      // Ensure we don't exceed image bounds
                      pixelCrop.x = Math.min(pixelCrop.x, image.naturalWidth - pixelCrop.width);
                      pixelCrop.y = Math.min(pixelCrop.y, image.naturalHeight - pixelCrop.height);

                      canvas.width = canvas.offsetWidth * 2;
                      canvas.height = canvas.offsetHeight * 2;

                      try {
                        ctx.drawImage(
                          image,
                          pixelCrop.x,
                          pixelCrop.y,
                          pixelCrop.width,
                          pixelCrop.height,
                          0,
                          0,
                          canvas.width,
                          canvas.height
                        );
                      } catch (e) {
                        console.error("[CoverPhotoCropper] Canvas draw error:", e);
                      }
                    }
                  }}
                  className="w-full h-full object-cover"
                />
              ) : currentCoverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={currentCoverUrl}
                  alt="Current cover"
                  className="w-full h-full object-cover"
                />
              ) : (
                <DefaultCover className="w-full h-full" />
              )}

              {/* Avatar overlay for preview */}
              <div className="absolute bottom-2 left-4 flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#111111] ring-2 ring-white dark:ring-[#111111] shadow-lg overflow-hidden">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-violet-600 via-blue-600 to-cyan-600 flex items-center justify-center text-white font-bold">
                      {userName[0]?.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="text-white text-shadow-lg">
                  <p className="font-semibold text-sm">{userName}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Crop Area or File Selection */}
          {imgSrc ? (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Drag to adjust crop area
              </label>
              <div
                className="flex justify-center bg-gray-100 dark:bg-[#0a0a0a] rounded-xl p-4"
              >
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => {
                    // Clamp values to valid range to prevent out-of-bounds issues
                    const clampedCrop = {
                      ...percentCrop,
                      x: Math.max(0, Math.min(100 - percentCrop.width, percentCrop.x)),
                      y: Math.max(0, Math.min(100 - percentCrop.height, percentCrop.y)),
                      width: Math.max(1, Math.min(100, percentCrop.width)),
                      height: Math.max(1, Math.min(100, percentCrop.height)),
                    };
                    setCrop(clampedCrop);
                  }}
                  onComplete={(_, percentCrop) => {
                    // Clamp completed crop values as well
                    const clampedCrop = {
                      ...percentCrop,
                      x: Math.max(0, Math.min(100 - percentCrop.width, percentCrop.x)),
                      y: Math.max(0, Math.min(100 - percentCrop.height, percentCrop.y)),
                      width: Math.max(1, Math.min(100, percentCrop.width)),
                      height: Math.max(1, Math.min(100, percentCrop.height)),
                    };
                    setCompletedCrop(clampedCrop);
                  }}
                  aspect={ASPECT_RATIO}
                  className="max-h-[300px]"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={imgSrc}
                    alt="Crop preview"
                    onLoad={onImageLoad}
                    className="max-h-[300px]"
                  />
                </ReactCrop>
              </div>
              <button
                onClick={() => {
                  setImgSrc("");
                  setCrop(undefined);
                  setCompletedCrop(undefined);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="mt-2 text-sm text-blue-600 dark:text-cyan-400 hover:underline"
              >
                Choose different image
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Image
              </label>
              <div
                className={cn(
                  "border-2 border-dashed border-gray-300 dark:border-[#262626]",
                  "rounded-xl p-8 text-center",
                  "hover:border-blue-500 dark:hover:border-cyan-500",
                  "transition-colors cursor-pointer"
                )}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={onSelectFile}
                  className="hidden"
                />
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-2">
                  Click to upload or drag and drop
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  JPEG, PNG, or WebP (max 5MB)
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  Recommended: 1500 x 500 pixels (3:1)
                </p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-[#262626]">
          <button
            onClick={onClose}
            disabled={isUploading}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "text-gray-700 dark:text-gray-300",
              "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
              "transition-colors disabled:opacity-50"
            )}
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!completedCrop || isUploading}
            className={cn(
              "px-4 py-2 text-sm font-medium rounded-lg",
              "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
              "text-white shadow-lg shadow-blue-500/25",
              "hover:shadow-xl hover:-translate-y-0.5",
              "transition-all duration-200",
              "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
            )}
          >
            {isUploading ? (
              <span className="flex items-center gap-2">
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
                Uploading...
              </span>
            ) : (
              "Apply Cover Photo"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
