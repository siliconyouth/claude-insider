import { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { ResourceSubmissionForm } from "@/components/resources/resource-submission-form";
import { cn } from "@/lib/design-system";

export const metadata: Metadata = {
  title: "Submit a Resource | Claude Insider",
  description:
    "Submit a Claude AI resource for addition to our curated directory. Contributions are analyzed by AI and reviewed by our team before publication.",
  openGraph: {
    title: "Submit a Resource | Claude Insider",
    description:
      "Help grow our Claude AI resource directory. Submit tools, MCP servers, tutorials, and more.",
    type: "website",
    siteName: "Claude Insider",
    url: "https://www.claudeinsider.com/resources/submit",
  },
  alternates: {
    canonical: "https://www.claudeinsider.com/resources/submit",
  },
  robots: {
    index: true,
    follow: true,
  },
};

// Icons
const SparklesIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
    />
  </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M5 13l4 4L19 7"
    />
  </svg>
);

const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
    />
  </svg>
);

const ShieldIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
    />
  </svg>
);

export default function SubmitResourcePage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a]">
      <Header activePage="resources" />

      <main className="pt-16 pb-20">
        {/* Hero Section */}
        <div className="relative overflow-hidden border-b border-gray-200 dark:border-[#1a1a1a]">
          {/* Background gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-violet-50 via-blue-50 to-cyan-50 dark:from-violet-950/20 dark:via-blue-950/20 dark:to-cyan-950/20" />
          <div className="absolute inset-0 pattern-dots opacity-[0.15] dark:opacity-[0.05]" />

          <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
            <div className="max-w-3xl">
              {/* Breadcrumb */}
              <nav className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-6">
                <Link
                  href="/resources"
                  className="hover:text-blue-600 dark:hover:text-cyan-400 transition-colors"
                >
                  Resources
                </Link>
                <span>/</span>
                <span className="text-gray-700 dark:text-gray-300">Submit</span>
              </nav>

              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-100 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-800/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-6">
                <SparklesIcon className="w-4 h-4" />
                AI-Powered Review
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-gray-900 dark:text-white leading-tight">
                Submit a{" "}
                <span className="gradient-text-stripe">Resource</span>
              </h1>
              <p className="mt-4 text-lg sm:text-xl text-gray-600 dark:text-gray-400 max-w-2xl">
                Know a great Claude AI tool, MCP server, tutorial, or resource?
                Share it with the community! Your submission will be analyzed by
                AI and reviewed by our team.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Form Column */}
            <div className="lg:col-span-2">
              <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#262626] p-6 sm:p-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
                  Resource Details
                </h2>
                <ResourceSubmissionForm />
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* How It Works */}
              <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#262626] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  How It Works
                </h3>
                <ol className="space-y-4">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center text-xs font-bold">
                      1
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        Submit URL
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Paste the resource URL and add optional details
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">
                      2
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        AI Analysis
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Claude Opus 4.5 extracts and categorizes the resource
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 flex items-center justify-center text-xs font-bold">
                      3
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        Team Review
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Our moderators verify quality and relevance
                      </p>
                    </div>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 flex items-center justify-center text-xs font-bold">
                      4
                    </span>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white text-sm">
                        Published
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Approved resources are added to our directory
                      </p>
                    </div>
                  </li>
                </ol>
              </div>

              {/* What We Accept */}
              <div className="bg-white dark:bg-[#111111] rounded-2xl border border-gray-200 dark:border-[#262626] p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  What We Accept
                </h3>
                <ul className="space-y-2.5">
                  {[
                    "MCP servers & integrations",
                    "Developer tools & SDKs",
                    "Tutorials & guides",
                    "System prompts & templates",
                    "Research papers & articles",
                    "Community projects",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <CheckIcon className="w-4 h-4 text-green-500 flex-shrink-0" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Submission Guidelines */}
              <div className="bg-gradient-to-br from-violet-50 to-blue-50 dark:from-violet-950/30 dark:to-blue-950/30 rounded-2xl border border-violet-200 dark:border-violet-800/30 p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                  Guidelines
                </h3>
                <ul className="space-y-3 text-sm text-gray-700 dark:text-gray-300">
                  <li className="flex items-start gap-2">
                    <ClockIcon className="w-4 h-4 text-violet-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Relevance:</strong> Must be related to Claude AI
                      or Anthropic
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <ShieldIcon className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Quality:</strong> Should be functional and
                      well-maintained
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckIcon className="w-4 h-4 text-cyan-500 mt-0.5 flex-shrink-0" />
                    <span>
                      <strong>Original:</strong> Not a duplicate of existing
                      resources
                    </span>
                  </li>
                </ul>
              </div>

              {/* Rate Limits Info */}
              <div
                className={cn(
                  "p-4 rounded-xl text-sm",
                  "bg-gray-50 dark:bg-[#1a1a1a]",
                  "border border-gray-200 dark:border-[#262626]"
                )}
              >
                <p className="font-medium text-gray-900 dark:text-white mb-1">
                  Submission Limits
                </p>
                <p className="text-gray-600 dark:text-gray-400 text-xs">
                  Anonymous: 1/day • Signed in: 5/day • Verified: 10/day
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
