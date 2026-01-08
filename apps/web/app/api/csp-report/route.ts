/**
 * CSP Violation Report Endpoint
 *
 * Receives Content Security Policy violation reports from browsers and
 * forwards them to Sentry for monitoring. This helps identify:
 * - Missing CSP directives for legitimate resources
 * - Potential XSS attempts blocked by CSP
 * - Third-party scripts that need CSP allowlisting
 *
 * CSP reports are sent automatically by browsers when a CSP violation occurs.
 * The report-uri directive in the CSP header points to this endpoint.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP#violation_report_syntax
 */

import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";

// CSP violation report structure
interface CSPReport {
  "csp-report"?: {
    "document-uri"?: string;
    "referrer"?: string;
    "violated-directive"?: string;
    "effective-directive"?: string;
    "original-policy"?: string;
    "blocked-uri"?: string;
    "status-code"?: number;
    "source-file"?: string;
    "line-number"?: number;
    "column-number"?: number;
    "script-sample"?: string;
  };
}

// Rate limiting: track reports per IP to prevent abuse
const reportCounts = new Map<string, { count: number; resetAt: number }>();
const MAX_REPORTS_PER_MINUTE = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const record = reportCounts.get(ip);

  if (!record || now > record.resetAt) {
    reportCounts.set(ip, { count: 1, resetAt: now + 60000 });
    return false;
  }

  if (record.count >= MAX_REPORTS_PER_MINUTE) {
    return true;
  }

  record.count++;
  return false;
}

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [ip, record] of reportCounts.entries()) {
    if (now > record.resetAt) {
      reportCounts.delete(ip);
    }
  }
}, 60000);

export async function POST(request: NextRequest) {
  try {
    // Rate limit by IP
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    if (isRateLimited(ip)) {
      return new NextResponse(null, { status: 429 });
    }

    // Parse the CSP report
    const contentType = request.headers.get("content-type") || "";
    if (!contentType.includes("application/csp-report") && !contentType.includes("application/json")) {
      return new NextResponse("Invalid content type", { status: 400 });
    }

    const body = await request.json() as CSPReport;
    const report = body["csp-report"];

    if (!report) {
      return new NextResponse("Invalid CSP report format", { status: 400 });
    }

    // Extract useful information
    const violatedDirective = report["violated-directive"] || report["effective-directive"] || "unknown";
    const blockedUri = report["blocked-uri"] || "unknown";
    const documentUri = report["document-uri"] || "unknown";
    const sourceFile = report["source-file"];
    const lineNumber = report["line-number"];

    // Skip reporting for common false positives
    const ignoredBlockedUris = [
      "data:", // Data URIs are often used legitimately
      "blob:", // Blob URIs for workers
      "eval", // eval() calls (already blocked by CSP)
      "inline", // Inline scripts (expected to be blocked sometimes)
      "chrome-extension://", // Browser extensions
      "moz-extension://", // Firefox extensions
      "safari-extension://", // Safari extensions
    ];

    if (ignoredBlockedUris.some(ignored => blockedUri.startsWith(ignored))) {
      // Log but don't report to Sentry
      if (process.env.NODE_ENV === "development") {
        console.log("[CSP] Ignored violation:", { violatedDirective, blockedUri });
      }
      return new NextResponse(null, { status: 204 });
    }

    // Send to Sentry as a security event
    Sentry.captureMessage(`CSP Violation: ${violatedDirective}`, {
      level: "warning",
      tags: {
        type: "csp-violation",
        directive: violatedDirective,
      },
      extra: {
        blockedUri,
        documentUri,
        sourceFile,
        lineNumber,
        originalPolicy: report["original-policy"]?.substring(0, 500), // Truncate long policies
        scriptSample: report["script-sample"],
      },
      fingerprint: ["csp-violation", violatedDirective, blockedUri],
    });

    // Log in development
    if (process.env.NODE_ENV === "development") {
      console.log("[CSP] Violation reported to Sentry:", {
        violatedDirective,
        blockedUri,
        documentUri,
      });
    }

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("[CSP] Error processing report:", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}

// Support both POST and report-to format
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
