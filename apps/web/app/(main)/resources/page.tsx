/**
 * Resources Index Page - Server Component (v1.18.5)
 *
 * Hybrid architecture for optimal performance:
 * 1. Server: Loads lean initial data (24 items + stats) - cached under 2MB
 * 2. Client: Fetches full lean list via API for filtering (~1.5MB total)
 * 3. Client-side search and filtering works on the full lean dataset
 *
 * Key optimizations:
 * - Uses ResourceListItem (lean schema) instead of full ResourceEntry
 * - Initial server cache: ~300KB (well under 2MB limit)
 * - API response for full list: ~1.5MB (split across pagination)
 * - Infinite scroll with IntersectionObserver
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
  getResourcePageInitialData,
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
  // Fetch initial data (lean, cached under 2MB) + stats in parallel
  // Initial data includes first 24 resources + stats/categories/tags
  const [
    initialData,
    difficultyStats,
    statusStats,
    audienceStats,
    useCasesStats,
    enhancedCoverage,
  ] = await Promise.all([
    getResourcePageInitialData(),
    getDifficultyStats(),
    getStatusStats(),
    getTargetAudienceStats(),
    getUseCasesStats(),
    getEnhancedFieldsCoverage(),
  ]);

  // Transform data to match client component props
  // Note: Client will fetch full list via API for client-side filtering
  const clientProps: ResourcesPageClientProps = {
    initialResources: initialData.resources,
    stats: initialData.stats,
    categories: initialData.categories,
    popularTags: initialData.popularTags,
    difficultyStats,
    statusStats,
    audienceStats,
    useCasesStats,
    enhancedCoverage,
    // New: Pass total count so client knows to fetch more
    totalResources: initialData.total,
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
