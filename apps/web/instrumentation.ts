/**
 * Next.js Instrumentation Hook
 *
 * This file is automatically loaded by Next.js at startup.
 * It initializes Sentry for server-side and edge runtimes.
 *
 * @see https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
 */

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Server-side: Initialize Sentry for Node.js runtime
    await import("./sentry.server.config");
  }

  if (process.env.NEXT_RUNTIME === "edge") {
    // Edge runtime: Initialize Sentry for Edge functions
    await import("./sentry.edge.config");
  }
}

/**
 * Called when an error is captured by the instrumentation.
 * This is used by Sentry to capture errors that occur during
 * the request lifecycle.
 */
export const onRequestError = async (
  error: Error,
  request: {
    path: string;
    method: string;
    headers: Record<string, string>;
  },
  context: {
    routerKind: "Pages Router" | "App Router";
    routePath: string;
    routeType: "render" | "route" | "action" | "middleware";
    revalidateReason?: string;
  }
) => {
  // Only capture errors in production
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  const Sentry = await import("@sentry/nextjs");

  Sentry.captureException(error, {
    tags: {
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    extra: {
      path: request.path,
      method: request.method,
      revalidateReason: context.revalidateReason,
    },
  });
};
