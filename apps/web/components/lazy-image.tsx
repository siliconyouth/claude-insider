"use client";

import { useState, useCallback } from "react";
import Image, { ImageProps } from "next/image";
import { useIntersectionObserver } from "@/hooks/use-intersection-observer";
import { cn } from "@/lib/design-system";
import { Skeleton } from "@/components/skeleton";

interface LazyImageProps extends Omit<ImageProps, "onLoad" | "onError" | "placeholder"> {
  /** Blur placeholder (base64 or URL to tiny image) */
  blurPlaceholder?: string;
  /** Custom placeholder component */
  customPlaceholder?: React.ReactNode;
  /** Aspect ratio for placeholder (e.g., "16/9", "4/3", "1/1") */
  aspectRatio?: string;
  /** Root margin for intersection observer */
  rootMargin?: string;
  /** Container className */
  containerClassName?: string;
  /** Show skeleton while loading */
  showSkeleton?: boolean;
  /** Fade-in duration in ms */
  fadeDuration?: number;
}

/**
 * Lazy loaded image with blur-up effect.
 * Only loads image when it enters the viewport.
 *
 * @example
 * ```tsx
 * <LazyImage
 *   src="/hero-image.jpg"
 *   alt="Hero"
 *   width={800}
 *   height={400}
 *   aspectRatio="16/9"
 *   blurPlaceholder="data:image/jpeg;base64,..."
 * />
 * ```
 */
export function LazyImage({
  src,
  alt,
  width,
  height,
  blurPlaceholder,
  customPlaceholder,
  aspectRatio,
  rootMargin = "200px",
  containerClassName,
  showSkeleton = true,
  fadeDuration = 500,
  className,
  ...props
}: LazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin,
    triggerOnce: true,
    threshold: 0.01,
  });

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
  }, []);

  const handleError = useCallback(() => {
    setHasError(true);
    setIsLoaded(true);
  }, []);

  // Calculate aspect ratio style
  const aspectRatioStyle = aspectRatio
    ? { aspectRatio }
    : width && height
      ? { aspectRatio: `${width}/${height}` }
      : undefined;

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden",
        "bg-gray-100 dark:bg-[#1a1a1a]",
        containerClassName
      )}
      style={aspectRatioStyle}
    >
      {/* Blur placeholder or skeleton */}
      {!isLoaded && (
        <div className="absolute inset-0">
          {blurPlaceholder ? (
            <div
              className="absolute inset-0 scale-110 blur-lg"
              style={{
                backgroundImage: `url(${blurPlaceholder})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            />
          ) : customPlaceholder ? (
            customPlaceholder
          ) : showSkeleton ? (
            <Skeleton className="absolute inset-0 rounded-none" />
          ) : null}
        </div>
      )}

      {/* Actual image - only render when in viewport */}
      {isIntersecting && !hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn(
            "transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          style={{
            transitionDuration: `${fadeDuration}ms`,
          }}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-[#1a1a1a]">
          <div className="text-center text-gray-400 dark:text-gray-600">
            <svg
              className="w-8 h-8 mx-auto mb-2"
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
            <span className="text-xs">Failed to load</span>
          </div>
        </div>
      )}
    </div>
  );
}

interface BlurUpImageProps {
  src: string;
  alt: string;
  /** Tiny base64 placeholder (10-20px wide) */
  placeholder: string;
  width: number;
  height: number;
  className?: string;
  priority?: boolean;
}

/**
 * Image with blur-up loading effect.
 * Shows a tiny blurred version that transitions to full image.
 *
 * Generate placeholder with:
 * ```bash
 * npx plaiceholder ./public/image.jpg
 * ```
 */
export function BlurUpImage({
  src,
  alt,
  placeholder,
  width,
  height,
  className,
  priority = false,
}: BlurUpImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div
      className={cn("relative overflow-hidden", className)}
      style={{ aspectRatio: `${width}/${height}` }}
    >
      {/* Blurred placeholder - always visible initially */}
      <div
        className={cn(
          "absolute inset-0 scale-110 transition-opacity duration-700",
          isLoaded ? "opacity-0" : "opacity-100"
        )}
        style={{
          backgroundImage: `url(${placeholder})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          filter: "blur(20px)",
        }}
      />

      {/* Full image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={cn(
          "relative z-10 transition-opacity duration-500",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        priority={priority}
      />
    </div>
  );
}

interface ResponsiveLazyImageProps {
  src: string;
  alt: string;
  aspectRatio: string;
  sizes?: string;
  className?: string;
  containerClassName?: string;
  priority?: boolean;
}

/**
 * Responsive lazy image that fills its container.
 * Perfect for hero images and banners.
 */
export function ResponsiveLazyImage({
  src,
  alt,
  aspectRatio,
  sizes = "100vw",
  className,
  containerClassName,
  priority = false,
}: ResponsiveLazyImageProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  const { ref, isIntersecting } = useIntersectionObserver({
    rootMargin: "200px",
    triggerOnce: true,
    enabled: !priority,
  });

  const shouldLoad = priority || isIntersecting;

  return (
    <div
      ref={ref}
      className={cn(
        "relative overflow-hidden bg-gray-100 dark:bg-[#1a1a1a]",
        containerClassName
      )}
      style={{ aspectRatio }}
    >
      {/* Skeleton placeholder */}
      {!isLoaded && <Skeleton className="absolute inset-0 rounded-none" />}

      {/* Image */}
      {shouldLoad && (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className={cn(
            "object-cover transition-opacity duration-500",
            isLoaded ? "opacity-100" : "opacity-0",
            className
          )}
          onLoad={() => setIsLoaded(true)}
          priority={priority}
        />
      )}
    </div>
  );
}
