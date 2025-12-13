import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { FAQContent } from "@/components/faq/faq-content";
import { cn } from "@/lib/design-system";

export const metadata: Metadata = {
  title: "FAQ - Claude Insider",
  description: "Frequently asked questions about Claude AI, Claude Code, and the Anthropic ecosystem. Find quick answers to common questions.",
};

export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header />

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500/10 via-blue-500/10 to-cyan-500/10 border border-violet-500/20 mb-4">
            <svg
              className="w-4 h-4 text-violet-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z"
              />
            </svg>
            <span className="text-sm font-medium text-violet-600 dark:text-violet-400">Help Center</span>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Frequently Asked Questions</h1>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Quick answers to common questions about Claude AI, Claude Code, and how to get the most out of this
            documentation site.
          </p>
        </div>

        {/* Search hint */}
        <div
          className={cn(
            "mb-8 p-4 rounded-xl text-center",
            "bg-gray-50 dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]"
          )}
        >
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Can&apos;t find what you&apos;re looking for? Try our{" "}
            <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium">⌘⇧K</kbd>{" "}
            AI-powered search or ask our voice assistant directly.
          </p>
        </div>

        {/* FAQ Content */}
        <FAQContent />
      </main>

      <Footer />
    </div>
  );
}
