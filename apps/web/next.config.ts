import type { NextConfig } from "next";
import createMDX from "@next/mdx";
import { withPayload } from "@payloadcms/next/withPayload";
import createNextIntlPlugin from "next-intl/plugin";
import { withBotId } from "botid/next/config";
import bundleAnalyzer from "@next/bundle-analyzer";
import webpack from "webpack";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

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
  // Reduce build output verbosity
  logging: {
    fetches: {
      fullUrl: false,
    },
  },
  // Enable experimental features for better performance
  experimental: {
    optimizeCss: true,
    // Turbopack filesystem caching for faster incremental builds (Next.js 16.1+)
    // Dev cache enabled by default, build cache opt-in for CI/CD speedup
    turbopackFileSystemCacheForBuild: true,
    // Optimize package imports for smaller bundles
    optimizePackageImports: [
      "lucide-react",
      "@heroicons/react",
      "date-fns",
      "recharts",
    ],
  },
  // Tree-shake large icon libraries
  // Note: lucide-react is handled by optimizePackageImports (Turbopack-compatible)
  modularizeImports: {
    "@heroicons/react/24/outline": {
      transform: "@heroicons/react/24/outline/{{ member }}",
    },
    "@heroicons/react/24/solid": {
      transform: "@heroicons/react/24/solid/{{ member }}",
    },
  },
  // Transpile packages for faster compilation
  transpilePackages: [
    "@repo/ui",
    "lucide-react",
  ],
  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "pmsnjddolwngdeygkcfn.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  // Bundle analyzer optimization
  productionBrowserSourceMaps: false,
  // Webpack optimizations for bundle size
  webpack: (config) => {
    // Limit date-fns locales to only English (saves ~600KB)
    // PayloadCMS bundles all ~120 locales by default
    config.plugins.push(
      new webpack.ContextReplacementPlugin(
        /date-fns[/\\]locale/,
        new RegExp(`(en-US|en-GB)`)
      )
    );

    return config;
  },
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
              // Vercel Analytics uses va.vercel-scripts.com for the analytics script
              // CDN sources (unpkg, jsdelivr) for vodozemac WASM E2EE library
              // 'wasm-unsafe-eval' allows WebAssembly execution for E2EE crypto
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' 'wasm-unsafe-eval' https://www.paypal.com https://*.paypal.com https://*.paypalobjects.com https://vercel.live https://*.vercel.live https://va.vercel-scripts.com https://unpkg.com https://cdn.jsdelivr.net https://*.matrix.org",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "font-src 'self' https://fonts.gstatic.com",
              "img-src 'self' data: https: blob:",
              "media-src 'self' blob: https://*.elevenlabs.io",
              // Supabase (REST API + Realtime WebSocket), PayPal, ElevenLabs, Vercel analytics/live
              // CDN sources for fetching vodozemac WASM binaries
              "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vitals.vercel-insights.com https://va.vercel-scripts.com https://*.paypal.com https://*.paypalobjects.com https://api.elevenlabs.io https://vercel.live https://*.vercel.live wss://vercel.live wss://*.vercel.live https://unpkg.com https://cdn.jsdelivr.net https://*.matrix.org https://github.com https://raw.githubusercontent.com",
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

// Wrap with Payload, MDX, i18n, BotId, and Bundle Analyzer
export default withBundleAnalyzer(withBotId(withPayload(withNextIntl(withMDX(nextConfig)))));
