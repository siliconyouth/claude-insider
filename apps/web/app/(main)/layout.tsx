import "@repo/ui/styles.css";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { getLocale, getMessages } from "next-intl/server";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SkipLink } from "@/components/skip-link";
import { ToastProvider } from "@/components/toast";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthModalWrapper, OnboardingModalWrapper } from "@/components/auth";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { I18nProvider } from "@/i18n";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts";
import { UnifiedChatProvider } from "@/components/unified-chat";
import { LazyChatWrapper } from "@/components/unified-chat/lazy-chat-wrapper";
import { AskAIProvider } from "@/components/ask-ai";
import { VoiceAssistantErrorBoundary } from "@/components/voice-assistant-error-boundary";
import { LazyRealtimeProvider } from "@/components/providers/lazy-realtime-provider";
import { VersionUpdatePopup } from "@/components/version-update-popup";
import { LazyFingerprintProvider } from "@/components/providers/lazy-fingerprint-provider";
import { LazyE2EEProvider } from "@/components/providers/lazy-e2ee-provider";
import { NotificationPopup } from "@/components/notifications/notification-popup";
import { AchievementNotificationProvider } from "@/components/achievements/achievement-notification";
import { DonorBadgeProvider } from "@/components/donations/donor-badge-modal";
import { LazySoundProvider } from "@/components/providers/lazy-sound-provider";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PushNotificationPrompt } from "@/components/pwa/push-notification-prompt";
import { MobileBottomNav } from "@/components/mobile";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  preload: true,
  // Adjust fallback font metrics to prevent layout shift
  adjustFontFallback: true,
  // Only load weights actually used (reduces font file size)
  weight: ["400", "500", "600", "700"],
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
  // ============================================
  // Core Metadata
  // ============================================
  title: {
    default: "Claude Insider - Tips, Tricks & Documentation for Claude AI",
    template: "%s | Claude Insider",
  },
  description:
    "Your comprehensive resource for Claude AI documentation, tips, tricks, and configuration guides. 49 features, 1,950+ curated resources, 50+ achievements, E2E encryption. Built with Claude Code powered by Claude Opus 4.5.",
  keywords: [
    // Core brand keywords
    "Claude AI",
    "Claude Code",
    "Claude Code CLI",
    "Anthropic",
    "Claude Opus 4.5",
    "Claude Sonnet 4",
    // Feature keywords
    "AI documentation",
    "Claude tips",
    "Claude tricks",
    "Claude configuration",
    "MCP servers",
    "Model Context Protocol",
    "Claude API",
    "Claude SDK",
    // v1.9.0 features
    "advanced search",
    "boolean search operators",
    "AI assistant",
    "end-to-end encryption",
    "E2EE messaging",
    "achievements",
    "gamification",
    // Use case keywords
    "AI productivity",
    "Claude tutorials",
    "Claude examples",
    "Claude prompts",
    "CLAUDE.md",
    "AI coding assistant",
  ],
  authors: [
    { name: "Vladimir Dukelic", url: "https://github.com/siliconyouth" },
  ],
  creator: "Vladimir Dukelic",
  publisher: "Claude Insider",
  // ============================================
  // URL & Canonical Configuration
  // ============================================
  metadataBase: new URL("https://www.claudeinsider.com"),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/",
      "de-DE": "/?lang=de",
      "fr-FR": "/?lang=fr",
      "es-ES": "/?lang=es",
      "ja-JP": "/?lang=ja",
      "zh-CN": "/?lang=zh",
      "ko-KR": "/?lang=ko",
    },
  },
  // ============================================
  // PWA & App Configuration
  // ============================================
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Claude Insider",
    startupImage: [
      {
        url: "/splash/apple-splash-2048-2732.png",
        media:
          "(device-width: 1024px) and (device-height: 1366px) and (-webkit-device-pixel-ratio: 2)",
      },
    ],
  },
  // ============================================
  // OpenGraph (Facebook, LinkedIn, etc.)
  // ============================================
  openGraph: {
    title: "Claude Insider - Tips, Tricks & Documentation for Claude AI",
    description:
      "Your comprehensive resource for Claude AI documentation. 49 features, 1,950+ curated resources, 50+ achievements, E2E encryption. Built with Claude Code.",
    url: "https://www.claudeinsider.com",
    siteName: "Claude Insider",
    type: "website",
    locale: "en_US",
    alternateLocale: ["de_DE", "fr_FR", "es_ES", "ja_JP", "zh_CN", "ko_KR"],
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "Claude Insider - Your comprehensive resource for Claude AI",
        type: "image/png",
      },
      {
        url: "/og-image-square.png",
        width: 1200,
        height: 1200,
        alt: "Claude Insider Logo",
        type: "image/png",
      },
    ],
  },
  // ============================================
  // Twitter/X Cards
  // ============================================
  twitter: {
    card: "summary_large_image",
    title: "Claude Insider - Tips, Tricks & Documentation for Claude AI",
    description:
      "49 features, 1,950+ curated resources, 50+ achievements. Your comprehensive Claude AI documentation hub.",
    images: ["/og-image.png"],
    creator: "@claudeinsider",
    site: "@claudeinsider",
  },
  // ============================================
  // Search Engine Indexing
  // ============================================
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  // ============================================
  // Verification Tags (add your IDs here)
  // ============================================
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    yandex: process.env.YANDEX_VERIFICATION || undefined,
    // Bing uses a different method - see head section
  },
  // ============================================
  // Additional Metadata
  // ============================================
  category: "Technology",
  classification: "Documentation, Developer Tools, AI",
  referrer: "origin-when-cross-origin",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  // App links for mobile deep linking
  appLinks: {
    web: {
      url: "https://www.claudeinsider.com",
      should_fallback: true,
    },
  },
};

