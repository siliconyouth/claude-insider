/**
 * Resource Not Found Page
 *
 * Displayed when a resource doesn't exist or is no longer available.
 */

import Link from "next/link";
import { cn } from "@/lib/design-system";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

// Icons
const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M10 19l-7-7m0 0l7-7m-7 7h18"
    />
  </svg>
);

export default function ResourceNotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] flex flex-col">
      <Header activePage="resources" />

      <main id="main-content" className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-lg w-full text-center">
          {/* Icon */}
          <div
            className={cn(
              "w-24 h-24 mx-auto mb-6 rounded-2xl",
              "bg-gradient-to-br from-gray-100 to-gray-200",
              "dark:from-[#1a1a1a] dark:to-[#262626]",
              "border border-gray-200 dark:border-[#333333]",
              "flex items-center justify-center"
            )}
          >
            <span className="text-5xl" role="img" aria-hidden="true">
              📦
            </span>
          </div>

          {/* Title */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Resource Not Found
          </h1>

          {/* Description */}
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
            The resource you&apos;re looking for doesn&apos;t exist, may have been
            removed, or the URL might be incorrect.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/resources"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3",
                "rounded-lg text-sm font-semibold text-white",
                "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600",
                "shadow-lg shadow-blue-500/25",
                "hover:-translate-y-0.5 transition-all duration-200"
              )}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              Browse All Resources
            </Link>

            <Link
              href="/resources?view=search"
              className={cn(
                "inline-flex items-center gap-2 px-6 py-3",
                "rounded-lg text-sm font-medium",
                "bg-white dark:bg-[#111111]",
                "border border-gray-200 dark:border-[#333333]",
                "text-gray-700 dark:text-gray-300",
                "hover:border-blue-500/50 transition-all duration-200"
              )}
            >
              <SearchIcon className="w-4 h-4" />
              Search Resources
            </Link>
          </div>

          {/* Helpful suggestions */}
          <div className="mt-12 p-6 rounded-xl bg-white dark:bg-[#111111] border border-gray-200 dark:border-[#262626]">
            <h2 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
              Popular Categories
            </h2>
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { slug: "official", icon: "🏛️", name: "Official" },
                { slug: "tools", icon: "🛠️", name: "Tools" },
                { slug: "mcp-servers", icon: "🔌", name: "MCP Servers" },
                { slug: "prompts", icon: "💬", name: "Prompts" },
                { slug: "tutorials", icon: "📚", name: "Tutorials" },
              ].map((cat) => (
                <Link
                  key={cat.slug}
                  href={`/resources?category=${cat.slug}`}
                  className={cn(
                    "inline-flex items-center gap-1.5 px-3 py-1.5",
                    "rounded-lg text-sm",
                    "bg-gray-100 dark:bg-[#1a1a1a]",
                    "text-gray-700 dark:text-gray-300",
                    "hover:bg-gray-200 dark:hover:bg-[#262626]",
                    "transition-colors"
                  )}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
