"use client";

/**
 * Screenshot Gallery Component
 *
 * Displays resource screenshots in a grid with lightbox functionality.
 * Uses a modal overlay for full-size viewing with navigation.
 */

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { cn } from "@/lib/design-system";

interface ScreenshotGalleryProps {
  screenshots: string[];
  title: string;
}

const CloseIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const ChevronLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
  </svg>
);

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
  </svg>
);

const ExpandIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
  </svg>
);

export function ScreenshotGallery({ screenshots, title }: ScreenshotGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
    document.body.style.overflow = "hidden";
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    document.body.style.overflow = "";
  };

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev === 0 ? screenshots.length - 1 : prev - 1));
  }, [screenshots.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev === screenshots.length - 1 ? 0 : prev + 1));
  }, [screenshots.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!lightboxOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowLeft") goToPrevious();
      if (e.key === "ArrowRight") goToNext();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, goToPrevious, goToNext]);

  if (!screenshots || screenshots.length === 0) return null;

  return (
    <>
      {/* Gallery Grid */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Screenshots
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {screenshots.map((screenshot, index) => (
            <button
              key={index}
              onClick={() => openLightbox(index)}
              className={cn(
                "group relative rounded-xl overflow-hidden",
                "border border-gray-200 dark:border-[#262626]",
                "hover:border-blue-500/50 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshot}
                alt={`${title} screenshot ${index + 1}`}
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                    <ExpandIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </div>
              <span className="sr-only">View screenshot {index + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Lightbox Modal */}
      {mounted &&
        lightboxOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            role="dialog"
            aria-modal="true"
            aria-label="Screenshot gallery"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/95"
              onClick={closeLightbox}
            />

            {/* Close Button */}
            <button
              onClick={closeLightbox}
              className={cn(
                "absolute top-4 right-4 z-10",
                "w-10 h-10 rounded-full",
                "bg-white/10 hover:bg-white/20",
                "flex items-center justify-center",
                "text-white transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-white/50"
              )}
              aria-label="Close gallery"
            >
              <CloseIcon className="w-6 h-6" />
            </button>

            {/* Navigation - Previous */}
            {screenshots.length > 1 && (
              <button
                onClick={goToPrevious}
                className={cn(
                  "absolute left-4 z-10",
                  "w-12 h-12 rounded-full",
                  "bg-white/10 hover:bg-white/20",
                  "flex items-center justify-center",
                  "text-white transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                aria-label="Previous screenshot"
              >
                <ChevronLeftIcon className="w-6 h-6" />
              </button>
            )}

            {/* Image */}
            <div className="relative max-w-[90vw] max-h-[90vh]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={screenshots[currentIndex]}
                alt={`${title} screenshot ${currentIndex + 1}`}
                className="max-w-full max-h-[90vh] object-contain"
              />
            </div>

            {/* Navigation - Next */}
            {screenshots.length > 1 && (
              <button
                onClick={goToNext}
                className={cn(
                  "absolute right-4 z-10",
                  "w-12 h-12 rounded-full",
                  "bg-white/10 hover:bg-white/20",
                  "flex items-center justify-center",
                  "text-white transition-colors",
                  "focus:outline-none focus:ring-2 focus:ring-white/50"
                )}
                aria-label="Next screenshot"
              >
                <ChevronRightIcon className="w-6 h-6" />
              </button>
            )}

            {/* Counter */}
            {screenshots.length > 1 && (
              <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                <div className="px-4 py-2 rounded-full bg-white/10 backdrop-blur text-white text-sm">
                  {currentIndex + 1} / {screenshots.length}
                </div>
              </div>
            )}

            {/* Thumbnails */}
            {screenshots.length > 1 && screenshots.length <= 8 && (
              <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10">
                <div className="flex gap-2">
                  {screenshots.map((screenshot, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentIndex(index)}
                      className={cn(
                        "w-12 h-12 rounded overflow-hidden",
                        "transition-all duration-200",
                        index === currentIndex
                          ? "ring-2 ring-white scale-110"
                          : "opacity-50 hover:opacity-100"
                      )}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={screenshot}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>,
          document.body
        )}
    </>
  );
}
