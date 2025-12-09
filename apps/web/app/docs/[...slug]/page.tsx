import { notFound } from "next/navigation";
import { DocsLayout } from "@/components/docs-layout";
import {
  getAllDocPaths,
  getDocFilePath,
  extractFrontmatter,
  formatSlugToTitle,
} from "@/lib/mdx";
import { calculateReadingTime } from "@/lib/reading-time";
import fs from "fs";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

// Navigation structure for sidebars
const navigationConfig: Record<
  string,
  { title: string; items: { label: string; href: string }[] }
> = {
  "getting-started": {
    title: "Getting Started",
    items: [
      { label: "Introduction", href: "/docs/getting-started" },
      { label: "Installation", href: "/docs/getting-started/installation" },
      { label: "Quick Start", href: "/docs/getting-started/quickstart" },
    ],
  },
  configuration: {
    title: "Configuration",
    items: [
      { label: "Overview", href: "/docs/configuration" },
      { label: "CLAUDE.md", href: "/docs/configuration/claude-md" },
      { label: "Settings", href: "/docs/configuration/settings" },
    ],
  },
  "tips-and-tricks": {
    title: "Tips & Tricks",
    items: [
      { label: "Overview", href: "/docs/tips-and-tricks" },
      { label: "Prompting", href: "/docs/tips-and-tricks/prompting" },
      { label: "Productivity", href: "/docs/tips-and-tricks/productivity" },
    ],
  },
  api: {
    title: "API Reference",
    items: [
      { label: "Overview", href: "/docs/api" },
      { label: "Authentication", href: "/docs/api/authentication" },
      { label: "Tool Use", href: "/docs/api/tool-use" },
    ],
  },
  integrations: {
    title: "Integrations",
    items: [
      { label: "Overview", href: "/docs/integrations" },
      { label: "MCP Servers", href: "/docs/integrations/mcp-servers" },
      { label: "IDE Plugins", href: "/docs/integrations/ide-plugins" },
      { label: "Hooks", href: "/docs/integrations/hooks" },
    ],
  },
};

// Generate static paths for all MDX content
export async function generateStaticParams() {
  const paths = getAllDocPaths();
  return paths
    .filter((slug) => slug.length > 0)
    .map((slug) => ({
      slug,
    }));
}

// Generate metadata from frontmatter
export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const filePath = getDocFilePath(slug);

  if (!filePath) {
    return {
      title: "Not Found",
    };
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data } = extractFrontmatter(fileContent);

  return {
    title: data.title
      ? `${data.title} | Claude Insider`
      : "Documentation | Claude Insider",
    description: data.description || "Claude AI documentation and guides",
  };
}

export default async function DocPage({ params }: PageProps) {
  const { slug } = await params;
  const filePath = getDocFilePath(slug);

  if (!filePath) {
    notFound();
  }

  // Read and parse frontmatter
  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = extractFrontmatter(fileContent);

  // Calculate reading time
  const readingTime = calculateReadingTime(content);

  // Determine edit path (relative to repo root)
  const isIndexFile = filePath.endsWith("index.mdx");
  const editPath = isIndexFile
    ? `apps/web/content/${slug.join("/")}/index.mdx`
    : `apps/web/content/${slug.join("/")}.mdx`;

  // Dynamic import of MDX content
  const currentPath = `/docs/${slug.join("/")}`;

  // Build sidebar with all sections, marking active item
  const sidebarSections = Object.values(navigationConfig).map((section) => ({
    ...section,
    items: section.items.map((item) => ({
      ...item,
      active: item.href === currentPath,
    })),
  }));

  // Build breadcrumbs
  const breadcrumbs = [
    { label: "Docs", href: "/docs" },
    ...slug.map((s, i) => ({
      label: formatSlugToTitle(s),
      href: i === slug.length - 1 ? undefined : `/docs/${slug.slice(0, i + 1).join("/")}`,
    })),
  ];

  // Find prev/next pages across all sections
  let prevPage: { label: string; href: string } | undefined;
  let nextPage: { label: string; href: string } | undefined;

  // Flatten all items to find prev/next
  const allItems = Object.values(navigationConfig).flatMap((section) => section.items);
  const currentIndex = allItems.findIndex((item) => item.href === currentPath);

  if (currentIndex > 0) {
    prevPage = {
      label: allItems[currentIndex - 1].label,
      href: allItems[currentIndex - 1].href,
    };
  }
  if (currentIndex < allItems.length - 1 && currentIndex >= 0) {
    nextPage = {
      label: allItems[currentIndex + 1].label,
      href: allItems[currentIndex + 1].href,
    };
  }

  // Import the MDX file dynamically based on the slug
  let MDXContent;
  try {
    // For static generation, we need to use dynamic imports
    const slugPath = slug.join("/");
    MDXContent = (await import(`@/content/${slugPath}.mdx`)).default;
  } catch {
    // Try index file
    try {
      const slugPath = slug.join("/");
      MDXContent = (await import(`@/content/${slugPath}/index.mdx`)).default;
    } catch {
      notFound();
    }
  }

  return (
    <DocsLayout
      title={data.title || formatSlugToTitle(slug[slug.length - 1])}
      description={data.description}
      breadcrumbs={breadcrumbs}
      sidebar={sidebarSections}
      prevPage={prevPage}
      nextPage={nextPage}
      slug={slug}
      readingTime={readingTime.text}
      editPath={editPath}
    >
      <MDXContent />
    </DocsLayout>
  );
}
