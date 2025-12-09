import "@repo/ui/styles.css";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SkipLink } from "@/components/skip-link";
import { VoiceAssistant } from "@/components/voice-assistant";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
  ],
};

export const metadata: Metadata = {
  title: "Claude Insider - Tips, Tricks & Documentation for Claude AI",
  description:
    "Your comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions. Built with Claude Code powered by Claude Opus 4.5.",
  keywords: [
    "Claude AI",
    "Claude Code",
    "Anthropic",
    "AI documentation",
    "Claude tips",
    "Claude tricks",
    "Claude configuration",
    "MCP servers",
    "Claude API",
  ],
  authors: [{ name: "Vladimir Dukelic", url: "https://github.com/siliconyouth" }],
  creator: "Vladimir Dukelic",
  publisher: "Claude Insider",
  metadataBase: new URL("https://www.claudeinsider.com"),
  alternates: {
    canonical: "/",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Claude Insider",
  },
  openGraph: {
    title: "Claude Insider - Tips, Tricks & Documentation for Claude AI",
    description:
      "Your comprehensive resource for Claude AI documentation, tips, tricks, and setup instructions.",
    url: "https://www.claudeinsider.com",
    siteName: "Claude Insider",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Claude Insider",
    description:
      "Your comprehensive resource for Claude AI documentation, tips, tricks, and setup instructions.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

// JSON-LD structured data for WebSite and Organization
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": "https://www.claudeinsider.com/#website",
      url: "https://www.claudeinsider.com",
      name: "Claude Insider",
      description:
        "Your comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions.",
      publisher: {
        "@id": "https://www.claudeinsider.com/#organization",
      },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: "https://www.claudeinsider.com/docs?search={search_term_string}",
        },
        "query-input": "required name=search_term_string",
      },
    },
    {
      "@type": "Organization",
      "@id": "https://www.claudeinsider.com/#organization",
      name: "Claude Insider",
      url: "https://www.claudeinsider.com",
      sameAs: ["https://github.com/siliconyouth/claude-insider"],
      founder: {
        "@type": "Person",
        name: "Vladimir Dukelic",
        email: "vladimir@dukelic.com",
        url: "https://github.com/siliconyouth",
      },
    },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="apple-touch-icon" href="/icons/icon-192x192.svg" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider RSS Feed" href="/feed.xml" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}
      >
        <SkipLink />
        <ServiceWorkerRegister />
        {children}
        <VoiceAssistant />
        <Analytics />
      </body>
    </html>
  );
}
