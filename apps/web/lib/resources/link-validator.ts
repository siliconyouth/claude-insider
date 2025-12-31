/**
 * Link Validator Module
 *
 * Validates resource URLs and manages the broken link queue.
 * - Checks HTTP status codes for all resource URLs
 * - Tracks consecutive failures before flagging as broken
 * - Auto-queues broken links for moderation review
 * - Supports batch validation with rate limiting
 */

import { Pool } from "pg";

export interface ValidationResult {
  resourceId: string;
  url: string;
  isValid: boolean;
  statusCode: number | null;
  redirectUrl: string | null;
  errorMessage: string | null;
  responseTimeMs: number;
}

export interface ValidationStats {
  total: number;
  valid: number;
  invalid: number;
  redirects: number;
  errors: number;
  avgResponseTime: number;
}

export interface BrokenLinkEntry {
  id: string;
  resourceId: string;
  resourceTitle: string;
  resourceSlug: string;
  originalUrl: string;
  statusCode: number | null;
  errorMessage: string | null;
  suggestedUrl: string | null;
  status: "pending" | "reviewing" | "fixed" | "hidden" | "dismissed";
  createdAt: Date;
}

/**
 * Get appropriate headers for a URL
 * Some sites (npm, etc.) block bot-like User-Agents, so we use browser-like headers
 */
function getHeadersForUrl(url: string): Record<string, string> {
  const browserUserAgent =
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

  // Sites that require browser-like headers to avoid 403
  const requiresBrowserHeaders =
    url.includes("npmjs.com") ||
    url.includes("registry.npmjs.org") ||
    url.includes("perplexity.ai") ||
    url.includes("console.anthropic.com");

  if (requiresBrowserHeaders) {
    return {
      "User-Agent": browserUserAgent,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.5",
      "Accept-Encoding": "gzip, deflate, br",
      Connection: "keep-alive",
      "Upgrade-Insecure-Requests": "1",
      "Sec-Fetch-Dest": "document",
      "Sec-Fetch-Mode": "navigate",
      "Sec-Fetch-Site": "none",
      "Sec-Fetch-User": "?1",
    };
  }

  // Default headers for other sites
  return {
    "User-Agent":
      "ClaudeInsider-LinkValidator/1.0 (https://www.claudeinsider.com)",
    Accept: "*/*",
  };
}

/**
 * Validate a single URL with timeout and redirect detection
 */
export async function validateUrl(
  url: string,
  timeoutMs: number = 10000
): Promise<Omit<ValidationResult, "resourceId">> {
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Use GET for sites that don't like HEAD requests (npm, etc.)
    const useGetMethod =
      url.includes("npmjs.com") || url.includes("registry.npmjs.org");

    const response = await fetch(url, {
      method: useGetMethod ? "GET" : "HEAD",
      signal: controller.signal,
      redirect: "manual", // Don't follow redirects automatically
      headers: getHeadersForUrl(url),
    });

    clearTimeout(timeoutId);
    const responseTimeMs = Date.now() - startTime;

    // Handle redirects
    if (response.status >= 300 && response.status < 400) {
      const redirectUrl = response.headers.get("location");

      // Check if redirect is valid
      if (redirectUrl) {
        // Validate the redirect target
        const redirectResult = await validateRedirectTarget(
          redirectUrl,
          url,
          timeoutMs
        );
        return {
          url,
          isValid: redirectResult.isValid,
          statusCode: response.status,
          redirectUrl,
          errorMessage: redirectResult.errorMessage,
          responseTimeMs,
        };
      }
    }

    // Check for successful status codes
    const isValid = response.status >= 200 && response.status < 300;

    return {
      url,
      isValid,
      statusCode: response.status,
      redirectUrl: null,
      errorMessage: isValid ? null : `HTTP ${response.status}`,
      responseTimeMs,
    };
  } catch (error) {
    const responseTimeMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";

    // Categorize errors
    let friendlyError = errorMessage;
    if (errorMessage.includes("abort")) {
      friendlyError = `Request timeout (${timeoutMs}ms)`;
    } else if (
      errorMessage.includes("ENOTFOUND") ||
      errorMessage.includes("getaddrinfo")
    ) {
      friendlyError = "Domain not found (DNS error)";
    } else if (errorMessage.includes("ECONNREFUSED")) {
      friendlyError = "Connection refused";
    } else if (errorMessage.includes("certificate")) {
      friendlyError = "SSL certificate error";
    }

    return {
      url,
      isValid: false,
      statusCode: null,
      redirectUrl: null,
      errorMessage: friendlyError,
      responseTimeMs,
    };
  }
}

