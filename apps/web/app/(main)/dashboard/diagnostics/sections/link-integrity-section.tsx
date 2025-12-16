/**
 * Link Integrity Section
 *
 * Tests all website links and displays results with broken/slow link details.
 */

import { cn } from "@/lib/design-system";
import type { LinkCheckSummary } from "../diagnostics.types";

interface LinkIntegritySectionProps {
  linkCheckResults: LinkCheckSummary | null;
  isLoadingLinkCheck: boolean;
  runLinkCheck: () => void;
}

export function LinkIntegritySection({
  linkCheckResults,
  isLoadingLinkCheck,
  runLinkCheck,
}: LinkIntegritySectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Website Link Integrity
        </h3>
        <button
          onClick={runLinkCheck}
          disabled={isLoadingLinkCheck}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoadingLinkCheck ? "Checking..." : "Check All Links"}
        </button>
      </div>

      {linkCheckResults ? (
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="p-3 rounded-lg bg-gray-800/50 text-center">
              <div className="text-2xl font-bold text-white">
                {linkCheckResults.totalLinks}
              </div>
              <div className="text-xs text-gray-400">Total Links</div>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-center">
              <div className="text-2xl font-bold text-emerald-400">
                {linkCheckResults.successfulLinks}
              </div>
              <div className="text-xs text-emerald-400/70">Successful</div>
            </div>
            <div
              className={cn(
                "p-3 rounded-lg text-center",
                linkCheckResults.failedLinks > 0
                  ? "bg-red-500/10 border border-red-500/30"
                  : "bg-gray-800/50"
              )}
            >
              <div
                className={cn(
                  "text-2xl font-bold",
                  linkCheckResults.failedLinks > 0
                    ? "text-red-400"
                    : "text-gray-400"
                )}
              >
                {linkCheckResults.failedLinks}
              </div>
              <div className="text-xs text-gray-400">Failed</div>
            </div>
            <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-center">
              <div className="text-2xl font-bold text-yellow-400">
                {linkCheckResults.redirects}
              </div>
              <div className="text-xs text-yellow-400/70">Redirects</div>
            </div>
            <div className="p-3 rounded-lg bg-gray-800/50 text-center">
              <div className="text-2xl font-bold text-cyan-400">
                {linkCheckResults.averageResponseTime}ms
              </div>
              <div className="text-xs text-gray-400">Avg Response</div>
            </div>
          </div>

          {/* Broken Links List */}
          {linkCheckResults.brokenLinks.length > 0 && (
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <h4 className="text-sm font-medium text-red-400 mb-3 flex items-center gap-2">
                <span>❌</span>
                Broken Links ({linkCheckResults.brokenLinks.length})
              </h4>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {linkCheckResults.brokenLinks.map((link, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-gray-900/50 rounded text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-red-600 text-white text-xs font-mono">
                        {link.status || "ERR"}
                      </span>
                      <span className="text-gray-300 font-mono">{link.url}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{link.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Slow Links List */}
          {linkCheckResults.slowLinks.length > 0 && (
            <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/30">
              <h4 className="text-sm font-medium text-yellow-400 mb-3 flex items-center gap-2">
                <span>⏱️</span>
                Slow Links (&gt;2s) ({linkCheckResults.slowLinks.length})
              </h4>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {linkCheckResults.slowLinks.map((link, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-gray-900/50 rounded text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded bg-yellow-600 text-white text-xs font-mono">
                        {link.responseTime}ms
                      </span>
                      <span className="text-gray-300 font-mono">{link.url}</span>
                    </div>
                    <span className="text-gray-500 text-xs">{link.category}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* All Links Expandable */}
          <details className="group">
            <summary className="cursor-pointer text-sm text-gray-400 hover:text-white flex items-center gap-2">
              <svg
                className="w-4 h-4 transition-transform group-open:rotate-90"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 5l7 7-7 7"
                />
              </svg>
              View All {linkCheckResults.results.length} Links
            </summary>
            <div className="mt-3 space-y-1 max-h-80 overflow-y-auto">
              {linkCheckResults.results.map((link, i) => (
                <div
                  key={i}
                  className={cn(
                    "flex items-center justify-between p-2 rounded text-xs font-mono",
                    link.status >= 200 &&
                      link.status < 300 &&
                      "bg-emerald-500/5",
                    link.status >= 300 &&
                      link.status < 400 &&
                      "bg-yellow-500/5",
                    (link.status === 0 || link.status >= 400) && "bg-red-500/5"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[10px]",
                        link.status >= 200 &&
                          link.status < 300 &&
                          "bg-emerald-600 text-white",
                        link.status >= 300 &&
                          link.status < 400 &&
                          "bg-yellow-600 text-white",
                        (link.status === 0 || link.status >= 400) &&
                          "bg-red-600 text-white"
                      )}
                    >
                      {link.status || "ERR"}
                    </span>
                    <span className="text-gray-300">{link.url}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-500">
                    <span>{link.responseTime}ms</span>
                    <span className="text-gray-600">|</span>
                    <span>{link.category}</span>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      ) : isLoadingLinkCheck ? (
        <div className="flex items-center justify-center py-8">
          <svg className="animate-spin h-8 w-8 text-blue-500" viewBox="0 0 24 24">
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
              fill="none"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="ml-3 text-gray-400">
            Checking all links (this may take a minute)...
          </span>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">
          Click &quot;Check All Links&quot; to validate all website URLs
        </p>
      )}
    </section>
  );
}
