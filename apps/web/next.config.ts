import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";
import { withBotId } from "botid/next/config";

const nextConfig: NextConfig = {
  pageExtensions: ["js", "jsx", "ts", "tsx", "md", "mdx"],
  typescript: {
    ignoreBuildErrors: true,
  },
  // Suppress SCSS deprecation warnings from PayloadCMS dependencies
  sassOptions: {
    silenceDeprecations: ["legacy-js-api", "import", "global-builtin"],
    quietDeps: true,
  },
  // Performance optimizations
  poweredByHeader: false,
  compress: true,
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
  },
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },
  // Bundle analyzer optimization
  productionBrowserSourceMaps: false,
  // Security headers
  async headers() {
    return [
      // Admin panel - relaxed CSP for Payload UI
      {
        source: "/admin/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN", // Allow embedding within same origin for admin
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
      // Public routes - strict CSP
      {
        source: "/:path((?!admin).*)",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(self), geolocation=(), interest-cohort=()",
          },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https:",
              "media-src 'self' blob:",
              "connect-src 'self' https://vitals.vercel-insights.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

const withMDX = createMDX({
  extension: /\.mdx?$/,
});

const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

// Wrap with Payload, MDX, i18n, and BotId
export default withBotId(withPayload(withNextIntl(withMDX(nextConfig))));
