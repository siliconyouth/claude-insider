import { Metadata } from 'next';

/**
 * MCP Playground Layout
 *
 * Provides SEO metadata and JSON-LD structured data for the
 * MCP (Model Context Protocol) configuration playground.
 */

export const metadata: Metadata = {
  title: 'MCP Playground - Test & Validate MCP Server Configurations',
  description: 'Interactive playground for testing, validating, and sharing MCP (Model Context Protocol) server configurations. Browse 2,136+ templates and get AI assistance for your Claude configurations.',
  keywords: [
    'MCP playground',
    'MCP server configuration',
    'Model Context Protocol',
    'Claude MCP',
    'MCP templates',
    'Claude Code MCP',
    'Claude Desktop MCP',
    'MCP validator',
    'MCP config editor',
  ].join(', '),
  openGraph: {
    title: 'MCP Playground - Test MCP Server Configurations',
    description: 'Interactive playground for testing and validating MCP server configurations. 2,136+ templates available.',
    type: 'website',
    siteName: 'Claude Insider',
    url: 'https://www.claudeinsider.com/mcp-playground',
    images: [
      {
        url: 'https://www.claudeinsider.com/api/og?title=MCP%20Playground&description=Build%2C%20validate%2C%20and%20share%20MCP%20server%20configurations',
        width: 1200,
        height: 630,
        alt: 'MCP Playground - Claude Insider',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCP Playground - Claude Insider',
    description: 'Test and validate MCP server configurations for Claude.',
    images: ['https://www.claudeinsider.com/api/og?title=MCP%20Playground&description=Build%2C%20validate%2C%20and%20share%20MCP%20server%20configurations'],
  },
  alternates: {
    canonical: 'https://www.claudeinsider.com/mcp-playground',
  },
  robots: {
    index: true,
    follow: true,
  },
};

// JSON-LD structured data for the playground
function generateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'MCP Playground',
    description: 'Interactive playground for testing and validating MCP (Model Context Protocol) server configurations for Claude AI.',
    url: 'https://www.claudeinsider.com/mcp-playground',
    applicationCategory: 'DeveloperApplication',
    operatingSystem: 'Cross-platform',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    featureList: [
      'Monaco JSON editor with syntax highlighting',
      'Real-time schema validation',
      '2,136+ MCP server templates',
      'URL-based config sharing',
      'Save, publish, and fork configurations',
      'Community gallery with stars and forks',
    ],
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

export default function MCPPlaygroundLayout({
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
