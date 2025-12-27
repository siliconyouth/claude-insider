import { notFound } from "next/navigation";
import { DocsLayout } from "@/components/docs-layout";
import {
  getAllDocPaths,
  getDocFilePath,
  extractFrontmatter,
  formatSlugToTitle,
} from "@/lib/mdx";
import { calculateReadingTime } from "@/lib/reading-time";
import { DocArticleJsonLd, BreadcrumbsJsonLd } from "@/components/seo/json-ld";
import fs from "fs";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string[] }>;
}

// Navigation structure for sidebars
// Last updated: 2025-12-09 - All 7 categories with 34 pages
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
      { label: "Troubleshooting", href: "/docs/getting-started/troubleshooting" },
      { label: "Migration", href: "/docs/getting-started/migration" },
    ],
  },
  configuration: {
    title: "Configuration",
    items: [
      { label: "Overview", href: "/docs/configuration" },
      { label: "CLAUDE.md", href: "/docs/configuration/claude-md" },
      { label: "Settings", href: "/docs/configuration/settings" },
      { label: "Environment", href: "/docs/configuration/environment" },
      { label: "Permissions", href: "/docs/configuration/permissions" },
    ],
  },
  "tips-and-tricks": {
    title: "Tips & Tricks",
    items: [
      { label: "Overview", href: "/docs/tips-and-tricks" },
      { label: "Prompting", href: "/docs/tips-and-tricks/prompting" },
      { label: "Productivity", href: "/docs/tips-and-tricks/productivity" },
      { label: "Advanced Prompting", href: "/docs/tips-and-tricks/advanced-prompting" },
      { label: "Debugging", href: "/docs/tips-and-tricks/debugging" },
    ],
  },
  api: {
    title: "API Reference",
    items: [
      { label: "Overview", href: "/docs/api" },
      { label: "Authentication", href: "/docs/api/authentication" },
      { label: "Tool Use", href: "/docs/api/tool-use" },
      { label: "Streaming", href: "/docs/api/streaming" },
      { label: "Error Handling", href: "/docs/api/error-handling" },
      { label: "Rate Limits", href: "/docs/api/rate-limits" },
      { label: "Models", href: "/docs/api/models" },
    ],
  },
  integrations: {
    title: "Integrations",
    items: [
      { label: "Overview", href: "/docs/integrations" },
      { label: "MCP Servers", href: "/docs/integrations/mcp-servers" },
      { label: "IDE Plugins", href: "/docs/integrations/ide-plugins" },
      { label: "Hooks", href: "/docs/integrations/hooks" },
      { label: "GitHub Actions", href: "/docs/integrations/github-actions" },
      { label: "Docker", href: "/docs/integrations/docker" },
      { label: "Databases", href: "/docs/integrations/databases" },
    ],
  },
  tutorials: {
    title: "Tutorials",
    items: [
      { label: "Overview", href: "/docs/tutorials" },
      { label: "Code Review", href: "/docs/tutorials/code-review" },
      { label: "Documentation Generation", href: "/docs/tutorials/documentation-generation" },
      { label: "Test Generation", href: "/docs/tutorials/test-generation" },
    ],
  },
  examples: {
    title: "Examples",
    items: [
      { label: "Overview", href: "/docs/examples" },
      { label: "Real-World Projects", href: "/docs/examples/real-world-projects" },
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

  const title = data.title || formatSlugToTitle(slug[slug.length - 1] ?? "");
  const description = data.description || "Claude AI documentation and guides";
  const pageUrl = `https://www.claudeinsider.com/docs/${slug.join("/")}`;

  // Dynamic OG image with title and category
  const category = slug[0] ? formatSlugToTitle(slug[0]) : "Documentation";
  const ogImageParams = new URLSearchParams({
    title,
    description: description.slice(0, 100),
    type: "article",
    category,
  });
  const ogImage = `https://www.claudeinsider.com/api/og?${ogImageParams.toString()}`;

  return {
    title: `${title} | Claude Insider`,
    description,
    keywords: [
      "Claude AI",
      "Claude Code",
      category,
      ...slug.map(s => formatSlugToTitle(s)),
    ].join(", "),
    openGraph: {
      title,
      description,
      type: "article",
      url: pageUrl,
      siteName: "Claude Insider",
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
    alternates: {
      canonical: pageUrl,
    },
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

  const prevItem = currentIndex > 0 ? allItems[currentIndex - 1] : undefined;
  if (prevItem) {
    prevPage = {
      label: prevItem.label,
      href: prevItem.href,
    };
  }
  const nextItem = currentIndex < allItems.length - 1 && currentIndex >= 0 ? allItems[currentIndex + 1] : undefined;
  if (nextItem) {
    nextPage = {
      label: nextItem.label,
      href: nextItem.href,
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

  // SEO data for JSON-LD components
  const pageTitle = data.title || formatSlugToTitle(slug[slug.length - 1] ?? "");
  const pageDescription = data.description || "Claude AI documentation and guides";
  const categoryName = slug[0] ? formatSlugToTitle(slug[0]) : "Documentation";

  // Breadcrumb items for JSON-LD
  const breadcrumbItems = [
    { name: "Home", href: "/" },
    { name: "Docs", href: "/docs" },
    ...slug.map((s, i) => ({
      name: formatSlugToTitle(s),
      href: `/docs/${slug.slice(0, i + 1).join("/")}`,
    })),
  ];

  return (
    <>
      {/* Structured data using next-seo components */}
      <DocArticleJsonLd
        title={pageTitle}
        description={pageDescription}
        slug={slug.join("/")}
        category={categoryName}
        datePublished="2025-01-01"
        dateModified={new Date().toISOString().split("T")[0]}
        wordCount={readingTime.words}
      />
      <BreadcrumbsJsonLd items={breadcrumbItems} />
      <DocsLayout
        title={data.title || formatSlugToTitle(slug[slug.length - 1] ?? "")}
        description={data.description}
        breadcrumbs={breadcrumbs}
        sidebar={sidebarSections}
        prevPage={prevPage}
        nextPage={nextPage}
        slug={slug}
        readingTime={readingTime.text}
        editPath={editPath}
        rawContent={content}
      >
        <MDXContent />
      </DocsLayout>
    </>
  );
}
