/**
 * API Endpoints Section
 *
 * Tests various API endpoints for accessibility.
 */

import type { DiagnosticResult } from "../diagnostics.types";

interface ApiSectionProps {
  apiResults: DiagnosticResult[];
  isLoadingApi: boolean;
  runApiTests: () => void;
  getStatusIcon: (status: DiagnosticResult["status"]) => React.ReactNode;
}

export function ApiSection({
  apiResults,
  isLoadingApi,
  runApiTests,
  getStatusIcon,
}: ApiSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">API Endpoints</h3>
        <button
          onClick={runApiTests}
          disabled={isLoadingApi}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoadingApi ? "Testing..." : "Run Tests"}
        </button>
      </div>

      <div className="space-y-2">
        {apiResults.map((result, i) => (
          <div
            key={i}
            className="p-3 rounded-lg bg-gray-800/50 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              {getStatusIcon(result.status)}
              <span className="text-white">{result.name}</span>
            </div>
            <div className="text-sm text-gray-400">
              {result.message}
              {result.details?.role ? (
                <span className="ml-2 px-2 py-0.5 rounded bg-gray-700 text-xs">
                  Role: {String(result.details.role)}
                </span>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
