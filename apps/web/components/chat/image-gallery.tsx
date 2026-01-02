/**
 * Image Gallery Component
 *
 * Displays images in chat messages with:
 * - Thumbnail grid for multiple images
 * - Lightbox view with zoom/pan
 * - Image carousel navigation
 * - Download button
 * - Share button (if supported)
 *
 * Usage:
 * ```tsx
 * <ImageGallery images={[{ url: "...", alt: "..." }]} />
 * <ImageLightbox
 *   images={images}
 *   currentIndex={0}
 *   onClose={() => {}}
 *   onNavigate={(index) => {}}
 * />
 * ```
 */

"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";

// ============================================================================
// TYPES
// ============================================================================

export interface ImageAttachment {
  /** Image URL */
  url: string;
  /** Alt text for accessibility */
  alt?: string;
  /** Original filename */
  filename?: string;
  /** Image width (if known) */
  width?: number;
  /** Image height (if known) */
  height?: number;
  /** Thumbnail URL (for large images) */
  thumbnailUrl?: string;
  /** File size in bytes */
  size?: number;
}

export interface ImageGalleryProps {
  /** Array of images to display */
  images: ImageAttachment[];
  /** Maximum images to show before "+N more" */
  maxVisible?: number;
  /** Grid layout */
  layout?: "grid" | "row" | "masonry";
  /** Additional class name */
  className?: string;
}

export interface ImageLightboxProps {
  /** Images in the gallery */
  images: ImageAttachment[];
  /** Currently displayed image index */
  currentIndex: number;
  /** Close handler */
  onClose: () => void;
  /** Navigate to different image */
  onNavigate: (index: number) => void;
}

// ============================================================================
// IMAGE GALLERY
// ============================================================================

export const ImageGallery = memo(function ImageGallery({
  images,
  maxVisible = 4,
  layout = "grid",
  className,
}: ImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const handleImageClick = useCallback((index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    setLightboxOpen(false);
  }, []);

  const handleNavigate = useCallback((index: number) => {
    setLightboxIndex(index);
  }, []);

  if (images.length === 0) return null;

  const visibleImages = images.slice(0, maxVisible);
  const remainingCount = images.length - maxVisible;

  // Single image - show larger
  if (images.length === 1 && images[0]) {
    return (
      <>
        <button
          onClick={() => handleImageClick(0)}
          className={cn(
            "relative overflow-hidden rounded-xl",
            "max-w-sm max-h-80",
            "group cursor-pointer",
            className
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0].thumbnailUrl || images[0].url}
            alt={images[0].alt || "Image"}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
          <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <ZoomIcon className="w-5 h-5 text-white drop-shadow-lg" />
          </div>
        </button>

        {lightboxOpen && (
          <ImageLightbox
            images={images}
            currentIndex={lightboxIndex}
            onClose={handleClose}
            onNavigate={handleNavigate}
          />
        )}
      </>
    );
  }

  // Multiple images - show grid
  const gridClass = {
    grid: images.length === 2
      ? "grid-cols-2"
      : images.length === 3
        ? "grid-cols-2"
        : "grid-cols-2",
    row: "flex flex-nowrap overflow-x-auto gap-2",
    masonry: "columns-2 gap-2",
  }[layout];

  return (
    <>
      <div
        className={cn(
          layout === "grid" && "grid gap-1",
          gridClass,
          className
        )}
      >
        {visibleImages.map((image, index) => (
          <button
            key={image.url}
            onClick={() => handleImageClick(index)}
            className={cn(
              "relative overflow-hidden rounded-lg group cursor-pointer",
              layout === "grid" && "aspect-square",
              layout === "row" && "shrink-0 w-32 h-32",
              // Special sizing for 3 images
              images.length === 3 && index === 0 && "row-span-2 aspect-auto h-full"
            )}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={image.thumbnailUrl || image.url}
              alt={image.alt || `Image ${index + 1}`}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />

            {/* "+N more" overlay on last visible image */}
            {index === visibleImages.length - 1 && remainingCount > 0 && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                <span className="text-white font-semibold text-lg">
                  +{remainingCount}
                </span>
              </div>
            )}
          </button>
        ))}
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          currentIndex={lightboxIndex}
          onClose={handleClose}
          onNavigate={handleNavigate}
        />
      )}
    </>
  );
});

// ============================================================================
// IMAGE LIGHTBOX
// ============================================================================

