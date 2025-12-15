/**
 * Centralized Database Connection Pool
 *
 * IMPORTANT: This is the ONLY place where a PostgreSQL pool should be created.
 * All modules should import from this file instead of creating their own pools.
 *
 * Supabase's session mode has a limited pool size (typically 15-20 connections).
 * Creating multiple pools across serverless functions quickly exhausts this limit,
 * causing "MaxClientsInSessionMode: max clients reached" errors.
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

/**
 * Get the shared database pool instance.
 * Creates the pool on first call, returns existing instance on subsequent calls.
 */
function getPool(): Pool {
  if (!poolInstance) {
    poolInstance = new Pool({
      connectionString: process.env.DATABASE_URL,
      // Keep pool size small for serverless - Supabase session mode has limits
      max: 3,
      // Release idle connections quickly in serverless environment
      idleTimeoutMillis: 10000,
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
