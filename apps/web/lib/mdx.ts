import fs from "fs";
import path from "path";

// Content directory path
const contentDirectory = path.join(process.cwd(), "content");

export interface DocMeta {
  title: string;
  description: string;
  slug: string[];
  category: string;
}

export interface DocContent {
  meta: DocMeta;
  content: string;
}

/**
 * Get all MDX file paths recursively
 */
export function getAllDocPaths(): string[][] {
  const paths: string[][] = [];

  function walkDir(dir: string, slugPrefix: string[] = []) {
    if (!fs.existsSync(dir)) return;

    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        walkDir(filePath, [...slugPrefix, file]);
      } else if (file.endsWith(".mdx")) {
        const slug = file.replace(/\.mdx$/, "");
        // Use 'index' files as the directory root
        if (slug === "index") {
          paths.push(slugPrefix);
        } else {
          paths.push([...slugPrefix, slug]);
        }
      }
    }
  }

  walkDir(contentDirectory);
  return paths;
}

/**
 * Get MDX file path from slug
 */
export function getDocFilePath(slug: string[]): string | null {
  // Try exact path first (e.g., getting-started/installation.mdx)
  const exactPath = path.join(contentDirectory, ...slug) + ".mdx";
  if (fs.existsSync(exactPath)) {
    return exactPath;
  }

  // Try index file in directory (e.g., getting-started/index.mdx)
  const indexPath = path.join(contentDirectory, ...slug, "index.mdx");
  if (fs.existsSync(indexPath)) {
    return indexPath;
  }

  return null;
}

/**
 * Check if a doc exists for the given slug
 */
export function docExists(slug: string[]): boolean {
  return getDocFilePath(slug) !== null;
}

/**
 * Get doc metadata from frontmatter
 */
export function extractFrontmatter(content: string): {
  data: Record<string, string>;
  content: string;
} {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { data: {}, content };
  }

  const frontmatter = match[1] ?? "";
  const data: Record<string, string> = {};

  frontmatter.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":");
    if (key && valueParts.length > 0) {
      const value = valueParts.join(":").trim();
      // Remove quotes if present
      data[key.trim()] = value.replace(/^["']|["']$/g, "");
    }
  });

  return {
    data,
    content: content.replace(frontmatterRegex, ""),
  };
}

/**
 * Get all docs metadata for navigation
 */
export function getAllDocsMeta(): DocMeta[] {
  const paths = getAllDocPaths();

  return paths.map((slug) => {
    const filePath = getDocFilePath(slug);
    if (!filePath) {
      return {
        title: slug[slug.length - 1] || "Unknown",
        description: "",
        slug,
        category: slug[0] || "docs",
      };
    }

    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data } = extractFrontmatter(fileContent);

    return {
      title: data.title || formatSlugToTitle(slug[slug.length - 1] || ""),
      description: data.description || "",
      slug,
      category: slug[0] || "docs",
    };
  });
}

/**
 * Format slug to title (e.g., "getting-started" -> "Getting Started")
 */
export function formatSlugToTitle(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/**
 * Get docs by category
 */
export function getDocsByCategory(): Record<string, DocMeta[]> {
  const docs = getAllDocsMeta();
  const categories: Record<string, DocMeta[]> = {};

  docs.forEach((doc) => {
    const category = doc.category;
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category]!.push(doc);
  });

  return categories;
}
