import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';

/**
 * MCP Config Detail Layout
 *
 * Provides dynamic SEO metadata for individual MCP configuration pages.
 * Fetches config name and description for OpenGraph.
 */

interface Props {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;

  // Fetch config details for SEO
  let configName = 'MCP Configuration';
  let configDescription = 'View and fork this MCP server configuration for Claude.';
  let authorName = 'Claude Insider User';

  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from('mcp_configs')
      .select('name, description, user:user_id(name)')
      .eq('id', id)
      .eq('status', 'published')
      .single();

    if (data) {
      configName = data.name || configName;
      configDescription = data.description || configDescription;
      if (data.user && typeof data.user === 'object' && 'name' in data.user) {
        authorName = (data.user as { name: string }).name || authorName;
      }
    }
  } catch {
    // Use defaults if fetch fails
  }

  const title = `${configName} - MCP Gallery | Claude Insider`;
  const ogImageUrl = `https://www.claudeinsider.com/api/og?title=${encodeURIComponent(configName)}&description=${encodeURIComponent(configDescription.slice(0, 100))}`;

  return {
    title,
    description: configDescription,
    openGraph: {
      title: configName,
      description: configDescription,
      type: 'article',
      siteName: 'Claude Insider',
      url: `https://www.claudeinsider.com/mcp-playground/gallery/${id}`,
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: configName,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: configName,
      description: configDescription,
      images: [ogImageUrl],
    },
    alternates: {
      canonical: `https://www.claudeinsider.com/mcp-playground/gallery/${id}`,
    },
    robots: {
      index: true,
      follow: true,
    },
    authors: [{ name: authorName }],
  };
}

// JSON-LD structured data
function generateJsonLd(id: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareSourceCode',
    codeRepository: `https://www.claudeinsider.com/mcp-playground/gallery/${id}`,
    programmingLanguage: 'JSON',
    targetProduct: {
      '@type': 'SoftwareApplication',
      name: 'Claude AI',
      applicationCategory: 'AI Assistant',
    },
    isPartOf: {
      '@type': 'CollectionPage',
      name: 'MCP Configuration Gallery',
      url: 'https://www.claudeinsider.com/mcp-playground/gallery',
    },
  };
}

export default async function MCPConfigDetailLayout({ params, children }: Props) {
  const { id } = await params;

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(generateJsonLd(id)) }}
      />
      {children}
    </>
  );
}
