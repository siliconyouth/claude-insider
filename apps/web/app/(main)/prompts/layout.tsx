import { Metadata } from 'next';

/**
 * Prompts Library Layout
 * Provides SEO metadata for the prompts library section.
 */

export const metadata: Metadata = {
  title: 'Prompt Library - Claude AI Prompt Templates',
  description: 'Browse curated prompt templates for Claude AI. Categories include coding, writing, analysis, creativity, and more. Save and customize prompts for your workflow.',
  keywords: [
    'Claude prompts',
    'AI prompt templates',
    'Claude AI prompts',
    'prompt library',
    'system prompts',
    'Claude templates',
  ].join(', '),
  openGraph: {
    title: 'Prompt Library - Claude AI Templates',
    description: 'Curated prompt templates for Claude AI across coding, writing, analysis, and more.',
    type: 'website',
    siteName: 'Claude Insider',
    url: 'https://www.claudeinsider.com/prompts',
    images: [
      {
        url: 'https://www.claudeinsider.com/api/og?title=Prompt%20Library&description=Curated%20Claude%20AI%20prompt%20templates',
        width: 1200,
        height: 630,
        alt: 'Prompt Library - Claude Insider',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Prompt Library - Claude Insider',
    description: 'Curated prompt templates for Claude AI.',
  },
  alternates: {
    canonical: 'https://www.claudeinsider.com/prompts',
  },
};

// JSON-LD structured data
function generateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Prompt Library',
    description: 'Curated collection of prompt templates for Claude AI.',
    url: 'https://www.claudeinsider.com/prompts',
    provider: {
      '@type': 'Organization',
      name: 'Claude Insider',
      url: 'https://www.claudeinsider.com',
    },
    about: {
      '@type': 'SoftwareApplication',
      name: 'Claude AI',
      applicationCategory: 'AI Assistant',
    },
  };
}

export default function PromptsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd()) }}
      />
      {children}
    </>
  );
}
