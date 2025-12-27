import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { HeroBackground } from "@/components/hero-background";
import { DeviceShowcase } from "@/components/device-mockups";
import { LazyVoiceAssistantDemo } from "@/components/lazy-voice-assistant-demo";
import { OpenAssistantButton } from "@/components/open-assistant-button";
import { LazyResourcesSection } from "@/components/home/lazy-resources-section";
import { LazyCategoriesSection } from "@/components/home/lazy-categories-section";
import { LazyHighlightsSection } from "@/components/home/lazy-highlights-section";
import { cn } from "@/lib/design-system";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="home" />

      {/* Hero Section - Full viewport height, Stripe-style left-aligned with device mockups */}
      <main id="main-content">
        <div className="relative isolate overflow-hidden min-h-[calc(100vh-4rem)] min-h-[calc(100dvh-4rem)] flex flex-col">
          {/* Animated lens flare background */}
          <HeroBackground className="-z-10" />

          {/* Subtle dot pattern overlay - consistent visibility in both themes */}
          <div className="absolute inset-0 -z-10 pattern-dots opacity-[0.15] dark:opacity-[0.08]" />

          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 flex-1 flex items-center w-full">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full">
              {/* Left side - Text content - prioritized for LCP */}
              <div className="animate-fade-in text-left" style={{ contentVisibility: 'visible', containIntrinsicSize: '0 500px' }}>
                {/* Badge */}
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-600 dark:text-violet-400 text-xs font-medium mb-6">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-violet-500"></span>
                  </span>
                  v1.12.9 • 52 Features • 1,952 Resources • AI Assistant
                </div>

                {/* Headline - Stripe-style large typography */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-gray-900 dark:text-white leading-[1.1]">
                  Master{" "}
                  <span className="gradient-text-stripe">Claude AI</span>
                  <br />
                  development
                </h1>

                {/* Subheadline */}
                <p className="mt-6 text-xl sm:text-2xl leading-relaxed text-gray-700 dark:text-gray-300 max-w-xl">
                  Comprehensive docs, curated resources, and tools for Claude AI.
                  From setup to production-ready applications.
                </p>

                {/* Feature list */}
                <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Dashboard Charts
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Prompt Library
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    50+ Achievements
                  </span>
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    E2E Encrypted
                  </span>
                </div>

                {/* CTA Buttons */}
                <div className="mt-10 flex flex-wrap items-center gap-4">
                  <Link
                    href="/docs/getting-started"
                    className={cn(
                      "rounded-xl px-8 py-4 text-base font-semibold text-white",
                      "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                      "shadow-lg shadow-blue-500/25",
                      "hover:from-violet-500 hover:via-blue-500 hover:to-cyan-500",
                      "hover:shadow-xl hover:shadow-blue-500/30",
                      "hover:-translate-y-0.5",
                      "transition-all duration-200"
                    )}
                  >
                    Getting Started
                  </Link>
                  <Link
                    href="/resources"
                    className={cn(
                      "rounded-xl px-6 py-4 text-base font-semibold",
                      "border-2 border-gray-300 dark:border-[#333]",
                      "text-gray-700 dark:text-gray-300",
                      "bg-white/50 dark:bg-white/5",
                      "hover:border-blue-500/50 hover:bg-blue-500/5",
                      "hover:-translate-y-0.5",
                      "transition-all duration-200",
                      "flex items-center gap-2"
                    )}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                    Browse Resources
                  </Link>
                </div>

                {/* Trust badge */}
                <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
                  v1.12.9 • Built with Claude Code • Powered by Claude Opus 4.5 • Open Source
                </p>
              </div>

              {/* Right side - Device mockups */}
              <div className="relative animate-fade-in lg:animate-slide-in-right hidden sm:block">
                <DeviceShowcase className="w-full" />
              </div>
            </div>
          </div>

          {/* Scroll indicator - hints more content below */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 animate-bounce hidden sm:flex flex-col items-center gap-1 text-gray-400 dark:text-gray-500">
            <span className="text-xs font-medium">Scroll to explore</span>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </div>
        </div>

        {/* Resources Section - lazy loaded for better LCP */}
        <LazyResourcesSection />

        {/* AI Assistant Section - content-visibility for deferred rendering */}
        <div
          className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gradient-to-b from-gray-50 dark:from-[#111111]/50 to-transparent"
          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 600px' }}
        >
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in-up">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-cyan-400 text-sm mb-6">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  New Feature
                </div>
                <h2 className="text-3xl font-bold mb-4 text-gray-900 dark:text-white">
                  Meet the Claude Insider{" "}
                  <span className="gradient-text-stripe">
                    AI Assistant
                  </span>
                </h2>
                <p className="text-gray-600 dark:text-gray-400 text-lg mb-6">
                  Ask questions about Claude AI using voice or text. Get instant answers powered by Claude with premium text-to-speech responses from ElevenLabs.
                </p>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Voice input with Web Speech API
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Premium voices powered by ElevenLabs
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Powered by Claude Sonnet 4 (claude-sonnet-4-20250514)
                  </li>
                  <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300">
                    <svg className="w-5 h-5 text-cyan-500 dark:text-cyan-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Export conversations to clipboard
                  </li>
                </ul>
                <OpenAssistantButton />
              </div>
              <div className="relative animate-fade-in">
                <LazyVoiceAssistantDemo />
              </div>
            </div>
          </div>
        </div>

        {/* Categories Section - lazy loaded for better performance */}
        <LazyCategoriesSection />

        {/* Highlights Section - lazy loaded for better performance */}
        <LazyHighlightsSection />
      </main>

      <Footer />
    </div>
  );
}
