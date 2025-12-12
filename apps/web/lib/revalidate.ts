/**
 * Revalidation Utility for Payload CMS Hooks
 *
 * Triggers on-demand revalidation when content changes.
 * Called from Payload afterChange/afterDelete hooks.
 */

interface RevalidateOptions {
  collection: string;
  operation: 'create' | 'update' | 'delete';
  id?: number;
  slug?: string;
}

/**
 * Trigger revalidation of cached pages
 *
 * @param options - Revalidation options
 * @returns Promise<boolean> - Success status
 */
export async function triggerRevalidation(options: RevalidateOptions): Promise<boolean> {
  const { collection, operation, id, slug } = options;

  // Get the base URL - in production, this is the live site URL
  // In development, we skip revalidation (pages reload anyway)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;

  if (!baseUrl) {
    console.log('[Revalidate] No base URL configured, skipping revalidation');
    return false;
  }

  const revalidationSecret = process.env.REVALIDATION_SECRET;

  if (!revalidationSecret) {
    console.warn('[Revalidate] REVALIDATION_SECRET not set');
    return false;
  }

  const url = `${baseUrl.startsWith('http') ? baseUrl : `https://${baseUrl}`}/api/revalidate`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidation-secret': revalidationSecret,
      },
      body: JSON.stringify({
        collection,
        operation,
        id,
        slug,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`[Revalidate] Failed: ${response.status} - ${error}`);
      return false;
    }

    const result = await response.json();
    console.log(`[Revalidate] Success: ${result.message}`, result.revalidated);
    return true;
  } catch (error) {
    console.error('[Revalidate] Error:', error);
    return false;
  }
}

/**
 * Create afterChange hook for a collection
 *
 * Usage in collection config:
 * hooks: {
 *   afterChange: [createRevalidateHook('resources')],
 * }
 */
export function createRevalidateHook(collection: string) {
  return async ({ doc, operation }: { doc: { id: number; slug?: string }; operation: 'create' | 'update' }) => {
    // Don't block the response - fire and forget
    triggerRevalidation({
      collection,
      operation,
      id: doc.id,
      slug: doc.slug,
    }).catch(console.error);

    return doc;
  };
}

/**
 * Create afterDelete hook for a collection
 */
export function createDeleteRevalidateHook(collection: string) {
  return async ({ doc }: { doc: { id: number; slug?: string } }) => {
    triggerRevalidation({
      collection,
      operation: 'delete',
      id: doc.id,
      slug: doc.slug,
    }).catch(console.error);

    return doc;
  };
}

/**
 * Create afterChange hook for a global (no id, always update operation)
 *
 * Usage in global config:
 * hooks: {
 *   afterChange: [createGlobalRevalidateHook('site-settings')],
 * }
 */
export function createGlobalRevalidateHook(globalSlug: string) {
  return async ({ doc }: { doc: Record<string, unknown> }) => {
    // Don't block the response - fire and forget
    triggerRevalidation({
      collection: globalSlug,
      operation: 'update',
    }).catch(console.error);

    return doc;
  };
}
