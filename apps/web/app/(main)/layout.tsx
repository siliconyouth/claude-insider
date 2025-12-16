import "@repo/ui/styles.css";
import "../globals.css";
import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { getLocale, getMessages } from "next-intl/server";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { SkipLink } from "@/components/skip-link";
import { ToastProvider } from "@/components/toast";
import { AuthProvider } from "@/components/providers/auth-provider";
import { AuthModalWrapper, OnboardingModalWrapper } from "@/components/auth";
import { FeedbackButton } from "@/components/feedback/feedback-button";
import { I18nProvider } from "@/i18n";
import { KeyboardShortcutsProvider } from "@/components/keyboard-shortcuts";
import { UnifiedChatProvider, UnifiedChatWindow, FloatingChatButton } from "@/components/unified-chat";
import { AskAIProvider } from "@/components/ask-ai";
import { VoiceAssistantErrorBoundary } from "@/components/voice-assistant-error-boundary";
import { VersionUpdatePopup } from "@/components/version-update-popup";
import { FingerprintProvider } from "@/components/providers/fingerprint-provider";
import { E2EEProvider } from "@/components/providers/e2ee-provider";
import { NotificationPopup } from "@/components/notifications/notification-popup";
import { AchievementNotificationProvider } from "@/components/achievements/achievement-notification";
import { DonorBadgeProvider } from "@/components/donations/donor-badge-modal";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import { PushNotificationPrompt } from "@/components/pwa/push-notification-prompt";

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
        {/* DNS Prefetch and Preconnect */}
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

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

        {/* Mobile App Meta */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Claude Insider" />
        <meta name="application-name" content="Claude Insider" />
        <meta name="format-detection" content="telephone=no" />

        {/* RSS Feed */}
        <link rel="alternate" type="application/rss+xml" title="Claude Insider RSS Feed" href="/feed.xml" />

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
          <FingerprintProvider>
            <AuthProvider>
              <E2EEProvider>
              <UnifiedChatProvider>
              <AskAIProvider>
              <KeyboardShortcutsProvider>
                <ToastProvider>
                  <AchievementNotificationProvider>
                  <DonorBadgeProvider>
                    <SkipLink />
                    <ServiceWorkerRegister />
                    {children}
                    <VoiceAssistantErrorBoundary>
                      <UnifiedChatWindow />
                      <FloatingChatButton />
                    </VoiceAssistantErrorBoundary>
                    <AuthModalWrapper />
                    <OnboardingModalWrapper />
                    <FeedbackButton />
                    <VersionUpdatePopup />
                    <NotificationPopup />
                    <InstallPrompt />
                    <PushNotificationPrompt />
                    <Analytics />
                  </DonorBadgeProvider>
                  </AchievementNotificationProvider>
                </ToastProvider>
              </KeyboardShortcutsProvider>
              </AskAIProvider>
              </UnifiedChatProvider>
              </E2EEProvider>
            </AuthProvider>
          </FingerprintProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
