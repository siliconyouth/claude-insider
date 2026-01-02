import { Metadata } from 'next';

/**
 * MCP Gallery Layout
 *
 * Provides SEO metadata for the MCP configuration gallery.
 */

export const metadata: Metadata = {
  title: 'MCP Gallery - Community MCP Server Configurations | Claude Insider',
  description: 'Browse community-shared MCP server configurations for Claude. Star, fork, and discover validated configs for filesystem, database, API, and more.',
  keywords: [
    'MCP gallery',
    'MCP configurations',
    'community MCP',
    'Claude MCP examples',
    'MCP server configs',
    'shared MCP configs',
  ].join(', '),
  openGraph: {
    title: 'MCP Gallery - Community Configurations',
    description: 'Browse and fork community-shared MCP server configurations for Claude.',
    type: 'website',
    siteName: 'Claude Insider',
    url: 'https://www.claudeinsider.com/mcp-playground/gallery',
    images: [
      {
        url: 'https://www.claudeinsider.com/api/og?title=MCP%20Gallery&description=Community%20MCP%20server%20configurations',
        width: 1200,
        height: 630,
        alt: 'MCP Gallery - Claude Insider',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCP Gallery - Claude Insider',
    description: 'Browse community MCP server configurations for Claude.',
    images: ['https://www.claudeinsider.com/api/og?title=MCP%20Gallery&description=Community%20MCP%20server%20configurations'],
  },
  alternates: {
    canonical: 'https://www.claudeinsider.com/mcp-playground/gallery',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for the gallery
function generateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'MCP Configuration Gallery',
    description: 'Community gallery of MCP (Model Context Protocol) server configurations for Claude AI.',
    url: 'https://www.claudeinsider.com/mcp-playground/gallery',
    isPartOf: {
      '@type': 'WebApplication',
      name: 'MCP Playground',
      url: 'https://www.claudeinsider.com/mcp-playground',
    },
    provider: {
      '@type': 'Organization',
      name: 'Claude Insider',
      url: 'https://www.claudeinsider.com',
    },
  };
}

export default function MCPGalleryLayout({
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