/**
 * Validate a redirect target URL
 */
async function validateRedirectTarget(
  redirectUrl: string,
  originalUrl: string,
  timeoutMs: number
): Promise<{ isValid: boolean; errorMessage: string | null }> {
  try {
    // Handle relative redirects
    let absoluteUrl = redirectUrl;
    if (redirectUrl.startsWith("/")) {
      const originalUrlObj = new URL(originalUrl);
      absoluteUrl = `${originalUrlObj.protocol}//${originalUrlObj.host}${redirectUrl}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    // Use GET for sites that don't like HEAD requests
    const useGetMethod =
      absoluteUrl.includes("npmjs.com") ||
      absoluteUrl.includes("registry.npmjs.org");

    const response = await fetch(absoluteUrl, {
      method: useGetMethod ? "GET" : "HEAD",
      signal: controller.signal,
      redirect: "follow", // Follow further redirects
      headers: getHeadersForUrl(absoluteUrl),
    });

    clearTimeout(timeoutId);

    if (response.status >= 200 && response.status < 300) {
      return { isValid: true, errorMessage: null };
    }

    return {
      isValid: false,
      errorMessage: `Redirect leads to HTTP ${response.status}`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return {
      isValid: false,
      errorMessage: `Redirect target error: ${errorMessage}`,
    };
  }
}

/**
 * Validate a resource and update the database
 */
export async function validateResource(
  pool: Pool,
  resourceId: string,
  url: string
): Promise<ValidationResult> {
  const result = await validateUrl(url);

  // Upsert validation result
  await pool.query(
    `
    INSERT INTO resource_link_validations (
      resource_id, url, status_code, is_valid, redirect_url,
      error_message, response_time_ms, last_checked_at, check_count, consecutive_failures
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), 1, $8)
    ON CONFLICT (resource_id)
    DO UPDATE SET
      url = EXCLUDED.url,
      status_code = EXCLUDED.status_code,
      is_valid = EXCLUDED.is_valid,
      redirect_url = EXCLUDED.redirect_url,
      error_message = EXCLUDED.error_message,
      response_time_ms = EXCLUDED.response_time_ms,
      last_checked_at = NOW(),
      check_count = resource_link_validations.check_count + 1,
      consecutive_failures = CASE
        WHEN EXCLUDED.is_valid THEN 0
        ELSE resource_link_validations.consecutive_failures + 1
      END
  `,
    [
      resourceId,
      url,
      result.statusCode,
      result.isValid,
      result.redirectUrl,
      result.errorMessage,
      result.responseTimeMs,
      result.isValid ? 0 : 1,
    ]
  );

  return { resourceId, ...result };
}

/**
 * Batch validate resources with rate limiting
 */
export async function validateResourcesBatch(
  pool: Pool,
  options: {
    limit?: number;
    batchSize?: number;
    delayBetweenBatches?: number;
    onlyUnchecked?: boolean;
    onlyStale?: boolean; // Resources not checked in 24h
    onlyBroken?: boolean; // Re-validate currently broken links
  } = {}
): Promise<ValidationStats> {
  const {
    limit = 100,
    batchSize = 10,
    delayBetweenBatches = 2000,
    onlyUnchecked = false,
    onlyStale = false,
    onlyBroken = false,
  } = options;

  // Build query based on options
  let whereClause = "WHERE r.is_published = true AND r.url IS NOT NULL";
  let orderClause = "ORDER BY COALESCE(r.link_last_validated_at, '1970-01-01') ASC";

  if (onlyBroken) {
    // Re-validate resources currently marked as broken
    whereClause +=
      " AND EXISTS (SELECT 1 FROM resource_link_validations v WHERE v.resource_id = r.id AND v.is_valid = false)";
    orderClause = "ORDER BY r.link_last_validated_at DESC"; // Most recently broken first
  } else if (onlyUnchecked) {
    whereClause +=
      " AND NOT EXISTS (SELECT 1 FROM resource_link_validations v WHERE v.resource_id = r.id)";
  } else if (onlyStale) {
    whereClause +=
      " AND (r.link_last_validated_at IS NULL OR r.link_last_validated_at < NOW() - INTERVAL '24 hours')";
  }

  const { rows: resources } = await pool.query(
    `
    SELECT r.id, r.url
    FROM resources r
    ${whereClause}
    ${orderClause}
    LIMIT $1
  `,
    [limit]
  );

  const results: ValidationResult[] = [];
  let processedCount = 0;

  // Process in batches
  for (let i = 0; i < resources.length; i += batchSize) {
    const batch = resources.slice(i, i + batchSize);

    // Validate batch in parallel
    const batchResults = await Promise.all(
      batch.map((r) => validateResource(pool, r.id, r.url))
    );

    results.push(...batchResults);
    processedCount += batch.length;

    // Rate limiting between batches
    if (i + batchSize < resources.length) {
      await new Promise((resolve) =>
        setTimeout(resolve, delayBetweenBatches)
      );
    }
  }

  // Calculate stats
  const stats: ValidationStats = {
    total: results.length,
    valid: results.filter((r) => r.isValid).length,
    invalid: results.filter((r) => !r.isValid && !r.redirectUrl).length,
    redirects: results.filter((r) => r.redirectUrl !== null).length,
    errors: results.filter((r) => r.statusCode === null).length,
    avgResponseTime:
      results.length > 0
        ? Math.round(
            results.reduce((sum, r) => sum + r.responseTimeMs, 0) /
              results.length
          )
        : 0,
  };

  return stats;
}

/**
 * Get broken links from the moderation queue
 */
export async function getBrokenLinkQueue(
  pool: Pool,
  options: {
    status?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ items: BrokenLinkEntry[]; total: number }> {
  const { status = "pending", limit = 50, offset = 0 } = options;

  const { rows: items } = await pool.query(
    `
    SELECT
      q.id,
      q.resource_id as "resourceId",
      r.title as "resourceTitle",
      r.slug as "resourceSlug",
      q.original_url as "originalUrl",
      q.status_code as "statusCode",
      q.error_message as "errorMessage",
      q.suggested_url as "suggestedUrl",
      q.status,
      q.created_at as "createdAt"
    FROM broken_link_queue q
    JOIN resources r ON r.id = q.resource_id
    WHERE q.status = $1
    ORDER BY q.created_at DESC
    LIMIT $2 OFFSET $3
  `,
    [status, limit, offset]
  );

  const {
    rows: [{ count }],
  } = await pool.query(
    `SELECT COUNT(*) FROM broken_link_queue WHERE status = $1`,
    [status]
  );

  return { items, total: parseInt(count, 10) };
}

/**
 * Update a broken link queue entry
 */
export async function updateBrokenLinkEntry(
  pool: Pool,
  entryId: string,
  updates: {
    status?: string;
    suggestedUrl?: string;
    notes?: string;
    reviewedBy?: string;
  }
): Promise<void> {
  const setClauses: string[] = ["updated_at = NOW()"];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (updates.status) {
    setClauses.push(`status = $${paramIndex++}`);
    values.push(updates.status);
  }
  if (updates.suggestedUrl !== undefined) {
    setClauses.push(`suggested_url = $${paramIndex++}`);
    values.push(updates.suggestedUrl);
  }
  if (updates.notes !== undefined) {
    setClauses.push(`notes = $${paramIndex++}`);
    values.push(updates.notes);
  }
  if (updates.reviewedBy) {
    setClauses.push(`reviewed_by = $${paramIndex++}`);
    setClauses.push(`reviewed_at = NOW()`);
    values.push(updates.reviewedBy);
  }

  values.push(entryId);

  await pool.query(
    `UPDATE broken_link_queue SET ${setClauses.join(", ")} WHERE id = $${paramIndex}`,
    values
  );
}

/**
 * Fix a broken link by updating the resource URL
 */
export async function fixBrokenLink(
  pool: Pool,
  entryId: string,
  newUrl: string,
  reviewedBy: string
): Promise<void> {
  // Get the resource ID from the queue entry
  const {
    rows: [entry],
  } = await pool.query(
    `SELECT resource_id FROM broken_link_queue WHERE id = $1`,
    [entryId]
  );

  if (!entry) {
    throw new Error("Queue entry not found");
  }

  // Update the resource URL
  await pool.query(
    `UPDATE resources SET url = $1, updated_at = NOW() WHERE id = $2`,
    [newUrl, entry.resource_id]
  );

  // Update the queue entry status
  await pool.query(
    `
    UPDATE broken_link_queue
    SET status = 'fixed', suggested_url = $1, reviewed_by = $2, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = $3
  `,
    [newUrl, reviewedBy, entryId]
  );

  // Re-validate the new URL
  await validateResource(pool, entry.resource_id, newUrl);
}

/**
 * Hide a resource with a broken link
 */
export async function hideBrokenResource(
  pool: Pool,
  entryId: string,
  reviewedBy: string
): Promise<void> {
  const {
    rows: [entry],
  } = await pool.query(
    `SELECT resource_id FROM broken_link_queue WHERE id = $1`,
    [entryId]
  );

  if (!entry) {
    throw new Error("Queue entry not found");
  }

  // Unpublish the resource
  await pool.query(
    `UPDATE resources SET is_published = false, updated_at = NOW() WHERE id = $1`,
    [entry.resource_id]
  );

  // Update queue status
  await pool.query(
    `
    UPDATE broken_link_queue
    SET status = 'hidden', reviewed_by = $1, reviewed_at = NOW(), updated_at = NOW()
    WHERE id = $2
  `,
    [reviewedBy, entryId]
  );
}

/**
 * Get validation statistics
 */
export async function getValidationStats(pool: Pool): Promise<{
  totalResources: number;
  validated: number;
  unchecked: number;
  valid: number;
  invalid: number;
  pendingReview: number;
  lastFullScan: Date | null;
}> {
  const { rows } = await pool.query(`
    SELECT
      (SELECT COUNT(*) FROM resources WHERE is_published = true) as total_resources,
      (SELECT COUNT(*) FROM resource_link_validations) as validated,
      (SELECT COUNT(*) FROM resource_link_validations WHERE is_valid = true) as valid,
      (SELECT COUNT(*) FROM resource_link_validations WHERE is_valid = false) as invalid,
      (SELECT COUNT(*) FROM broken_link_queue WHERE status = 'pending') as pending_review,
      (SELECT MAX(last_checked_at) FROM resource_link_validations) as last_scan
  `);

  const stats = rows[0];
  return {
    totalResources: parseInt(stats.total_resources, 10),
    validated: parseInt(stats.validated, 10),
    unchecked:
      parseInt(stats.total_resources, 10) - parseInt(stats.validated, 10),
    valid: parseInt(stats.valid, 10),
    invalid: parseInt(stats.invalid, 10),
    pendingReview: parseInt(stats.pending_review, 10),
    lastFullScan: stats.last_scan,
  };
}
