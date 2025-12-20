/**
 * Resource Page Loading Skeleton
 *
 * Mirrors the exact structure of the resource page for seamless transitions.
 */

import { cn } from "@/lib/design-system";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { Skeleton } from "@/components/skeleton";

export default function ResourceLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
      <Header activePage="resources" />

      <main id="main-content" className="flex-1">
        {/* Breadcrumb Skeleton */}
        <div className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-16" />
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <Skeleton className="h-4 w-20" />
              <span className="text-gray-400 dark:text-gray-600">/</span>
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
        </div>

        {/* Hero Skeleton */}
        <div className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col lg:flex-row lg:items-start gap-6">
              {/* Icon */}
              <Skeleton className="w-20 h-20 rounded-2xl flex-shrink-0" />

              {/* Content */}
              <div className="flex-1 min-w-0 space-y-4">
                {/* Badges */}
                <div className="flex gap-2">
                  <Skeleton className="h-5 w-24 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>

                {/* Title */}
                <Skeleton className="h-9 w-2/3" />

                {/* Description */}
                <div className="space-y-2">
                  <Skeleton className="h-5 w-full max-w-2xl" />
                  <Skeleton className="h-5 w-4/5 max-w-xl" />
                </div>

                {/* Stats */}
                <div className="flex gap-4">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>

                {/* Tags */}
                <div className="flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-6 w-16 rounded-md" />
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-row lg:flex-col gap-3 flex-shrink-0">
                <Skeleton className="h-12 w-28 rounded-lg" />
                <Skeleton className="h-12 w-24 rounded-lg" />
                <Skeleton className="h-12 w-24 rounded-lg" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Bar Skeleton */}
        <div className="bg-gray-50 dark:bg-[#0a0a0a] border-b border-gray-200 dark:border-[#262626]">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex gap-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-4 w-px" />
              <div className="flex items-center gap-3">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Skeleton */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="lg:grid lg:grid-cols-3 lg:gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2 space-y-6">
              {/* Tabs */}
              <div className="border-b border-gray-200 dark:border-[#262626]">
                <div className="flex gap-6">
                  {["Overview", "Reviews", "Comments", "Alternatives"].map(
                    (tab) => (
                      <div
                        key={tab}
                        className="flex items-center gap-2 py-3 px-1"
                      >
                        <Skeleton className="h-4 w-4" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* Tab Content */}
              <div className="space-y-6">
                {/* Long description skeleton */}
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-4/5" />
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-3/4" />
                </div>

                {/* Links section */}
                <div className="space-y-3 pt-4">
                  <Skeleton className="h-6 w-24" />
                  <div className="flex flex-wrap gap-3">
                    <Skeleton className="h-10 w-28 rounded-lg" />
                    <Skeleton className="h-10 w-36 rounded-lg" />
                    <Skeleton className="h-10 w-24 rounded-lg" />
                    <Skeleton className="h-10 w-20 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="mt-8 lg:mt-0 space-y-6">
              {/* Authors Card */}
              <div
                className={cn(
                  "rounded-xl p-5",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <Skeleton className="h-4 w-24 mb-4" />
                <div className="flex items-start gap-3">
                  <Skeleton className="w-10 h-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-3 w-20" />
                    <div className="flex gap-2 pt-1">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Details Card */}
              <div
                className={cn(
                  "rounded-xl p-5",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <Skeleton className="h-4 w-16 mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-4 w-24" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions Card */}
              <div
                className={cn(
                  "rounded-xl p-5",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <Skeleton className="h-4 w-16 mb-4" />
                <div className="space-y-2">
                  <Skeleton className="h-9 w-full rounded-lg" />
                  <Skeleton className="h-9 w-full rounded-lg" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
