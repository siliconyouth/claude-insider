import { Metadata } from "next";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
// Import generated changelog content (created at build time by generate-changelog-page.cjs)
import { ChangelogContent } from "./changelog-content";

export const metadata: Metadata = {
  title: "Changelog - Claude Insider",
  description: "Version history and release notes for Claude Insider",
};

// Force static generation and revalidation
export const dynamic = "force-static";
export const revalidate = 86400; // Revalidate once per day

export default function ChangelogPage() {
  return (
    <div className="min-h-screen">
      <Header />

      <main id="main-content" className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-4">Changelog</h1>
          <p className="text-gray-400 text-lg">
            All notable changes to Claude Insider are documented here.
          </p>
          <p className="text-gray-500 text-sm mt-2">
            This project adheres to{" "}
            <a
              href="https://semver.org"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-cyan-300"
            >
              Semantic Versioning
            </a>
            .
          </p>
        </div>

        {/* Generated changelog content - all data embedded at build time */}
        <ChangelogContent />

        {/* Link to GitHub */}
        <div className="mt-16 pt-8 border-t border-gray-800">
          <p className="text-gray-400 text-sm">
            View the full changelog on{" "}
            <a
              href="https://github.com/siliconyouth/claude-insider/blob/main/CHANGELOG.md"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-cyan-300"
            >
              GitHub
            </a>
            .
          </p>
        </div>
      </main>

      <div className="mt-16">
        <Footer />
      </div>
    </div>
  );
}
