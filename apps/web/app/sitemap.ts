import { MetadataRoute } from "next";
import { getAllDocPaths } from "@/lib/mdx";
import { getAllResourceSlugs } from "@/lib/resources/queries";

// Resource categories for sitemap
const RESOURCE_CATEGORY_SLUGS = [
  "official",
  "tools",
  "mcp-servers",
  "rules",
  "prompts",
  "agents",
  "tutorials",
  "sdks",
  "showcases",
  "community",
];

// Base URL for the site
const BASE_URL = "https://www.claudeinsider.com";

// Default OG image for sharing
const DEFAULT_OG_IMAGE = `${BASE_URL}/og-image.png`;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // ============================================
  // TIER 1: Homepage - Highest priority (1.0)
  // ============================================
  const homepage: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: now,
      changeFrequency: "daily",
      priority: 1.0,
      images: [DEFAULT_OG_IMAGE],
    },
  ];

  // ============================================
  // TIER 2: Core Content Hubs (0.9)
  // ============================================
  const coreHubs: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/docs`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      images: [`${BASE_URL}/og/docs.png`],
    },
    {
      url: `${BASE_URL}/docs/getting-started`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/resources`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      images: [`${BASE_URL}/og/resources.png`],
    },
    {
      url: `${BASE_URL}/prompts`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.9,
      images: [`${BASE_URL}/api/og?title=Prompt%20Library&description=800%2B%20Claude-optimized%20prompts%20across%2018%20categories`],
    },
  ];

  // ============================================
  // TIER 3: Resource Categories (0.85)
  // ============================================
  const resourceCategories: MetadataRoute.Sitemap = RESOURCE_CATEGORY_SLUGS.map(
    (slug) => ({
      url: `${BASE_URL}/resources/${slug}`,
      lastModified: now,
      changeFrequency: "daily" as const,
      priority: 0.85,
    })
  );

  // ============================================
  // TIER 4: Individual Resources & Docs (0.8)
  // ============================================
  const resourceSlugs = await getAllResourceSlugs();
  const individualResources: MetadataRoute.Sitemap = resourceSlugs
    .filter((slug) => !RESOURCE_CATEGORY_SLUGS.includes(slug))
    .map((slug) => ({
      url: `${BASE_URL}/resources/${slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  const docPaths = getAllDocPaths();
  const docPages: MetadataRoute.Sitemap = docPaths
    .filter((slug) => slug.length > 0)
    .map((slug) => ({
      url: `${BASE_URL}/docs/${slug.join("/")}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  // ============================================
  // TIER 4.5: MCP Playground Pages (0.85)
  // ============================================
  const mcpPlaygroundPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/mcp-playground`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.85,
      images: [`${BASE_URL}/api/og?title=MCP%20Playground`],
    },
    {
      url: `${BASE_URL}/mcp-playground/gallery`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.8,
    },
  ];

  // ============================================
  // TIER 5: Community & Feature Pages (0.7)
  // ============================================
  const communityPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/stats`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
      images: [`${BASE_URL}/og/stats.png`],
    },
    {
      url: `${BASE_URL}/users`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/changelog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/search`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/suggestions`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/feed`,
      lastModified: now,
      changeFrequency: "hourly",
      priority: 0.6,
    },
  ];

  // ============================================
  // TIER 6: Donation & Support Pages (0.5-0.6)
  // ============================================
  const donationPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/donate`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/donors`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.5,
    },
  ];

  // ============================================
  // TIER 7: Legal & Compliance Pages (0.3-0.4)
  // ============================================
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/privacy`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/accessibility`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${BASE_URL}/disclaimer`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ];

  // ============================================
  // TIER 8: RSS Feeds (0.2)
  // ============================================
  const feedPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/feed.xml`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/resources/feed.xml`,
      lastModified: now,
      changeFrequency: "daily",
      priority: 0.2,
    },
  ];

  return [
    ...homepage,
    ...coreHubs,
    ...resourceCategories,
    ...individualResources,
    ...docPages,
    ...mcpPlaygroundPages,
    ...communityPages,
    ...donationPages,
    ...legalPages,
    ...feedPages,
  ];
}
