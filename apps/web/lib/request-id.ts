/**
 * Request ID Utilities
 *
 * Generates and manages correlation IDs for request tracing.
 * Uses nanoid for fast, URL-safe unique IDs.
 */

import { nanoid } from "nanoid";
import { headers } from "next/headers";

// Standard header name for request correlation
export const REQUEST_ID_HEADER = "X-Request-ID";
export const VISITOR_ID_HEADER = "X-Visitor-ID";

/**
 * Generate a new request ID
 * Default 21 characters (URL-safe, ~126 bits of entropy)
 */
export function generateRequestId(size: number = 21): string {
  return nanoid(size);
}

/**
 * Get request ID from headers or generate a new one
 */
export async function getRequestId(): Promise<string> {
  try {
    const headersList = await headers();
    const existingId = headersList.get(REQUEST_ID_HEADER);
    return existingId || generateRequestId();
  } catch {
    // Outside of request context
    return generateRequestId();
  }
}

/**
 * Get visitor ID from headers (set by client-side fingerprint)
 */
export async function getVisitorId(): Promise<string | null> {
  try {
    const headersList = await headers();
    return headersList.get(VISITOR_ID_HEADER);
  } catch {
    return null;
  }
}

/**
 * Extract common request metadata from headers
 */
export async function getRequestMetadata(): Promise<{
  requestId: string;
  visitorId: string | null;
  userAgent: string | null;
  ip: string | null;
  referer: string | null;
  origin: string | null;
}> {
  try {
    const headersList = await headers();

    return {
      requestId: headersList.get(REQUEST_ID_HEADER) || generateRequestId(),
      visitorId: headersList.get(VISITOR_ID_HEADER),
      userAgent: headersList.get("user-agent"),
      ip:
        headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        headersList.get("x-real-ip"),
      referer: headersList.get("referer"),
      origin: headersList.get("origin"),
    };
  } catch {
    return {
      requestId: generateRequestId(),
      visitorId: null,
      userAgent: null,
      ip: null,
      referer: null,
      origin: null,
    };
  }
}

/**
 * Create headers object with request ID for outgoing requests
 */
export function createTracingHeaders(requestId?: string): Record<string, string> {
  return {
    [REQUEST_ID_HEADER]: requestId || generateRequestId(),
  };
}

/**
 * Format request ID for logging (shortened version)
 */
export function formatRequestId(requestId: string): string {
  // Show first 8 chars for readability in logs
  return requestId.substring(0, 8);
}
