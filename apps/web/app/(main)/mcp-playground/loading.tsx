/**
 * MCP Playground Loading Skeleton
 *
 * Displays while the main page is loading.
 * Mirrors the layout structure of the actual page.
 */

export default function MCPPlaygroundLoading() {
  return (
    <div className="min-h-screen ui-bg-page">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {/* Header skeleton */}
        <div className="mb-8">
          <div className="h-10 w-64 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
          <div className="mt-2 h-5 w-96 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
        </div>

        {/* Main content grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor section - 2 columns */}
          <div className="lg:col-span-2 space-y-4">
            {/* Toolbar skeleton */}
            <div className="flex items-center gap-2">
              <div className="h-9 w-32 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="h-9 w-24 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
              <div className="ml-auto h-9 w-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>

            {/* Editor skeleton */}
            <div className="ui-bg-card border ui-border rounded-xl overflow-hidden">
              <div className="h-[400px] bg-gray-900 p-4">
                <div className="space-y-2">
                  {/* Deterministic widths to satisfy React purity rule */}
                  {[65, 45, 70, 50, 60, 40, 55, 75, 48, 62, 38, 58].map((width, i) => (
                    <div
                      key={i}
                      className="h-4 bg-gray-800 rounded animate-pulse"
                      style={{ width: `${width}%` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar - 1 column */}
          <div className="space-y-4">
            {/* Validation panel skeleton */}
            <div className="ui-bg-card border ui-border rounded-xl p-4">
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
              <div className="h-20 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse" />
            </div>

            {/* Templates panel skeleton */}
            <div className="ui-bg-card border ui-border rounded-xl p-4">
              <div className="h-6 w-40 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="h-12 bg-gray-200 dark:bg-gray-800 rounded-lg animate-pulse"
                  />
                ))}
              </div>
            </div>

            {/* Schema hints skeleton */}
            <div className="ui-bg-card border ui-border rounded-xl p-4">
              <div className="h-6 w-28 bg-gray-200 dark:bg-gray-800 rounded animate-pulse mb-4" />
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="h-8 bg-gray-200 dark:bg-gray-800 rounded animate-pulse"
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
