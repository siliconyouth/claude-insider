/**
 * Individual Resource Page
 *
 * Product Hunt-style page for each resource with full details,
 * reviews, comments, and alternatives.
 */

import { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { cn } from "@/lib/design-system";
import { getResourceBySlug, getAllResourceSlugs } from "@/lib/resources/queries";
import { getCategoryBySlug, type ResourceCategorySlug } from "@/data/resources/schema";
import { ResourceHero } from "@/components/resources/resource-hero";
import { ResourceStats } from "@/components/resources/resource-stats";
import { ResourceTabs } from "@/components/resources/resource-tabs";
import { ResourceSidebar } from "@/components/resources/resource-sidebar";

interface PageProps {
  params: Promise<{ slug: string }>;
}

// Generate static params for all resources
export async function generateStaticParams() {
  const slugs = await getAllResourceSlugs();
  return slugs.map((slug) => ({ slug }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    return {
      title: "Resource Not Found | Claude Insider",
    };
  }

  const title = resource.meta_title || `${resource.title} | Claude Insider Resources`;
  const description = resource.meta_description || resource.description;
  const category = getCategoryBySlug(resource.category as ResourceCategorySlug);

  // Build dynamic OG image URL with resource data
  const ogImageParams = new URLSearchParams({
    title: resource.title,
    description: resource.description.slice(0, 150),
    category: resource.category,
    ...(resource.icon_url && { icon: resource.icon_url }),
    ...(resource.github_stars > 0 && { stars: resource.github_stars.toString() }),
    ...(resource.github_forks > 0 && { forks: resource.github_forks.toString() }),
    pricing: resource.pricing || "free",
    ...(resource.platforms?.[0] && { platform: resource.platforms[0] }),
    ...(resource.average_rating > 0 && { rating: resource.average_rating.toString() }),
    ...(resource.is_featured && { featured: "true" }),
  });
  const dynamicOgImage = `https://www.claudeinsider.com/api/og/resource?${ogImageParams.toString()}`;

  // Use custom OG image if provided, otherwise use dynamic one
  const ogImage = resource.og_image_url || dynamicOgImage;

  return {
    title,
    description,
    keywords: resource.tags.join(", "),
    openGraph: {
      title: resource.title,
      description,
      type: "article",
      url: `https://www.claudeinsider.com/resources/r/${slug}`,
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

export default async function ResourcePage({ params }: PageProps) {
  const { slug } = await params;
  const resource = await getResourceBySlug(slug);

  if (!resource) {
    notFound();
  }

  const category = getCategoryBySlug(resource.category as ResourceCategorySlug);

  // JSON-LD structured data for SEO
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: resource.title,
    description: resource.description,
    url: resource.url,
    applicationCategory: "DeveloperApplication",
    operatingSystem: resource.platforms?.join(", ") || "Cross-platform",
    ...(resource.pricing === "free" || resource.pricing === "open-source"
      ? {
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "USD",
          },
        }
      : {}),
    ...(resource.ratings_count > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: resource.average_rating.toFixed(1),
            ratingCount: resource.ratings_count,
            reviewCount: resource.reviews_count,
          },
        }
      : {}),
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
                  href={`/resources?category=${resource.category}`}
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
