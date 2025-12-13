/**
 * Supabase Server Client
 *
 * Use this client in server components, API routes, and server actions.
 * Handles cookies for session management with Next.js App Router.
 *
 * @example
 * ```tsx
 * // In a Server Component or API Route
 * import { createClient } from '@/lib/supabase/server';
 *
 * const supabase = await createClient();
 * const { data } = await supabase.from('profiles').select('*');
 * ```
 */

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from '../database.types';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // This will throw in Server Components, which is expected
            // The cookies are set in the middleware or API routes instead
          }
        },
      },
    }
  );
}

/**
 * Create a Supabase admin client with service role key
 * Use this only in trusted server environments for admin operations
 */
export async function createAdminClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore in Server Components
          }
        },
      },
    }
  );
}