// JSON-LD structured data for rich snippets and knowledge graph
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    // ============================================
    // WebSite Schema - enables sitelinks search box
    // ============================================
    {
      "@type": "WebSite",
      "@id": "https://www.claudeinsider.com/#website",
      url: "https://www.claudeinsider.com",
      name: "Claude Insider",
      description:
        "Your comprehensive resource for Claude AI documentation, tips, tricks, configuration guides, and setup instructions. 45 features, 1,950+ curated resources.",
      publisher: {
        "@id": "https://www.claudeinsider.com/#organization",
      },
      inLanguage: "en-US",
      potentialAction: [
        {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate:
              "https://www.claudeinsider.com/search?q={search_term_string}",
          },
          "query-input": "required name=search_term_string",
        },
      ],
    },
    // ============================================
    // Organization Schema - for knowledge panel
    // ============================================
    {
      "@type": "Organization",
      "@id": "https://www.claudeinsider.com/#organization",
      name: "Claude Insider",
      url: "https://www.claudeinsider.com",
      logo: {
        "@type": "ImageObject",
        url: "https://www.claudeinsider.com/icons/icon-512x512.png",
        width: 512,
        height: 512,
      },
      sameAs: [
        "https://github.com/siliconyouth/claude-insider",
        "https://twitter.com/claudeinsider",
      ],
      founder: {
        "@type": "Person",
        name: "Vladimir Dukelic",
        email: "vladimir@dukelic.com",
        url: "https://github.com/siliconyouth",
      },
      contactPoint: {
        "@type": "ContactPoint",
        email: "vladimir@dukelic.com",
        contactType: "customer support",
        availableLanguage: ["English"],
      },
    },
    // ============================================
    // SoftwareApplication Schema - for app listings
    // ============================================
    {
      "@type": "SoftwareApplication",
      "@id": "https://www.claudeinsider.com/#app",
      name: "Claude Insider",
      description:
        "A comprehensive documentation hub for Claude AI with 45 features, 1,950+ curated resources, AI-powered search, and end-to-end encrypted messaging.",
      url: "https://www.claudeinsider.com",
      applicationCategory: "DeveloperApplication",
      operatingSystem: "Web Browser",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: "4.9",
        ratingCount: "50",
        bestRating: "5",
        worstRating: "1",
      },
      author: {
        "@id": "https://www.claudeinsider.com/#organization",
      },
      screenshot: "https://www.claudeinsider.com/og-image.png",
      featureList: [
        "45 Platform Features",
        "1,950+ Curated Resources",
        "50+ Achievements",
        "Advanced Search with Boolean Operators",
        "End-to-End Encrypted Messaging",
        "AI-Powered Assistant",
        "18 Languages Supported",
        "PWA with Offline Support",
      ],
    },
    // ============================================
    // ItemList Schema - for resource collections
    // ============================================
    {
      "@type": "ItemList",
      "@id": "https://www.claudeinsider.com/#resourceCategories",
      name: "Claude AI Resource Categories",
      description: "Curated collections of tools, documentation, and resources for Claude AI",
      numberOfItems: 10,
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Official Resources",
          url: "https://www.claudeinsider.com/resources/official",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Tools & Extensions",
          url: "https://www.claudeinsider.com/resources/tools",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "MCP Servers",
          url: "https://www.claudeinsider.com/resources/mcp-servers",
        },
        {
          "@type": "ListItem",
          position: 4,
          name: "CLAUDE.md Rules",
          url: "https://www.claudeinsider.com/resources/rules",
        },
        {
          "@type": "ListItem",
          position: 5,
          name: "Prompt Libraries",
          url: "https://www.claudeinsider.com/resources/prompts",
        },
        {
          "@type": "ListItem",
          position: 6,
          name: "AI Agents",
          url: "https://www.claudeinsider.com/resources/agents",
        },
        {
          "@type": "ListItem",
          position: 7,
          name: "Tutorials",
          url: "https://www.claudeinsider.com/resources/tutorials",
        },
        {
          "@type": "ListItem",
          position: 8,
          name: "SDKs & Libraries",
          url: "https://www.claudeinsider.com/resources/sdks",
        },
        {
          "@type": "ListItem",
          position: 9,
          name: "Showcases",
          url: "https://www.claudeinsider.com/resources/showcases",
        },
        {
          "@type": "ListItem",
          position: 10,
          name: "Community",
          url: "https://www.claudeinsider.com/resources/community",
        },
      ],
    },
    // ============================================
    // BreadcrumbList Schema - for navigation
    // ============================================
    {
      "@type": "BreadcrumbList",
      "@id": "https://www.claudeinsider.com/#breadcrumb",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: "https://www.claudeinsider.com",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Documentation",
          item: "https://www.claudeinsider.com/docs",
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Resources",
          item: "https://www.claudeinsider.com/resources",
        },
      ],
    },
  ],
};

