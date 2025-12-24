import { Metadata } from 'next';
import { getResourceStats, getEnhancedFieldsCoverage, RESOURCE_CATEGORIES } from '@/data/resources';

/**
 * Resources Section Layout
 * Provides base metadata for the resources section
 */

// Get stats at module level for metadata
const stats = getResourceStats();
const coverage = getEnhancedFieldsCoverage();
const featuresPercent = Math.round((coverage.hasKeyFeatures / coverage.total) * 100);

export const metadata: Metadata = {
  title: 'Claude AI Resources - Tools, MCP Servers, SDKs & Tutorials',
  description: `Discover ${stats.totalResources.toLocaleString()} curated Claude AI resources: MCP servers, developer tools, SDKs, system prompts, and tutorials. ${featuresPercent}% include detailed key features. Browse by category, difficulty, or target audience.`,
  keywords: [
    'Claude AI resources',
    'Claude tools',
    'MCP servers',
    'Claude SDKs',
    'Claude tutorials',
    'Claude prompts',
    'Claude integrations',
    'Anthropic Claude',
    'Claude Code',
    'AI development tools',
  ].join(', '),
  openGraph: {
    title: 'Claude AI Resources Directory - Tools, MCP Servers & More',
    description: `${stats.totalResources.toLocaleString()} curated resources for Claude AI developers. MCP servers, tools, SDKs, prompts, and tutorials with filtering by category, difficulty, and audience.`,
    type: 'website',
    siteName: 'Claude Insider',
    url: 'https://www.claudeinsider.com/resources',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Claude AI Resources Directory',
    description: `${stats.totalResources.toLocaleString()} curated resources for Claude AI developers.`,
  },
  alternates: {
    canonical: 'https://www.claudeinsider.com/resources',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Generate JSON-LD structured data
function generateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Claude AI Resources Directory',
    description: `Curated collection of ${stats.totalResources} resources for Claude AI`,
    url: 'https://www.claudeinsider.com/resources',
    mainEntity: {
      '@type': 'ItemList',
      name: 'Resource Categories',
      numberOfItems: RESOURCE_CATEGORIES.length,
      itemListElement: RESOURCE_CATEGORIES.map((cat, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: cat.name,
        url: `https://www.claudeinsider.com/resources?category=${cat.slug}`,
      })),
    },
    provider: {
      '@type': 'Organization',
      name: 'Claude Insider',
      url: 'https://www.claudeinsider.com',
    },
    about: {
      '@type': 'SoftwareApplication',
      name: 'Claude AI',
      applicationCategory: 'AI Assistant',
      operatingSystem: 'Cross-platform',
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.8,
      reviewCount: stats.totalResources,
      bestRating: 5,
      worstRating: 1,
    },
  };
}

export default function ResourcesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const jsonLd = generateJsonLd();

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {children}
    </>
  );
}
