/**
 * Security Proxy
 *
 * Handles request correlation IDs and visitor tracking.
 * Runs on all requests as a network-level proxy.
 *
 * NOTE: Honeypot and database operations are handled in API routes,
 * not in proxy (Edge runtime can't use node-postgres).
 *
 * Migrated from middleware.ts to proxy.ts for Next.js 16 compatibility.
 * See: https://nextjs.org/docs/messages/middleware-to-proxy
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { nanoid } from "nanoid";

// Header names
const REQUEST_ID_HEADER = "X-Request-ID";
const VISITOR_ID_HEADER = "X-Visitor-ID";

// Paths to skip (static assets, etc.)
const SKIP_PATHS = [
  "/_next",
  "/static",
  "/favicon.ico",
  "/manifest.json",
  "/robots.txt",
  "/sitemap.xml",
  "/feed.xml",
  "/icons",
  "/.well-known",
];

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip static assets and system paths
  if (SKIP_PATHS.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Generate or use existing request ID
  const existingRequestId = request.headers.get(REQUEST_ID_HEADER);
  const requestId = existingRequestId || nanoid();

  // Get visitor ID from header (set by client-side fingerprint)
  const visitorId = request.headers.get(VISITOR_ID_HEADER);

  // Create response with request ID header
  const response = NextResponse.next({
    request: {
      headers: new Headers(request.headers),
    },
  });

  // Add request ID to response headers (for client-side tracking)
  response.headers.set(REQUEST_ID_HEADER, requestId);

  // Log API requests in development
  if (process.env.NODE_ENV === "development" && pathname.startsWith("/api")) {
    console.log(
      `[${new Date().toISOString()}] ${request.method} ${pathname}`,
      `req=${requestId.substring(0, 8)}`,
      visitorId ? `visitor=${visitorId.substring(0, 8)}` : ""
    );
  }

  return response;
}

// Configure which paths the proxy runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, robots.txt (static files)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
