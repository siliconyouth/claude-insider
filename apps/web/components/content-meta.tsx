"use client";

interface Source {
  title: string;
  url: string;
}

interface ContentMetaProps {
  sources: Source[];
  generatedDate: string;
  model?: string;
}

const APP_VERSION = "0.28.10";

export function ContentMeta({
  sources,
  generatedDate,
  model = "Claude Opus 4.5"
}: ContentMetaProps) {
  // Get build ID from environment or use "dev" for local development
  const buildId = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

  return (
    <div className="mt-16 pt-8 border-t border-gray-200 dark:border-gray-800">
      {/* Sources Section */}
      <div className="mb-6">
        <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3 flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
            />
          </svg>
          Sources
        </h4>
        <ul className="space-y-1.5">
          {sources.map((source, index) => (
            <li key={index} className="text-sm">
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-cyan-300 transition-colors inline-flex items-center gap-1"
              >
                {source.title}
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </li>
          ))}
        </ul>
      </div>

      {/* Generation Info */}
      <div className="p-4 bg-gray-100 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-800 rounded-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-blue-600 flex items-center justify-center">
            <svg
              className="w-4 h-4 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              <span className="font-medium">Generated with AI</span> using{" "}
              <a
                href="https://claude.ai"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-cyan-300"
              >
                Claude AI
              </a>{" "}
              by{" "}
              <a
                href="https://anthropic.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-cyan-300"
              >
                Anthropic
              </a>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Model: {model} · Generated: {generatedDate} · Build: v{APP_VERSION}-{buildId}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
