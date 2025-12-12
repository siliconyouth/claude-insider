"use client";

import { Suspense, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/design-system";
import {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonDocPage,
  SkeletonHero,
  SkeletonSidebar,
} from "@/components/skeleton";

type RouteType =
  | "home"
  | "docs"
  | "docs-page"
  | "legal"
  | "changelog"
  | "unknown";

/**
 * Detect route type from pathname
 */
function getRouteType(pathname: string): RouteType {
  if (pathname === "/") return "home";
  if (pathname === "/docs") return "docs";
  if (pathname.startsWith("/docs/")) return "docs-page";
  if (
    ["/privacy", "/terms", "/disclaimer", "/accessibility"].includes(pathname)
  ) {
    return "legal";
  }
  if (pathname === "/changelog") return "changelog";
  return "unknown";
}

interface ContentLoaderProps {
  children: ReactNode;
  /** Override the automatic route detection */
  type?: RouteType;
  className?: string;
}

/**
 * Content loader that shows appropriate skeleton based on route.
 * Automatically detects route type and shows matching loading state.
 *
 * @example
 * ```tsx
 * <ContentLoader>
 *   <Suspense>
 *     <AsyncContent />
 *   </Suspense>
 * </ContentLoader>
 * ```
 */
export function ContentLoader({ children, type, className }: ContentLoaderProps) {
  const pathname = usePathname();
  const routeType = type ?? getRouteType(pathname);
  const skeleton = getSkeletonForRoute(routeType);

  return (
    <Suspense fallback={<div className={className}>{skeleton}</div>}>
      {children}
    </Suspense>
  );
}

/**
 * Get appropriate skeleton component for route type
 */
function getSkeletonForRoute(routeType: RouteType): ReactNode {
  switch (routeType) {
    case "home":
      return <HomePageSkeleton />;
    case "docs":
      return <DocsIndexSkeleton />;
    case "docs-page":
      return <DocsPageSkeleton />;
    case "legal":
      return <LegalPageSkeleton />;
    case "changelog":
      return <ChangelogSkeleton />;
    default:
      return <GenericPageSkeleton />;
  }
}

/**
 * Homepage loading skeleton
 */
export function HomePageSkeleton() {
  return (
    <div className="space-y-16">
      {/* Hero section */}
      <div className="text-center py-24 space-y-8">
        <SkeletonHero />
      </div>

      {/* Categories grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-48 mx-auto mb-12" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      </div>

      {/* Stats section */}
      <div className="py-16 border-t border-gray-200 dark:border-[#262626]">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="text-center space-y-2">
              <Skeleton className="h-10 w-16 mx-auto" />
              <Skeleton className="h-4 w-24 mx-auto" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * Documentation index loading skeleton
 */
export function DocsIndexSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Title */}
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-5 w-96 mb-12" />

      {/* Section cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className={cn(
              "p-6 rounded-xl",
              "bg-white dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]"
            )}
          >
            <div className="flex items-center gap-4 mb-4">
              <Skeleton className="h-10 w-10 rounded-lg" />
              <Skeleton className="h-6 w-32" />
            </div>
            <SkeletonText lines={2} />
            <div className="mt-4 space-y-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} className="h-4 w-3/4" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Documentation page loading skeleton with sidebar
 */
export function DocsPageSkeleton() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex gap-12">
        {/* Sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <SkeletonSidebar />
        </aside>

        {/* Main content */}
        <main className="flex-1 min-w-0">
          {/* Breadcrumb */}
          <div className="flex gap-2 mb-8">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-4" />
            <Skeleton className="h-4 w-32" />
          </div>

          {/* Document content */}
          <SkeletonDocPage />
        </main>

        {/* TOC */}
        <aside className="hidden xl:block w-64 flex-shrink-0">
          <div className="sticky top-24 space-y-4">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2 pl-4 border-l border-gray-200 dark:border-[#262626]">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-3 w-32" />
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

/**
 * Legal page loading skeleton
 */
export function LegalPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-10 w-48 mb-4" />
      <Skeleton className="h-4 w-32 mb-12" />

      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="mb-8">
          <Skeleton className="h-7 w-40 mb-4" />
          <SkeletonText lines={4} />
        </div>
      ))}
    </div>
  );
}

/**
 * Changelog page loading skeleton
 */
export function ChangelogSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-10 w-36 mb-12" />

      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="mb-12 pb-12 border-b border-gray-200 dark:border-[#262626]">
          {/* Version header */}
          <div className="flex items-center gap-4 mb-6">
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-28" />
          </div>

          {/* Change sections */}
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="mb-4">
              <Skeleton className="h-5 w-20 mb-3" />
              <div className="space-y-2 pl-4">
                {Array.from({ length: 3 }).map((_, k) => (
                  <Skeleton key={k} className="h-4 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Generic page loading skeleton
 */
export function GenericPageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Skeleton className="h-10 w-64 mb-4" />
      <Skeleton className="h-5 w-full max-w-md mb-12" />
      <SkeletonText lines={6} className="mb-8" />
      <SkeletonText lines={4} />
    </div>
  );
}

/**
 * Loading indicator for navigation transitions
 */
export function NavigationLoader({ isLoading }: { isLoading: boolean }) {
  if (!isLoading) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 h-1 bg-gray-200 dark:bg-gray-800 overflow-hidden">
      <div
        className={cn(
          "h-full bg-gradient-to-r from-violet-500 via-blue-500 to-cyan-500",
          "animate-[progress_1s_ease-in-out_infinite]"
        )}
        style={{
          width: "30%",
          animation: "progress 1s ease-in-out infinite",
        }}
      />
      {/* eslint-disable-next-line react/no-unknown-property */}
      <style jsx>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(200%);
          }
          100% {
            transform: translateX(400%);
          }
        }
      `}</style>
    </div>
  );
}

/**
 * Full page loading overlay
 */
export function PageLoadingOverlay({
  isVisible,
  message = "Loading...",
}: {
  isVisible: boolean;
  message?: string;
}) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 dark:bg-[#0a0a0a]/80 backdrop-blur-sm">
      <div className="text-center space-y-4">
        {/* Spinner */}
        <div className="relative w-12 h-12 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div
            className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin"
          />
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400">{message}</p>
      </div>
    </div>
  );
}
