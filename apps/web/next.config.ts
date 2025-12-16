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
              // PayPal SDK requires scripts from paypal.com and paypalobjects.com
              // Vercel Live is used for preview deployments and feedback
              // CDN sources (unpkg, jsdelivr) for vodozemac WASM E2EE library
              // 'wasm-unsafe-eval' allows WebAssembly execution for E2EE crypto
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://www.paypal.com https://*.paypal.com https://*.paypalobjects.com https://vercel.live https://*.vercel.live https://unpkg.com https://cdn.jsdelivr.net https://*.matrix.org",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' blob: https://*.elevenlabs.io",
              // Supabase (REST API + Realtime WebSocket), PayPal, ElevenLabs, Vercel analytics/live
              // CDN sources for fetching vodozemac WASM binaries
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://*.paypal.com https://*.paypalobjects.com https://api.elevenlabs.io https://vercel.live https://*.vercel.live wss://vercel.live wss://*.vercel.live https://unpkg.com https://cdn.jsdelivr.net https://*.matrix.org https://github.com https://raw.githubusercontent.com",
              // PayPal buttons render in iframes
              "frame-src 'self' https://*.paypal.com https://*.paypalobjects.com",
              "frame-ancestors 'none'",
              "base-uri 'self'",
              "form-action 'self' https://*.paypal.com",
              // Worker source for potential crypto Web Workers
              "worker-src 'self' blob:",
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
