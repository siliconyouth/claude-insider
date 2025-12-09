import { MetadataRoute } from "next";
import { getAllDocPaths } from "@/lib/mdx";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://www.claudeinsider.com";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
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

  // Dynamic MDX pages
  const docPaths = getAllDocPaths();
  const docPages: MetadataRoute.Sitemap = docPaths
    .filter((slug) => slug.length > 0)
    .map((slug) => ({
      url: `${baseUrl}/docs/${slug.join("/")}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));

  return [...staticPages, ...docPages];
}
