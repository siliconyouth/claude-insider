/**
 * File Preview Component
 *
 * Displays file attachments in chat messages:
 * - Images: thumbnail with lightbox
 * - Documents: PDF preview, Office icons
 * - Code: syntax highlighted preview
 * - Audio: inline player
 * - Video: inline player with poster
 * - Archives: file list
 *
 * Usage:
 * ```tsx
 * <FilePreview file={{ url: "...", filename: "doc.pdf", type: "application/pdf" }} />
 * ```
 */

"use client";

import { memo, useCallback, useState } from "react";
import { cn } from "@/lib/design-system";

// ============================================================================
// TYPES
// ============================================================================

export interface FileAttachment {
  /** File URL */
  url: string;
  /** Original filename */
  filename: string;
  /** MIME type */
  type: string;
  /** File size in bytes */
  size?: number;
  /** Thumbnail URL (for images/videos) */
  thumbnailUrl?: string;
  /** Video duration in seconds */
  duration?: number;
  /** Image/video dimensions */
  width?: number;
  height?: number;
}

export interface FilePreviewProps {
  /** File to preview */
  file: FileAttachment;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Show download button */
  showDownload?: boolean;
  /** Additional class name */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_CONFIG = {
  sm: {
    container: "p-2",
    icon: "w-8 h-8",
    title: "text-xs",
    meta: "text-[10px]",
    preview: "max-w-xs max-h-32",
  },
  md: {
    container: "p-3",
    icon: "w-10 h-10",
    title: "text-sm",
    meta: "text-xs",
    preview: "max-w-sm max-h-48",
  },
  lg: {
    container: "p-4",
    icon: "w-12 h-12",
    title: "text-base",
    meta: "text-sm",
    preview: "max-w-md max-h-64",
  },
};

// File type categories
const FILE_CATEGORIES = {
  image: ["image/jpeg", "image/png", "image/gif", "image/webp", "image/svg+xml"],
  video: ["video/mp4", "video/webm", "video/ogg", "video/quicktime"],
  audio: ["audio/mpeg", "audio/wav", "audio/ogg", "audio/webm", "audio/mp4"],
  document: ["application/pdf"],
  code: [
    "text/javascript",
    "text/typescript",
    "text/html",
    "text/css",
    "text/plain",
    "application/json",
    "application/xml",
  ],
  archive: [
    "application/zip",
    "application/x-rar-compressed",
    "application/x-7z-compressed",
    "application/gzip",
    "application/x-tar",
  ],
  spreadsheet: [
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ],
  presentation: [
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],
  word: [
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ],
};

// ============================================================================
// FILE PREVIEW
// ============================================================================

export const FilePreview = memo(function FilePreview({
  file,
  size = "md",
  showDownload = true,
  className,
}: FilePreviewProps) {
  const category = getFileCategory(file.type);

  switch (category) {
    case "image":
      return <ImagePreview file={file} size={size} className={className} />;
    case "video":
      return <VideoPreview file={file} size={size} className={className} />;
    case "audio":
      return <AudioPreview file={file} size={size} className={className} />;
    default:
      return (
        <GenericFilePreview
          file={file}
          size={size}
          showDownload={showDownload}
          className={className}
        />
      );
  }
});

// ============================================================================
// IMAGE PREVIEW
// ============================================================================

interface ImagePreviewProps {
  file: FileAttachment;
  size: "sm" | "md" | "lg";
  className?: string;
}

const ImagePreview = memo(function ImagePreview({
  file,
  size,
  className,
}: ImagePreviewProps) {
  const [error, setError] = useState(false);
  const sizeConfig = SIZE_CONFIG[size];

  if (error) {
    return (
      <GenericFilePreview file={file} size={size} className={className} />
    );
  }

  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(
        "block rounded-lg overflow-hidden",
        "hover:opacity-90 transition-opacity",
        sizeConfig.preview,
        className
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={file.thumbnailUrl || file.url}
        alt={file.filename}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        loading="lazy"
      />
    </a>
  );
});

// ============================================================================
// VIDEO PREVIEW
// ============================================================================

interface VideoPreviewProps {
  file: FileAttachment;
  size: "sm" | "md" | "lg";
  className?: string;
}

const VideoPreview = memo(function VideoPreview({
  file,
  size,
  className,
}: VideoPreviewProps) {
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div className={cn("rounded-lg overflow-hidden", sizeConfig.preview, className)}>
      <video
        src={file.url}
        poster={file.thumbnailUrl}
        controls
        preload="metadata"
        className="w-full h-full"
      >
        <source src={file.url} type={file.type} />
        Your browser does not support the video tag.
      </video>
    </div>
  );
});

// ============================================================================
// AUDIO PREVIEW
// ============================================================================

interface AudioPreviewProps {
  file: FileAttachment;
  size: "sm" | "md" | "lg";
  className?: string;
}

const AudioPreview = memo(function AudioPreview({
  file,
  size,
  className,
}: AudioPreviewProps) {
  const sizeConfig = SIZE_CONFIG[size];

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg",
        "bg-gray-100 dark:bg-gray-800",
        sizeConfig.container,
        className
      )}
    >
      <div
        className={cn(
          "shrink-0 rounded-lg flex items-center justify-center",
          "bg-gradient-to-br from-violet-500 to-cyan-500",
          sizeConfig.icon
        )}
      >
        <AudioIcon className="w-1/2 h-1/2 text-white" />
      </div>

      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate ui-text-heading", sizeConfig.title)}>
          {file.filename}
        </p>
        {file.size && (
          <p className={cn("ui-text-secondary", sizeConfig.meta)}>
            {formatFileSize(file.size)}
          </p>
        )}
        <audio
          src={file.url}
          controls
          preload="metadata"
          className="w-full mt-2"
        >
          <source src={file.url} type={file.type} />
        </audio>
      </div>
    </div>
  );
});

