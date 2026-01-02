import { Metadata } from 'next';

/**
 * Donate Page Layout
 * Provides SEO metadata for the donation page.
 */

export const metadata: Metadata = {
  title: 'Support Claude Insider - Donate',
  description: 'Support the Claude Insider project with a donation. Help us maintain free documentation, resources, and tools for the Claude AI community.',
  keywords: [
    'donate Claude Insider',
    'support Claude Insider',
    'Claude AI donation',
    'open source donation',
  ].join(', '),
  openGraph: {
    title: 'Support Claude Insider',
    description: 'Help maintain free documentation and resources for the Claude AI community.',
    type: 'website',
    siteName: 'Claude Insider',
    url: 'https://www.claudeinsider.com/donate',
    images: [
      {
        url: 'https://www.claudeinsider.com/api/og?title=Support%20Claude%20Insider&description=Help%20maintain%20free%20Claude%20AI%20resources',
        width: 1200,
        height: 630,
        alt: 'Support Claude Insider',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Support Claude Insider',
    description: 'Help maintain free Claude AI documentation and resources.',
  },
  alternates: {
    canonical: 'https://www.claudeinsider.com/donate',
  },
};

// JSON-LD structured data for donation page
function generateJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@type': 'DonateAction',
    name: 'Donate to Claude Insider',
    description: 'Support the Claude Insider open source project.',
    recipient: {
      '@type': 'Organization',
      name: 'Claude Insider',
      url: 'https://www.claudeinsider.com',
    },
    target: {
      '@type': 'EntryPoint',
      urlTemplate: 'https://www.claudeinsider.com/donate',
    },
  };
}

export default function DonateLayout({
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
