/**
 * Resources Index Page - Server Component
 *
 * Fetches all resource data server-side with ISR caching,
 * then delegates to client component for interactivity.
 *
 * This hybrid approach provides:
 * - Fast initial load with SSR
 * - Automatic cache invalidation via webhooks
 * - Client-side search and filtering without server round-trips
 */

import { Suspense } from 'react';
import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { ResourceCardSkeleton } from '@/components/resources/resource-card';
import {
  ResourcesPageClient,
  type ResourcesPageClientProps,
} from '@/components/resources/resources-page-client';
import {
  getAllResources,
  getResourceStats,
  getCategoriesWithCounts,
  getPopularTags,
  getDifficultyStats,
  getStatusStats,
  getTargetAudienceStats,
  getUseCasesStats,
  getEnhancedFieldsCoverage,
} from '@/lib/resources/server-queries';

export const metadata: Metadata = {
  title: 'Claude AI Resources | 3,000+ Tools, SDKs, MCP Servers & Tutorials',
  description:
    'Comprehensive directory of Claude AI resources including MCP servers, SDKs, libraries, tutorials, templates, and community tools.',
  openGraph: {
    title: 'Claude AI Resources',
    description: 'Discover 3,000+ curated Claude AI tools, SDKs, and tutorials',
  },
};

// Loading fallback for Suspense
function ResourcesLoading() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="resources" />
      <main id="main-content" className="pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="h-6 w-48 mx-auto bg-gray-200 dark:bg-gray-800 rounded-full animate-pulse mb-4" />
            <div className="h-10 w-80 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
            <div className="h-6 w-96 mx-auto bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <ResourceCardSkeleton key={i} variant="default" />
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

// Async component that fetches data
async function ResourcesDataLoader() {
  // Fetch all data in parallel - ISR cached with webhook invalidation
  const [
    resources,
    stats,
    categories,
    popularTags,
    difficultyStats,
    statusStats,
    audienceStats,
    useCasesStats,
    enhancedCoverage,
  ] = await Promise.all([
    getAllResources(),
    getResourceStats(),
    getCategoriesWithCounts(),
    getPopularTags(30),
    getDifficultyStats(),
    getStatusStats(),
    getTargetAudienceStats(),
    getUseCasesStats(),
    getEnhancedFieldsCoverage(),
  ]);

  // Transform data to match client component props
  const clientProps: ResourcesPageClientProps = {
    initialResources: resources,
    stats,
    categories,
    popularTags,
    difficultyStats,
    statusStats,
    audienceStats,
    useCasesStats,
    enhancedCoverage,
  };

  return <ResourcesPageClient {...clientProps} />;
}

// Main page component wrapped with Suspense
export default function ResourcesPage() {
  return (
    <Suspense fallback={<ResourcesLoading />}>
      <ResourcesDataLoader />
    </Suspense>
  );
}
