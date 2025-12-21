/**
 * Centralized Database Connection Pool
 *
 * IMPORTANT: This is the ONLY place where a PostgreSQL pool should be created.
 * All modules should import from this file instead of creating their own pools.
 *
 * For Supabase in serverless environments (Vercel):
 * - Use Transaction Pooler (port 6543) for best results
 * - Session Pooler (port 5432) has limited connections (~15-20)
 * - This file auto-converts Session Pooler URLs to Transaction Pooler
 *
 * @example
 * ```ts
 * import { pool } from '@/lib/db';
 *
 * const result = await pool.query('SELECT * FROM users WHERE id = $1', [userId]);
 * ```
 */

import { Pool } from 'pg';

// Singleton pool instance
let poolInstance: Pool | null = null;

// Suppress verbose logging during builds to reduce noise
// Only log in development or when DEBUG_DB is set
const shouldLog = process.env.NODE_ENV === 'development' || process.env.DEBUG_DB === 'true';

/**
 * Convert Session Pooler URL (port 5432) to Transaction Pooler URL (port 6543)
 * Transaction pooler handles serverless much better as it releases connections after each transaction
 */
function getConnectionString(): string {
  const url = process.env.DATABASE_URL || '';

  // Log URL pattern for debugging (without credentials) - only in dev
  if (shouldLog) {
    const safeUrl = url.replace(/\/\/[^@]+@/, '//***@');
    console.log('[DB Pool] URL pattern:', safeUrl);
  }

  // If already using transaction pooler (6543), return as-is
  if (url.includes(':6543')) {
    if (shouldLog) console.log('[DB Pool] Already using Transaction Pooler');
    return url;
  }

  // Convert any Supabase pooler URL with port 5432 to 6543
  // Handles: aws-0-us-east-1.pooler.supabase.com, db.*.supabase.co, etc.
  if (url.includes('supabase') && url.includes(':5432')) {
    const transactionUrl = url.replace(':5432', ':6543');
    if (shouldLog) console.log('[DB Pool] Auto-converted to Transaction Pooler (port 6543)');
    return transactionUrl;
  }

  if (shouldLog) console.log('[DB Pool] Using original URL (no conversion needed)');
  return url;
}

/**
 * Get the shared database pool instance.
 * Creates the pool on first call, returns existing instance on subsequent calls.
 */
function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: getConnectionString(),
      // CRITICAL: Keep pool size minimal for serverless
      // Each Vercel function instance has its own pool
      // With many instances, even max=1 can add up
      max: 1,
      // Release idle connections immediately in serverless
      idleTimeoutMillis: 1000,
      // Don't wait too long for connections
      connectionTimeoutMillis: 5000,
      // SSL required for Supabase in production
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    // Log pool errors (but don't crash)
    poolInstance.on('error', (err) => {
      console.error('[DB Pool] Unexpected error on idle client:', err);
    });
  }

  return poolInstance;
}

// Export the pool getter as a proxy that looks like a Pool
// This ensures lazy initialization
export const pool = new Proxy({} as Pool, {
  get(_, prop) {
    const actualPool = getPool();
    const value = (actualPool as unknown as Record<string | symbol, unknown>)[prop];
    if (typeof value === 'function') {
      return value.bind(actualPool);
    }
    return value;
  },
});

/**
 * For modules that need direct Pool access (like Better Auth)
 * Use this sparingly - prefer the `pool` export
 */
export function getDbPool(): Pool {
  return getPool();
}

/**
 * Helper to execute a query with automatic error handling
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const result = await getPool().query(text, params);
  return result.rows as T[];
}

/**
 * Helper to execute a single-row query
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const result = await getPool().query(text, params);
  return (result.rows[0] as T) || null;
}
