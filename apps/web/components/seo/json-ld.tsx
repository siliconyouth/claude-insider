/**
 * JSON-LD Structured Data Components
 *
 * Reusable components for structured data using next-seo.
 * These help search engines understand our content better.
 *
 * @see https://developers.google.com/search/docs/appearance/structured-data
 */

import {
  ArticleJsonLd,
  BreadcrumbJsonLd,
  FAQJsonLd,
  SoftwareApplicationJsonLd,
} from 'next-seo';
import { organizationJsonLd, websiteJsonLd, SEO_CONSTANTS } from '@/lib/seo-config';

const { SITE_URL, SITE_NAME } = SEO_CONSTANTS;

/**
 * Organization and Website JSON-LD for the homepage
 */
export function HomeJsonLd() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
    </>
  );
}

/**
 * Documentation article JSON-LD
 * Note: next-seo ArticleJsonLd doesn't support TechArticle type directly,
 * so we use Article type with tech-focused properties
 */
export function DocArticleJsonLd({
  title,
  description,
  slug,
  category,
  datePublished,
  dateModified,
  wordCount,
}: {
  title: string;
  description: string;
  slug: string;
  category: string;
  datePublished?: string;
  dateModified?: string;
  wordCount?: number;
}) {
  const url = `${SITE_URL}/docs/${slug}`;
  const imageUrl = `${SITE_URL}/api/og/doc?title=${encodeURIComponent(title)}&category=${encodeURIComponent(category)}`;

  // Use manual TechArticle since next-seo doesn't support it
  const techArticleData = {
    '@context': 'https://schema.org',
    '@type': 'TechArticle',
    '@id': url,
    headline: title,
    description,
    url,
    image: imageUrl,
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || new Date().toISOString(),
    author: {
      '@type': 'Person',
      name: 'Vladimir Dukelic',
      url: 'https://www.claudeinsider.com',
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/icons/icon-512x512.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
    articleSection: category,
    isAccessibleForFree: true,
    ...(wordCount && { wordCount }),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(techArticleData) }}
    />
  );
}

/**
 * Resource/Software JSON-LD using SoftwareApplicationJsonLd
 */
export function ResourceJsonLd({
  name,
  description,
  slug,
  category,
  url: externalUrl,
  rating,
  ratingCount,
  applicationCategory,
  operatingSystem = 'Any',
  offers,
}: {
  name: string;
  description: string;
  slug: string;
  category: string;
  url: string;
  rating?: number;
  ratingCount?: number;
  applicationCategory?: string;
  operatingSystem?: string;
  offers?: {
    price: number;
    priceCurrency: string;
  };
}) {
  const pageUrl = `${SITE_URL}/resources/${slug}`;
  const imageUrl = `${SITE_URL}/api/og/resource?title=${encodeURIComponent(name)}&category=${encodeURIComponent(category)}`;

  return (
    <SoftwareApplicationJsonLd
      name={name}
      description={description}
      applicationCategory={applicationCategory || 'DeveloperApplication'}
      operatingSystem={operatingSystem}
      url={externalUrl}
      image={imageUrl}
      {...(rating !== undefined &&
        ratingCount !== undefined && {
          aggregateRating: {
            ratingValue: rating,
            ratingCount: ratingCount,
            bestRating: 5,
          },
        })}
      {...(offers && {
        offers: {
          price: offers.price,
          priceCurrency: offers.priceCurrency,
        },
      })}
    />
  );
}

/**
 * Breadcrumb JSON-LD
 */
export function BreadcrumbsJsonLd({
  items,
}: {
  items: Array<{ name: string; href: string }>;
}) {
  return (
    <BreadcrumbJsonLd
      items={items.map((item) => ({
        name: item.name,
        item: `${SITE_URL}${item.href}`,
      }))}
    />
  );
}

/**
 * FAQ JSON-LD for documentation pages with Q&A
 */
export function DocFAQJsonLd({
  questions,
}: {
  questions: Array<{ question: string; answer: string }>;
}) {
  if (!questions.length) return null;

  return (
    <FAQJsonLd
      questions={questions.map((q) => ({
        question: q.question,
        answer: q.answer,
      }))}
    />
  );
}

/**
 * Web Page JSON-LD for general pages (manual implementation)
 */
export function PageJsonLd({
  title,
  description,
  path,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  path: string;
  datePublished?: string;
  dateModified?: string;
}) {
  const pageData = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${SITE_URL}${path}`,
    name: title,
    description,
    url: `${SITE_URL}${path}`,
    ...(datePublished && { datePublished }),
    ...(dateModified && { dateModified }),
    isPartOf: {
      '@type': 'WebSite',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(pageData) }}
    />
  );
}

/**
 * ItemList JSON-LD for resource listings
 */
export function ResourceListJsonLd({
  resources,
  listName,
  listDescription,
}: {
  resources: Array<{
    name: string;
    slug: string;
    description: string;
    position: number;
  }>;
  listName: string;
  listDescription: string;
}) {
  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: listName,
    description: listDescription,
    numberOfItems: resources.length,
    itemListElement: resources.map((resource) => ({
      '@type': 'ListItem',
      position: resource.position,
      url: `${SITE_URL}/resources/${resource.slug}`,
      name: resource.name,
      description: resource.description,
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
    />
  );
}

/**
 * HowTo JSON-LD for tutorial pages
 */
export function TutorialJsonLd({
  name,
  description,
  totalTime,
  steps,
}: {
  name: string;
  description: string;
  totalTime?: string; // ISO 8601 duration, e.g., "PT15M"
  steps: Array<{
    name: string;
    text: string;
    url?: string;
  }>;
}) {
  const howTo = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name,
    description,
    ...(totalTime && { totalTime }),
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
      ...(step.url && { url: step.url }),
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }}
    />
  );
}
