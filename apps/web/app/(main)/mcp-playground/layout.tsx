import { Metadata } from 'next';

/**
 * MCP Playground Layout
 *
 * Provides SEO metadata and JSON-LD structured data for the
 * MCP (Model Context Protocol) configuration playground.
 */

export const metadata: Metadata = {
  title: 'MCP Playground - Test & Validate MCP Server Configurations',
  description: 'Interactive playground for testing, validating, and sharing MCP (Model Context Protocol) server configurations. Browse 2,000+ templates and get AI assistance for your Claude configurations.',
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
    description: 'Interactive playground for testing and validating MCP server configurations. 2,000+ templates available.',
    type: 'website',
    siteName: 'Claude Insider',
    url: 'https://www.claudeinsider.com/mcp-playground',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MCP Playground - Claude Insider',
    description: 'Test and validate MCP server configurations for Claude.',
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
      'JSON configuration editor with syntax highlighting',
      'Real-time validation',
      '2,000+ MCP server templates',
      'URL-based config sharing',
      'AI-powered assistance',
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