export const ImageLightbox = memo(function ImageLightbox({
  images,
  currentIndex,
  onClose,
  onNavigate,
}: ImageLightboxProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [mounted, setMounted] = useState(false);

  const currentImage = images[currentIndex];
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < images.length - 1;

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Reset zoom when image changes
  useEffect(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowLeft":
          if (hasPrev) onNavigate(currentIndex - 1);
          break;
        case "ArrowRight":
          if (hasNext) onNavigate(currentIndex + 1);
          break;
        case "+":
        case "=":
          setZoom((z) => Math.min(z + 0.5, 4));
          break;
        case "-":
          setZoom((z) => Math.max(z - 0.5, 1));
          break;
        case "0":
          setZoom(1);
          setPosition({ x: 0, y: 0 });
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose, onNavigate, currentIndex, hasPrev, hasNext]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const handleZoomIn = useCallback(() => {
    setZoom((z) => Math.min(z + 0.5, 4));
  }, []);

  const handleZoomOut = useCallback(() => {
    setZoom((z) => {
      const newZoom = Math.max(z - 0.5, 1);
      if (newZoom === 1) setPosition({ x: 0, y: 0 });
      return newZoom;
    });
  }, []);

  const handleReset = useCallback(() => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (zoom > 1) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
    }
  }, [zoom, position]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  }, [isDragging, dragStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const handleDownload = useCallback(async () => {
    if (!currentImage) return;

    try {
      const response = await fetch(currentImage.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = currentImage.filename || `image-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
    }
  }, [currentImage, currentIndex]);

  const handleShare = useCallback(async () => {
    if (!currentImage || !navigator.share) return;

    try {
      await navigator.share({
        title: currentImage.alt || "Shared Image",
        url: currentImage.url,
      });
    } catch (error) {
      // User cancelled or share failed
      console.error("Share failed:", error);
    }
  }, [currentImage]);

  if (!mounted || !currentImage) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/95"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Image viewer"
    >
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
        aria-label="Close"
      >
        <CloseIcon className="w-6 h-6 text-white" />
      </button>

      {/* Navigation - Previous */}
      {hasPrev && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex - 1);
          }}
          className="absolute left-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Previous image"
        >
          <ChevronLeftIcon className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Navigation - Next */}
      {hasNext && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onNavigate(currentIndex + 1);
          }}
          className="absolute right-4 z-10 p-3 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
          aria-label="Next image"
        >
          <ChevronRightIcon className="w-6 h-6 text-white" />
        </button>
      )}

      {/* Image */}
      <div
        className={cn(
          "relative max-w-[90vw] max-h-[80vh] overflow-hidden",
          zoom > 1 && "cursor-move"
        )}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImage.url}
          alt={currentImage.alt || "Image"}
          className="max-w-full max-h-[80vh] object-contain select-none"
          style={{
            transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
            transition: isDragging ? "none" : "transform 0.2s ease-out",
          }}
          draggable={false}
        />
      </div>

      {/* Bottom toolbar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm">
        {/* Image counter */}
        <span className="text-white text-sm px-2">
          {currentIndex + 1} / {images.length}
        </span>

        <div className="w-px h-6 bg-white/20" />

        {/* Zoom controls */}
        <button
          onClick={handleZoomOut}
          disabled={zoom <= 1}
          className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom out"
        >
          <ZoomOutIcon className="w-5 h-5 text-white" />
        </button>
        <span className="text-white text-sm min-w-[3rem] text-center">
          {Math.round(zoom * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          disabled={zoom >= 4}
          className="p-1.5 rounded-full hover:bg-white/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          aria-label="Zoom in"
        >
          <ZoomInIcon className="w-5 h-5 text-white" />
        </button>
        {zoom > 1 && (
          <button
            onClick={handleReset}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Reset zoom"
          >
            <ResetIcon className="w-5 h-5 text-white" />
          </button>
        )}

        <div className="w-px h-6 bg-white/20" />

        {/* Download */}
        <button
          onClick={handleDownload}
          className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Download"
        >
          <DownloadIcon className="w-5 h-5 text-white" />
        </button>

        {/* Share (if supported) */}
        {typeof navigator !== "undefined" && "share" in navigator && (
          <button
            onClick={handleShare}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
            aria-label="Share"
          >
            <ShareIcon className="w-5 h-5 text-white" />
          </button>
        )}
      </div>
    </div>,
    document.body
  );
});

// ============================================================================
// SVG ICONS
// ============================================================================

function ZoomIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}

function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <polyline points="9 18 15 12 9 6" />
    </svg>
  );
}

function ZoomInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="11" y1="8" x2="11" y2="14" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ZoomOutIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
      <line x1="8" y1="11" x2="14" y2="11" />
    </svg>
  );
}

function ResetIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}
