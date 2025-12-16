/**
 * Database Connections Section
 *
 * Tests database connectivity for Supabase and direct PostgreSQL pool.
 */

import type { DatabaseCheck } from "../diagnostics.types";

interface DatabaseSectionProps {
  dbResults: DatabaseCheck | null;
  isLoadingDb: boolean;
  runDatabaseDiagnostics: () => void;
}

export function DatabaseSection({
  dbResults,
  isLoadingDb,
  runDatabaseDiagnostics,
}: DatabaseSectionProps) {
  return (
    <section className="rounded-xl border border-gray-800 bg-gray-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-white">
          Database Connections
        </h3>
        <button
          onClick={runDatabaseDiagnostics}
          disabled={isLoadingDb}
          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoadingDb ? "Testing..." : "Run Tests"}
        </button>
      </div>

      {dbResults ? (
        <div className="space-y-4">
          {/* Environment */}
          <div className="p-4 rounded-lg bg-gray-800/50">
            <h4 className="text-sm font-medium text-gray-400 mb-2">
              Environment Variables
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              <div className="flex items-center gap-2">
                {dbResults.env.hasSupabaseUrl ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-red-400">✗</span>
                )}
                <span className="text-gray-300">SUPABASE_URL</span>
              </div>
              <div className="flex items-center gap-2">
                {dbResults.env.hasServiceRoleKey ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-red-400">✗</span>
                )}
                <span className="text-gray-300">SERVICE_ROLE_KEY</span>
              </div>
              <div className="flex items-center gap-2">
                {dbResults.env.hasDatabaseUrl ? (
                  <span className="text-emerald-400">✓</span>
                ) : (
                  <span className="text-red-400">✗</span>
                )}
                <span className="text-gray-300">DATABASE_URL</span>
              </div>
            </div>
          </div>

          {/* Supabase Admin */}
          {dbResults.supabaseAdmin && (
            <div className="p-4 rounded-lg bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Supabase Admin Client
              </h4>
              <div className="flex items-center gap-4">
                {dbResults.supabaseAdmin.success ? (
                  <>
                    <span className="text-emerald-400">✓ Connected</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-white">
                      {dbResults.supabaseAdmin.userCount} users in database
                    </span>
                  </>
                ) : (
                  <span className="text-red-400">
                    ✗ {dbResults.supabaseAdmin.error?.message}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Direct Pool */}
          {dbResults.directPool && (
            <div className="p-4 rounded-lg bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Direct PostgreSQL Pool
              </h4>
              <div className="flex items-center gap-4">
                {dbResults.directPool.success ? (
                  <>
                    <span className="text-emerald-400">✓ Connected</span>
                    <span className="text-gray-400">|</span>
                    <span className="text-white">
                      {dbResults.directPool.userCount} users
                    </span>
                  </>
                ) : (
                  <span className="text-red-400">
                    ✗ {dbResults.directPool.error}
                  </span>
                )}
              </div>
            </div>
          )}

          {/* RLS Status */}
          {dbResults.rlsStatus && (
            <div className="p-4 rounded-lg bg-gray-800/50">
              <h4 className="text-sm font-medium text-gray-400 mb-2">
                Row Level Security (user table)
              </h4>
              <div className="flex items-center gap-2">
                {dbResults.rlsStatus.rlsEnabled ? (
                  <span className="text-yellow-400">
                    ⚠ RLS Enabled (may block queries)
                  </span>
                ) : (
                  <span className="text-emerald-400">
                    ✓ RLS Disabled (full access)
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      ) : isLoadingDb ? (
        <div className="animate-pulse space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-gray-800 rounded-lg" />
          ))}
        </div>
      ) : null}
    </section>
  );
}
