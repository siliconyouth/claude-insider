/**
 * Open Graph Image Utilities
 *
 * Helpers for generating dynamic OG images and metadata.
 */

export interface OGImageParams {
  title: string;
  description?: string;
  type?: "default" | "article" | "resource" | "profile";
  category?: string;
  badge?: string;
  author?: string;
  date?: string;
}

/**
 * Generate OG image URL with dynamic parameters
 */
export function getOGImageUrl(params: OGImageParams): string {
  const searchParams = new URLSearchParams();

  searchParams.set("title", params.title);
  if (params.description) searchParams.set("description", params.description);
  if (params.type) searchParams.set("type", params.type);
  if (params.category) searchParams.set("category", params.category);
  if (params.badge) searchParams.set("badge", params.badge);
  if (params.author) searchParams.set("author", params.author);
  if (params.date) searchParams.set("date", params.date);

  return `/api/og?${searchParams.toString()}`;
}

/**
 * Generate comprehensive metadata for a page
 */
export function generatePageMetadata({
  title,
  description,
  path,
  type = "default",
  category,
  author,
  publishedTime,
  modifiedTime,
  tags,
}: {
  title: string;
  description: string;
  path: string;
  type?: "default" | "article" | "resource" | "profile";
  category?: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
}) {
  const baseUrl = "https://www.claudeinsider.com";
  const url = `${baseUrl}${path}`;
  const ogImage = getOGImageUrl({ title, description, type, category, author });

  return {
    title,
    description,
    alternates: {
      canonical: path,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "Claude Insider",
      type: type === "article" ? "article" : "website",
      locale: "en_US",
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(type === "article" && {
        publishedTime,
        modifiedTime,
        authors: author ? [author] : undefined,
        tags,
      }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage],
    },
  };
}

/**
 * Generate JSON-LD structured data for an article
 */
export function generateArticleJsonLd({
  title,
  description,
  path,
  author,
  publishedTime,
  modifiedTime,
  image,
}: {
  title: string;
  description: string;
  path: string;
  author?: string;
  publishedTime?: string;
  modifiedTime?: string;
  image?: string;
}) {
  const baseUrl = "https://www.claudeinsider.com";

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: title,
    description,
    url: `${baseUrl}${path}`,
    image: image || getOGImageUrl({ title, description, type: "article" }),
    datePublished: publishedTime,
    dateModified: modifiedTime || publishedTime,
    author: author
      ? {
          "@type": "Person",
          name: author,
        }
      : {
          "@type": "Organization",
          name: "Claude Insider",
          url: baseUrl,
        },
    publisher: {
      "@type": "Organization",
      name: "Claude Insider",
      url: baseUrl,
      logo: {
        "@type": "ImageObject",
        url: `${baseUrl}/icons/icon-512x512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${baseUrl}${path}`,
    },
  };
}

/**
 * Generate JSON-LD structured data for a resource/software
 */
export function generateSoftwareJsonLd({
  name,
  description,
  url,
  author,
  license,
  programmingLanguage,
  category,
}: {
  name: string;
  description: string;
  url: string;
  author?: string;
  license?: string;
  programmingLanguage?: string;
  category?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name,
    description,
    url,
    applicationCategory: category || "DeveloperApplication",
    operatingSystem: "Cross-platform",
    ...(author && {
      author: {
        "@type": "Person",
        name: author,
      },
    }),
    ...(license && { license }),
    ...(programmingLanguage && { programmingLanguage }),
  };
}
