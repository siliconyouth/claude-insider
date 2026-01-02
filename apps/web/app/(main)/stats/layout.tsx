import { Metadata } from 'next';

/**
 * Community Stats Layout
 * Provides SEO metadata for the community statistics page.
 */

export const metadata: Metadata = {
  title: 'Community Stats - Claude Insider Analytics',
  description: 'View community statistics, leaderboards, popular content, and recent achievements. Track the growth of the Claude Insider community.',
  keywords: [
    'Claude Insider stats',
    'community statistics',
    'Claude community',
    'leaderboard',
    'user achievements',
  ].join(', '),
  openGraph: {
    title: 'Community Stats - Claude Insider',
    description: 'Community statistics, leaderboards, and achievements.',
    type: 'website',
    siteName: 'Claude Insider',
    url: 'https://www.claudeinsider.com/stats',
    images: [
      {
        url: 'https://www.claudeinsider.com/api/og?title=Community%20Stats&description=Leaderboards%2C%20achievements%20%26%20analytics',
        width: 1200,
        height: 630,
        alt: 'Community Stats - Claude Insider',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Community Stats - Claude Insider',
    description: 'Community statistics and leaderboards.',
  },
  alternates: {
    canonical: 'https://www.claudeinsider.com/stats',
  },
};

export default function StatsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
