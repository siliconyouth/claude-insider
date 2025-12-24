/**
 * Unified Resource/Category Page
 *
 * Handles both category pages (reserved slugs) and individual resource pages.
 * Reserved slugs: official, tools, mcp-servers, rules, prompts, agents, tutorials, sdks, showcases, community
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import { ResourceCard } from "@/components/resources/resource-card";
import {
  getResourcesByCategory,
  getCategoryBySlug,
  getCategoriesWithCounts,
  RESOURCE_CATEGORIES,
  RESOURCE_CATEGORY_SLUGS,
  type ResourceCategorySlug,
} from "@/data/resources";
import { getResourceBySlug, getAllResourceSlugs } from "@/lib/resources/queries";
import { ResourceHero } from "@/components/resources/resource-hero";
import { ResourceStats } from "@/components/resources/resource-stats";
import { ResourceTabs } from "@/components/resources/resource-tabs";
import { ResourceSidebar } from "@/components/resources/resource-sidebar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Check if slug is a reserved category
function isCategory(slug: string): boolean {
  return RESOURCE_CATEGORY_SLUGS.includes(slug as ResourceCategorySlug);
}

// Generate static params for all categories + all resources
export async function generateStaticParams() {
  // Category slugs
  const categoryParams = RESOURCE_CATEGORIES.map((category) => ({
    slug: category.slug,
  }));

  // Resource slugs
  const resourceSlugs = await getAllResourceSlugs();
  const resourceParams = resourceSlugs
    .filter((slug) => !isCategory(slug)) // Exclude any that match category names
    .map((slug) => ({ slug }));

  return [...categoryParams, ...resourceParams];
}

// Generate metadata based on whether it's a category or resource
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;

  // Check if this is a category
  if (isCategory(slug)) {
    const category = getCategoryBySlug(slug as ResourceCategorySlug);
    if (!category) {
      return { title: "Not Found - Claude Insider" };
    }
    return {
      title: `${category.name} - Claude AI Resources | Claude Insider`,
      description: category.description,
      openGraph: {
        title: `${category.name} - Claude AI Resources`,
        description: category.description,
        type: "website",
      },
    };
  }

  // It's an individual resource
  const resource = await getResourceBySlug(slug);
  if (!resource) {
    return { title: "Resource Not Found | Claude Insider" };
  }

  const title = resource.meta_title || `${resource.title} | Claude Insider Resources`;
  // Use AI summary for description if available
  const description = resource.ai_summary || resource.meta_description || resource.description;
  const category = getCategoryBySlug(resource.category as ResourceCategorySlug);

  // Enhanced keywords from all fields
  const keywords = [
    ...resource.tags,
    ...(resource.target_audience || []),
    ...(resource.use_cases || []).slice(0, 3),
    resource.category,
  ].filter(Boolean).join(", ");

  // Build dynamic OG image URL with enhanced fields
  const ogImageParams = new URLSearchParams({
    title: resource.title,
    description: resource.description.slice(0, 150),
    category: resource.category,
    ...(resource.icon_url && { icon: resource.icon_url }),
    ...(resource.github_stars > 0 && { stars: resource.github_stars.toString() }),
    ...(resource.github_forks > 0 && { forks: resource.github_forks.toString() }),
    pricing: resource.pricing || "free",
    ...(resource.platforms?.[0] && { platform: resource.platforms[0] }),
    ...(Number(resource.average_rating || 0) > 0 && { rating: Number(resource.average_rating).toString() }),
    ...(resource.is_featured && { featured: "true" }),
    // Enhanced fields for OG image
    ...(resource.key_features && resource.key_features.length > 0 && {
      features: resource.key_features.slice(0, 3).join("|"),
    }),
    ...(resource.target_audience && resource.target_audience.length > 0 && {
      audience: resource.target_audience[0],
    }),
    ...(resource.ai_overview && { aiEnhanced: "true" }),
  });
  const dynamicOgImage = `https://www.claudeinsider.com/api/og/resource?${ogImageParams.toString()}`;
  const ogImage = resource.og_image_url || dynamicOgImage;

  return {
    title,
    description,
    keywords,
    openGraph: {
      title: resource.title,
      description,
      type: "article",
      url: `https://www.claudeinsider.com/resources/${slug}`,
      images: [{ url: ogImage, width: 1200, height: 630 }],
    },
    twitter: {
      card: "summary_large_image",
      title: resource.title,
      description,
      images: [ogImage],
    },
    other: {
      "article:section": category?.name || resource.category,
      "article:tag": resource.tags.join(","),
    },
  };
}

// Icons
const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
  </svg>
);

const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
  </svg>
);

export default async function ResourceOrCategoryPage({ params }: PageProps) {
  const { slug } = await params;

  // Route to category page if slug is reserved
  if (isCategory(slug)) {
    return <CategoryPageContent categorySlug={slug as ResourceCategorySlug} />;
  }

  // Otherwise render individual resource page
  return <ResourcePageContent slug={slug} />;
}

// ============================================================================
// CATEGORY PAGE CONTENT
// ============================================================================

async function CategoryPageContent({ categorySlug }: { categorySlug: ResourceCategorySlug }) {
  const category = getCategoryBySlug(categorySlug);

  if (!category) {
    notFound();
  }

  const resources = getResourcesByCategory(categorySlug);
  const allCategories = getCategoriesWithCounts();

  // Find previous and next categories for navigation
  const currentIndex = allCategories.findIndex((c) => c.slug === categorySlug);
  const prevCategory = currentIndex > 0 ? allCategories[currentIndex - 1] : null;
  const nextCategory = currentIndex < allCategories.length - 1 ? allCategories[currentIndex + 1] : null;

  // Get unique tags from this category's resources
  const categoryTags = [...new Set(resources.flatMap((r) => r.tags))].slice(0, 10);

  // Separate featured and regular resources
  const featuredResources = resources.filter((r) => r.featured);
  const regularResources = resources.filter((r) => !r.featured);

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="resources" />

      <main id="main-content" className="pt-8 pb-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8">
            <Link
              href="/resources"
              className="text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
            >
              Resources
            </Link>
            <span className="text-gray-400 dark:text-gray-600">/</span>
            <span className="text-gray-900 dark:text-white font-medium">
              {category.name}
            </span>
          </nav>

          {/* Category Header */}
          <div className="mb-12">
            <div className="flex items-start gap-4 mb-4">
              <div
                className={cn(
                  "flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl",
                  "bg-gradient-to-br from-violet-500/10 via-blue-500/10 to-cyan-500/10"
                )}
              >
                {category.icon}
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                  {category.name}
                </h1>
                <p className="text-gray-600 dark:text-gray-400 mt-2 text-lg">
                  {category.description}
                </p>
              </div>
            </div>

            {/* Category Stats */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <span className="font-semibold text-gray-900 dark:text-white">{resources.length}</span>
                resources
              </div>
              {featuredResources.length > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-semibold text-gray-900 dark:text-white">{featuredResources.length}</span>
                  featured
                </div>
              )}
            </div>

            {/* Category Tags */}
            {categoryTags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4">
                {categoryTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/resources?tag=${encodeURIComponent(tag)}`}
                    className={cn(
                      "px-3 py-1 rounded-full text-xs",
                      "bg-gray-100 dark:bg-gray-800",
                      "text-gray-600 dark:text-gray-400",
                      "hover:bg-gray-200 dark:hover:bg-gray-700",
                      "transition-colors"
                    )}
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Featured Resources */}
          {featuredResources.length > 0 && (
            <div className="mb-12">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                <span className="text-yellow-500">⭐</span>
                Featured in {category.shortName || category.name}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featuredResources.map((resource, index) => (
                  <div
                    key={resource.id}
                    className="animate-fade-in-up"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ResourceCard
                      resource={resource}
                      slug={resource.id}
                      variant="featured"
                      showCategory={false}
                      showTags
                      showInteractions
                      showAskAI
                      maxTags={4}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Resources */}
          <div className="mb-12">
            {featuredResources.length > 0 && (
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                All {category.name}
              </h2>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {regularResources.map((resource, index) => (
                <div
                  key={resource.id}
                  className="animate-fade-in-up"
                  style={{ animationDelay: `${Math.min(index * 30, 300)}ms` }}
                >
                  <ResourceCard
                    resource={resource}
                    slug={resource.id}
                    variant="default"
                    showCategory={false}
                    showTags
                    showInteractions
                    showAskAI
                    maxTags={3}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Category Navigation */}
          <div className="flex items-center justify-between pt-8 border-t border-gray-200 dark:border-[#262626]">
            {prevCategory ? (
              <Link
                href={`/resources/${prevCategory.slug}`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "transition-all duration-200",
                  "hover:border-blue-500/50",
                  "hover:-translate-x-1",
                  "group"
                )}
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Previous</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400">
                    {prevCategory.icon} {prevCategory.shortName || prevCategory.name}
                  </p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            <Link
              href="/resources"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-cyan-400"
            >
              View All Resources
            </Link>

            {nextCategory ? (
              <Link
                href={`/resources/${nextCategory.slug}`}
                className={cn(
                  "flex items-center gap-3 p-4 rounded-xl",
                  "bg-white dark:bg-[#111111]",
                  "border border-gray-200 dark:border-[#262626]",
                  "transition-all duration-200",
                  "hover:border-blue-500/50",
                  "hover:translate-x-1",
                  "group"
                )}
              >
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Next</p>
                  <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-cyan-400">
                    {nextCategory.icon} {nextCategory.shortName || nextCategory.name}
                  </p>
                </div>
                <ArrowRightIcon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
              </Link>
            ) : (
              <div />
            )}
          </div>

          {/* Other Categories */}
          <div className="mt-12 pt-8 border-t border-gray-200 dark:border-[#262626]">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
              Explore Other Categories
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {allCategories
                .filter((c) => c.slug !== categorySlug)
                .map((cat) => (
                  <Link
                    key={cat.slug}
                    href={`/resources/${cat.slug}`}
                    className={cn(
                      "flex flex-col items-center p-4 rounded-xl",
                      "bg-white dark:bg-[#111111]",
                      "border border-gray-200 dark:border-[#262626]",
                      "transition-all duration-200",
                      "hover:border-blue-500/50",
                      "hover:shadow-lg hover:shadow-blue-500/5",
                      "hover:-translate-y-0.5",
                      "group"
                    )}
                  >
                    <span className="text-2xl mb-2 group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white text-center group-hover:text-blue-600 dark:group-hover:text-cyan-400">
                      {cat.shortName || cat.name}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {cat.count} resources
                    </span>
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

// ============================================================================
// RESOURCE PAGE CONTENT
// ============================================================================

async function ResourcePageContent({ slug }: { slug: string }) {
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  const category = getCategoryBySlug(resource.category as ResourceCategorySlug);

  // JSON-LD structured data for SEO (enhanced with Migration 088 fields)
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: resource.title,
    description: resource.ai_summary || resource.description,
    url: resource.url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: resource.platforms?.join(", ") || "Cross-platform",
    // Enhanced fields
    ...(resource.key_features && resource.key_features.length > 0 && {
      featureList: resource.key_features.join(", "),
    }),
    ...(resource.target_audience && resource.target_audience.length > 0 && {
      audience: {
        "@type": "Audience",
        audienceType: resource.target_audience.join(", "),
      },
    }),
    ...(resource.prerequisites && resource.prerequisites.length > 0 && {
      softwareRequirements: resource.prerequisites.join(", "),
    }),
    // Pricing
    ...(resource.pricing === "free" || resource.pricing === "open-source"
      ? {
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }
      : {}),
    // Rating
    ...(resource.ratings_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: Number(resource.average_rating || 0).toFixed(1),
            ratingCount: resource.ratings_count,
            reviewCount: resource.reviews_count,
          },
        }
      : {}),
    // AI-generated review (if available)
    ...(resource.ai_overview && {
      review: {
        "@type": "Review",
        reviewBody: resource.ai_summary || resource.ai_overview.slice(0, 300),
        author: {
          "@type": "Organization",
          name: "Claude Insider AI",
        },
      },
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
        <Header activePage="resources" />

        <main id="main-content" className="flex-1">
          {/* Breadcrumb */}
          <div className="bg-white dark:bg-[#111111] border-b border-gray-200 dark:border-[#262626]">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
              <nav className="flex items-center gap-2 text-sm">
                <Link
                  href="/resources"
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  Resources
                </Link>
                <span className="text-gray-400 dark:text-gray-600">/</span>
                <Link
                  href={`/resources/${resource.category}`}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                >
                  {category?.name || resource.category}
                </Link>
                <span className="text-gray-400 dark:text-gray-600">/</span>
                <span className="text-gray-900 dark:text-white font-medium truncate max-w-[200px]">
                  {resource.title}
                </span>
              </nav>
            </div>
          </div>

          {/* Hero Section */}
          <ResourceHero resource={resource} category={category} />

          {/* Stats Bar */}
          <ResourceStats resource={resource} />

          {/* Main Content */}
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="lg:grid lg:grid-cols-3 lg:gap-8">
              {/* Main Content Area */}
              <div className="lg:col-span-2">
                <ResourceTabs resource={resource} />
              </div>

              {/* Sidebar */}
              <div className="mt-8 lg:mt-0">
                <ResourceSidebar resource={resource} category={category} />
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
}
