/**
 * Auth Health Check Endpoint
 * Tests database connectivity and auth configuration
 */

import { NextResponse } from 'next/server';
import { Pool } from 'pg';

export async function GET() {
  const diagnostics: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? `${process.env.DATABASE_URL.slice(0, 30)}...` : 'MISSING',
      BETTER_AUTH_SECRET: process.env.BETTER_AUTH_SECRET ? 'SET (hidden)' : 'MISSING',
      BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || 'NOT SET',
      NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'NOT SET',
      NODE_ENV: process.env.NODE_ENV,
    },
    database: {
      status: 'untested',
    },
  };

  // Test database connection
  if (process.env.DATABASE_URL) {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 1,
      connectionTimeoutMillis: 5000,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });

    try {
      const client = await pool.connect();
      const result = await client.query('SELECT current_database(), current_user, version()');
      client.release();
      await pool.end();

      diagnostics.database = {
        status: 'connected',
        database: result.rows[0].current_database,
        user: result.rows[0].current_user,
        version: result.rows[0].version?.split(' ').slice(0, 2).join(' '),
      };

      // Check if Better Auth tables exist
      const tablesPool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 1,
        connectionTimeoutMillis: 5000,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
      });

      try {
        const tablesClient = await tablesPool.connect();
        const tables = await tablesClient.query(`
          SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public'
          AND table_name IN ('user', 'session', 'account', 'verification')
        `);
        tablesClient.release();
        await tablesPool.end();

        diagnostics.betterAuthTables = {
          found: tables.rows.map(r => r.table_name),
          missing: ['user', 'session', 'account', 'verification'].filter(
            t => !tables.rows.find(r => r.table_name === t)
          ),
        };
      } catch (tableError) {
        diagnostics.betterAuthTables = {
          error: tableError instanceof Error ? tableError.message : 'Unknown error',
        };
      }
    } catch (dbError) {
      diagnostics.database = {
        status: 'error',
        error: dbError instanceof Error ? dbError.message : 'Unknown error',
        code: (dbError as { code?: string }).code,
      };
    }
  }

  return NextResponse.json(diagnostics, { status: 200 });
}
