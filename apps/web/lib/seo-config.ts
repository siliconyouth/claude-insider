/**
 * SEO Configuration - Default Settings
 *
 * This file contains the default SEO configuration for Claude Insider.
 * Used for site-wide SEO settings and structured data.
 *
 * @see https://github.com/garmeeh/next-seo
 */

const SITE_URL = 'https://www.claudeinsider.com';
const SITE_NAME = 'Claude Insider';
const SITE_DESCRIPTION =
  'Comprehensive documentation, tips, and guides for Claude AI, Claude Code, and the Anthropic ecosystem. Master AI-powered development with 34 docs and 1,952+ curated resources.';

/**
 * Default SEO configuration applied to all pages
 * Note: These are the recommended defaults - actual implementation
 * is done via Next.js Metadata API in layout.tsx
 */
export const defaultSEO = {
  defaultTitle: SITE_NAME,
  titleTemplate: `%s | ${SITE_NAME}`,
  description: SITE_DESCRIPTION,
  canonical: SITE_URL,
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/api/og`,
        width: 1200,
        height: 630,
        alt: 'Claude Insider - Your Guide to Mastering Claude AI',
        type: 'image/png',
      },
    ],
  },
  twitter: {
    handle: '@claudeinsider',
    site: '@claudeinsider',
    cardType: 'summary_large_image',
  },
  additionalMetaTags: [
    {
      name: 'viewport',
      content: 'width=device-width, initial-scale=1, viewport-fit=cover',
    },
    {
      name: 'apple-mobile-web-app-capable',
      content: 'yes',
    },
    {
      name: 'apple-mobile-web-app-status-bar-style',
      content: 'black-translucent',
    },
    {
      name: 'theme-color',
      content: '#0a0a0a',
    },
    {
      name: 'author',
      content: 'Vladimir Dukelic',
    },
    {
      property: 'og:locale:alternate',
      content: 'de_DE',
    },
    {
      property: 'og:locale:alternate',
      content: 'fr_FR',
    },
    {
      property: 'og:locale:alternate',
      content: 'es_ES',
    },
    {
      property: 'og:locale:alternate',
      content: 'ja_JP',
    },
  ],
  additionalLinkTags: [
    {
      rel: 'icon',
      href: '/icons/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      href: '/icons/apple-touch-icon.png',
      sizes: '180x180',
    },
    {
      rel: 'manifest',
      href: '/manifest.json',
    },
    {
      rel: 'alternate',
      type: 'application/rss+xml',
      href: '/rss.xml',
    },
  ],
};

/**
 * Organization structured data for JSON-LD
 */
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/icons/icon-512x512.png`,
  sameAs: [
    'https://github.com/siliconyouth/claude-insider',
    'https://twitter.com/claudeinsider',
  ],
  contactPoint: {
    '@type': 'ContactPoint',
    email: 'vladimir@dukelic.com',
    contactType: 'customer support',
  },
};

/**
 * Website structured data for JSON-LD
 */
export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
  publisher: {
    '@type': 'Organization',
    name: SITE_NAME,
  },
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/resources?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

/**
 * Helper to generate page-specific SEO config
 */
export function generatePageSEO({
  title,
  description,
  path,
  image,
  noIndex = false,
  article,
}: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
  };
}) {
  const url = `${SITE_URL}${path}`;
  const ogImage = image || `${SITE_URL}/api/og?title=${encodeURIComponent(title)}`;

  return {
    title,
    description,
    canonical: url,
    noindex: noIndex,
    nofollow: noIndex,
    openGraph: {
      title,
      description,
      url,
      type: article ? 'article' : 'website',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      ...(article && {
        article: {
          publishedTime: article.publishedTime,
          modifiedTime: article.modifiedTime,
          authors: article.authors,
          tags: article.tags,
        },
      }),
    },
    twitter: {
      cardType: 'summary_large_image' as const,
    },
  };
}

/**
 * Constants for SEO
 */
export const SEO_CONSTANTS = {
  SITE_URL,
  SITE_NAME,
  SITE_DESCRIPTION,
  TITLE_MAX_LENGTH: 60,
  DESCRIPTION_MAX_LENGTH: 160,
  OG_IMAGE_WIDTH: 1200,
  OG_IMAGE_HEIGHT: 630,
};