export default async function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        {/* Inline script to prevent flash of wrong theme */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  if (theme === 'light') {
                    document.documentElement.classList.add('light');
                  } else if (theme === 'system') {
                    var isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                    document.documentElement.classList.add(isDark ? 'dark' : 'light');
                  } else {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        {/* Preconnect for external services (fonts are self-hosted via next/font) */}
        {/* Supabase - authentication, database, and realtime */}
        <link rel="preconnect" href="https://pmsnjddolwngdeygkcfn.supabase.co" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://pmsnjddolwngdeygkcfn.supabase.co" />
        {/* Vercel Analytics - critical for page load metrics */}
        <link rel="preconnect" href="https://vitals.vercel-insights.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://vitals.vercel-insights.com" />
        {/* Anthropic/ElevenLabs - only dns-prefetch (used on-demand, not initial load) */}
        <link rel="dns-prefetch" href="https://api.anthropic.com" />
        <link rel="dns-prefetch" href="https://api.elevenlabs.io" />

        {/* Favicon and Icons */}
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/favicon-16x16.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="96x96" href="/icons/icon-96x96.png" />
        <link rel="shortcut icon" href="/favicon.ico" />

        {/* Apple Touch Icons */}
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="120x120" href="/icons/icon-120x120.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-167x167.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/apple-touch-icon.png" />

        {/* Safari Pinned Tab */}
        <link rel="mask-icon" href="/icons/safari-pinned-tab.svg" color="#3b82f6" />

        {/* Microsoft Tiles */}
        <meta name="msapplication-TileColor" content="#0a0a0a" />
        <meta name="msapplication-TileImage" content="/icons/icon-144x144.png" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* Search Engine Verification (add your verification codes as env vars) */}
        {process.env.BING_SITE_VERIFICATION && (
          <meta name="msvalidate.01" content={process.env.BING_SITE_VERIFICATION} />
        )}
        {process.env.PINTEREST_VERIFICATION && (
          <meta name="p:domain_verify" content={process.env.PINTEREST_VERIFICATION} />
        )}
        {process.env.FACEBOOK_DOMAIN_VERIFICATION && (
          <meta name="facebook-domain-verification" content={process.env.FACEBOOK_DOMAIN_VERIFICATION} />
        )}

        {/* Additional SEO Meta Tags */}
        <meta name="rating" content="General" />
        <meta name="revisit-after" content="7 days" />
        <meta name="distribution" content="global" />
        <meta name="coverage" content="Worldwide" />
        <meta name="target" content="all" />
        <meta name="HandheldFriendly" content="True" />
        <meta name="MobileOptimized" content="320" />

        {/* Geo Tags for Local SEO */}
        <meta name="geo.region" content="RS" />
        <meta name="geo.placename" content="Serbia" />

        {/* DC (Dublin Core) Metadata for Academic/Library indexing */}
        <meta name="DC.title" content="Claude Insider" />
        <meta name="DC.creator" content="Vladimir Dukelic" />
        <meta name="DC.subject" content="Claude AI, Documentation, Developer Tools" />
        <meta name="DC.description" content="Comprehensive documentation hub for Claude AI" />
        <meta name="DC.publisher" content="Claude Insider" />
        <meta name="DC.type" content="Software" />
        <meta name="DC.format" content="text/html" />
        <meta name="DC.language" content="en" />

        {/* Mobile App Meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Claude Insider" />
        <meta name="application-name" content="Claude Insider" />
        <meta name="format-detection" content="telephone=no" />

        {/* RSS Feeds - Main and Category */}
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - All Documentation" href="/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - Resources" href="/resources/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - Getting Started" href="/docs/getting-started/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - API Reference" href="/docs/api/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - Configuration" href="/docs/configuration/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - Integrations" href="/docs/integrations/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - Tips & Tricks" href="/docs/tips-and-tricks/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - Tutorials" href="/docs/tutorials/feed.xml" />
        <link rel="alternate" type="application/rss+xml" title="Claude Insider - Examples" href="/docs/examples/feed.xml" />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body
        className={`${inter.className} bg-gray-950 text-gray-100 antialiased`}
      >
        <I18nProvider locale={locale} messages={messages}>
          <LazyFingerprintProvider>
            <AuthProvider>
              <LazyRealtimeProvider>
              <LazyE2EEProvider>
              <UnifiedChatProvider>
              <AskAIProvider>
              <KeyboardShortcutsProvider>
              <LazySoundProvider>
                <ToastProvider>
                  <AchievementNotificationProvider>
                  <DonorBadgeProvider>
                    <SkipLink />
                    <ServiceWorkerRegister />
                    {children}
                    <VoiceAssistantErrorBoundary>
                      <LazyChatWrapper />
                    </VoiceAssistantErrorBoundary>
                    <AuthModalWrapper />
                    <OnboardingModalWrapper />
                    <FeedbackButton />
                    <VersionUpdatePopup />
                    <NotificationPopup />
                    <InstallPrompt />
                    <PushNotificationPrompt />
                    <MobileBottomNav />
                    <Analytics />
                    <SpeedInsights />
                  </DonorBadgeProvider>
                  </AchievementNotificationProvider>
                </ToastProvider>
              </LazySoundProvider>
              </KeyboardShortcutsProvider>
              </AskAIProvider>
              </UnifiedChatProvider>
              </LazyE2EEProvider>
              </LazyRealtimeProvider>
            </AuthProvider>
          </LazyFingerprintProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