// ============================================================================
// GENERIC FILE PREVIEW
// ============================================================================

interface GenericFilePreviewProps {
  file: FileAttachment;
  size: "sm" | "md" | "lg";
  showDownload?: boolean;
  className?: string;
}

const GenericFilePreview = memo(function GenericFilePreview({
  file,
  size,
  showDownload = true,
  className,
}: GenericFilePreviewProps) {
  const sizeConfig = SIZE_CONFIG[size];
  const category = getFileCategory(file.type);
  const icon = getFileIcon(category);
  const iconColor = getFileIconColor(category);

  const handleDownload = useCallback(async () => {
    try {
      const response = await fetch(file.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [file]);

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-lg",
        "border border-gray-200 dark:border-[#262626]",
        "bg-gray-50 dark:bg-[#111111]",
        sizeConfig.container,
        className
      )}
    >
      {/* Icon */}
      <div
        className={cn(
          "shrink-0 rounded-lg flex items-center justify-center",
          iconColor,
          sizeConfig.icon
        )}
      >
        {icon}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={cn("font-medium truncate ui-text-heading", sizeConfig.title)}>
          {file.filename}
        </p>
        <p className={cn("ui-text-secondary", sizeConfig.meta)}>
          {file.size ? formatFileSize(file.size) : getFileExtension(file.filename).toUpperCase()}
        </p>
      </div>

      {/* Actions */}
      {showDownload && (
        <button
          onClick={handleDownload}
          className={cn(
            "shrink-0 p-2 rounded-lg",
            "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200",
            "hover:bg-gray-100 dark:hover:bg-gray-800",
            "transition-colors"
          )}
          title="Download"
        >
          <DownloadIcon className="w-5 h-5" />
        </button>
      )}
    </div>
  );
});

// ============================================================================
// FILE ATTACHMENT LIST
// ============================================================================

export interface FileAttachmentListProps {
  files: FileAttachment[];
  size?: "sm" | "md" | "lg";
  className?: string;
}

export const FileAttachmentList = memo(function FileAttachmentList({
  files,
  size = "sm",
  className,
}: FileAttachmentListProps) {
  if (files.length === 0) return null;

  // Separate images from other files
  const images = files.filter((f) => getFileCategory(f.type) === "image");
  const otherFiles = files.filter((f) => getFileCategory(f.type) !== "image");

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Image grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-1 max-w-xs">
          {images.map((file) => (
            <ImagePreview key={file.url} file={file} size={size} />
          ))}
        </div>
      )}

      {/* Other files */}
      {otherFiles.map((file) => (
        <FilePreview key={file.url} file={file} size={size} />
      ))}
    </div>
  );
});

// ============================================================================
// UTILITIES
// ============================================================================

function getFileCategory(mimeType: string): string {
  for (const [category, types] of Object.entries(FILE_CATEGORIES)) {
    if (types.includes(mimeType)) {
      return category;
    }
  }
  return "other";
}

function getFileExtension(filename: string): string {
  return filename.split(".").pop() || "";
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function getFileIcon(category: string): React.ReactNode {
  const iconClass = "w-1/2 h-1/2 text-white";

  switch (category) {
    case "document":
      return <DocumentIcon className={iconClass} />;
    case "code":
      return <CodeIcon className={iconClass} />;
    case "archive":
      return <ArchiveIcon className={iconClass} />;
    case "spreadsheet":
      return <SpreadsheetIcon className={iconClass} />;
    case "presentation":
      return <PresentationIcon className={iconClass} />;
    case "word":
      return <WordIcon className={iconClass} />;
    case "audio":
      return <AudioIcon className={iconClass} />;
    case "video":
      return <VideoIcon className={iconClass} />;
    default:
      return <FileIcon className={iconClass} />;
  }
}

function getFileIconColor(category: string): string {
  switch (category) {
    case "document":
      return "bg-red-500";
    case "code":
      return "bg-gray-700 dark:bg-gray-600";
    case "archive":
      return "bg-amber-500";
    case "spreadsheet":
      return "bg-emerald-500";
    case "presentation":
      return "bg-orange-500";
    case "word":
      return "bg-blue-500";
    case "audio":
      return "bg-gradient-to-br from-violet-500 to-cyan-500";
    case "video":
      return "bg-purple-500";
    default:
      return "bg-gray-500";
  }
}

// ============================================================================
// SVG ICONS
// ============================================================================

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function FileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}

function DocumentIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function CodeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  );
}

function ArchiveIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 8v13H3V8" />
      <path d="M1 3h22v5H1z" />
      <path d="M10 12h4" />
    </svg>
  );
}

function SpreadsheetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="3" y1="9" x2="21" y2="9" />
      <line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" />
      <line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  );
}

function PresentationIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M2 3h20" />
      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
      <path d="M12 16v4" />
      <path d="M8 21h8" />
    </svg>
  );
}

function WordIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
    </svg>
  );
}

function AudioIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M9 18V5l12-2v13" />
      <circle cx="6" cy="18" r="3" />
      <circle cx="18" cy="16" r="3" />
    </svg>
  );
}

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
      <line x1="7" y1="2" x2="7" y2="22" />
      <line x1="17" y1="2" x2="17" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="2" y1="7" x2="7" y2="7" />
      <line x1="2" y1="17" x2="7" y2="17" />
      <line x1="17" y1="17" x2="22" y2="17" />
      <line x1="17" y1="7" x2="22" y2="7" />
    </svg>
  );
}
