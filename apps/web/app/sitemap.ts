import { MetadataRoute } from "next";
import { getAllDocPaths } from "@/lib/mdx";

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

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.claudeinsider.com";

  // Homepage - highest priority
  const homepage: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
  ];

  // Documentation hub pages
  const docsHub: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/docs`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/docs/getting-started`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // Resources section (main + all categories)
  const resourcePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/resources`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    ...RESOURCE_CATEGORY_SLUGS.map((slug) => ({
      url: `${baseUrl}/resources/${slug}`,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
  ];

  // Important public pages
  const publicPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/donate`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/donors`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/users`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.6,
    },
  ];

  // Legal pages (lower priority but important for trust)
  const legalPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/disclaimer`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/accessibility`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  // Dynamic MDX documentation pages
  const docPaths = getAllDocPaths();
  const docPages: MetadataRoute.Sitemap = docPaths
    .filter((slug) => slug.length > 0)
    .map((slug) => ({
      url: `${baseUrl}/docs/${slug.join("/")}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [
    ...homepage,
    ...docsHub,
    ...resourcePages,
    ...publicPages,
    ...legalPages,
    ...docPages,
  ];
}
