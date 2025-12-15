/**
 * Query Performance Monitor
 *
 * Tracks database query performance and logs slow queries.
 * Provides metrics for diagnostics and optimization.
 */

import "server-only";

interface QueryMetric {
  query: string;
  duration: number;
  timestamp: number;
  success: boolean;
  error?: string;
  rowCount?: number;
}

interface QueryStats {
  totalQueries: number;
  totalDuration: number;
  avgDuration: number;
  slowQueries: number;
  errorCount: number;
  queriesByDuration: {
    fast: number;    // < 50ms
    normal: number;  // 50-200ms
    slow: number;    // 200-500ms
    verySlow: number; // > 500ms
  };
}

// In-memory metrics storage (last 1000 queries)
const metricsStore: QueryMetric[] = [];
const MAX_METRICS = 1000;
const SLOW_QUERY_THRESHOLD_MS = 200;

/**
 * Log a query execution
 */
export function logQuery(metric: QueryMetric): void {
  // Add to store
  metricsStore.push(metric);

  // Trim if over max
  if (metricsStore.length > MAX_METRICS) {
    metricsStore.shift();
  }

  // Log slow queries
  if (metric.duration > SLOW_QUERY_THRESHOLD_MS) {
    const queryPreview = metric.query.substring(0, 100).replace(/\s+/g, " ");
    console.warn(
      `[SLOW QUERY] ${metric.duration}ms: ${queryPreview}${metric.query.length > 100 ? "..." : ""}`
    );
  }

  // Log errors
  if (!metric.success) {
    console.error(`[QUERY ERROR] ${metric.error}: ${metric.query.substring(0, 100)}`);
  }
}

/**
 * Create a monitored query function wrapper
 */
export function createMonitoredQuery<T>(
  queryFn: (sql: string, params?: unknown[]) => Promise<{ rows: T[]; rowCount: number }>
) {
  return async function monitoredQuery(
    sql: string,
    params?: unknown[]
  ): Promise<{ rows: T[]; rowCount: number }> {
    const start = Date.now();
    let success = true;
    let error: string | undefined;
    let rowCount = 0;

    try {
      const result = await queryFn(sql, params);
      rowCount = result.rowCount;
      return result;
    } catch (err) {
      success = false;
      error = err instanceof Error ? err.message : "Unknown error";
      throw err;
    } finally {
      const duration = Date.now() - start;
      logQuery({
        query: sql,
        duration,
        timestamp: start,
        success,
        error,
        rowCount,
      });
    }
  };
}

/**
 * Get query statistics
 */
export function getQueryStats(): QueryStats {
  const now = Date.now();
  const recentMetrics = metricsStore.filter(
    (m) => now - m.timestamp < 3600000 // Last hour
  );

  const totalQueries = recentMetrics.length;
  const totalDuration = recentMetrics.reduce((sum, m) => sum + m.duration, 0);
  const slowQueries = recentMetrics.filter((m) => m.duration > SLOW_QUERY_THRESHOLD_MS).length;
  const errorCount = recentMetrics.filter((m) => !m.success).length;

  const queriesByDuration = {
    fast: recentMetrics.filter((m) => m.duration < 50).length,
    normal: recentMetrics.filter((m) => m.duration >= 50 && m.duration < 200).length,
    slow: recentMetrics.filter((m) => m.duration >= 200 && m.duration < 500).length,
    verySlow: recentMetrics.filter((m) => m.duration >= 500).length,
  };

  return {
    totalQueries,
    totalDuration,
    avgDuration: totalQueries > 0 ? Math.round(totalDuration / totalQueries) : 0,
    slowQueries,
    errorCount,
    queriesByDuration,
  };
}

/**
 * Get slow queries for analysis
 */
export function getSlowQueries(limit: number = 20): QueryMetric[] {
  return [...metricsStore]
    .filter((m) => m.duration > SLOW_QUERY_THRESHOLD_MS)
    .sort((a, b) => b.duration - a.duration)
    .slice(0, limit);
}

/**
 * Get recent errors
 */
export function getQueryErrors(limit: number = 20): QueryMetric[] {
  return [...metricsStore]
    .filter((m) => !m.success)
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
}

/**
 * Clear metrics (for testing)
 */
export function clearMetrics(): void {
  metricsStore.length = 0;
}

/**
 * Get metrics for diagnostics endpoint
 */
export function getDiagnosticsMetrics(): {
  stats: QueryStats;
  slowQueries: QueryMetric[];
  recentErrors: QueryMetric[];
  metricsCount: number;
} {
  return {
    stats: getQueryStats(),
    slowQueries: getSlowQueries(10),
    recentErrors: getQueryErrors(5),
    metricsCount: metricsStore.length,
  };
}

/**
 * Performance threshold configuration
 */
export const QUERY_THRESHOLDS = {
  /** Queries faster than this are considered fast */
  FAST_MS: 50,
  /** Queries slower than this are logged as warnings */
  SLOW_MS: 200,
  /** Queries slower than this are considered critical */
  CRITICAL_MS: 500,
  /** Maximum queries to keep in memory */
  MAX_STORED: MAX_METRICS,
} as const;
