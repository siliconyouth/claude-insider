import { MetadataRoute } from "next";

const BASE_URL = "https://www.claudeinsider.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // ============================================
      // Google - Full access with optimizations
      // ============================================
      {
        userAgent: "Googlebot",
        allow: [
          "/",
          "/docs/",
          "/resources/",
          "/stats",
          "/users",
          "/changelog",
          "/faq",
          "/search",
          "/feed",
          "/suggestions",
          "/donate",
          "/donors",
          "/privacy",
          "/terms",
          "/accessibility",
          "/disclaimer",
          "/feed.xml",
          "/resources/feed.xml",
        ],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/settings",
          "/inbox",
          "/favorites",
          "/notifications",
          "/profile",
          "/chat",
          "/reading-lists",
          "/auth/",
          "/playground",
          "/_next/",
          "/admin",
        ],
      },
      {
        userAgent: "Googlebot-Image",
        allow: ["/", "/icons/", "/og/"],
        disallow: ["/api/", "/admin/", "/dashboard/"],
      },
      // ============================================
      // Bing/Microsoft - Full access
      // ============================================
      {
        userAgent: "Bingbot",
        allow: ["/"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/settings",
          "/inbox",
          "/favorites",
          "/notifications",
          "/profile",
          "/chat",
          "/reading-lists",
          "/auth/",
          "/playground",
          "/_next/",
        ],
      },
      {
        userAgent: "msnbot",
        allow: ["/"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/", "/_next/"],
      },
      // ============================================
      // Yahoo/Slurp - Full access
      // ============================================
      {
        userAgent: "Slurp",
        allow: ["/"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/", "/_next/"],
      },
      // ============================================
      // Yandex - Full access (important for Eastern Europe)
      // ============================================
      {
        userAgent: "Yandex",
        allow: ["/"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/", "/_next/"],
        crawlDelay: 1,
      },
      // ============================================
      // Baidu - Full access (important for China)
      // ============================================
      {
        userAgent: "Baiduspider",
        allow: ["/"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/", "/_next/"],
        crawlDelay: 2,
      },
      // ============================================
      // DuckDuckGo - Full access
      // ============================================
      {
        userAgent: "DuckDuckBot",
        allow: ["/"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/", "/_next/"],
      },
      // ============================================
      // Apple/Applebot - Full access for Siri/Spotlight
      // ============================================
      {
        userAgent: "Applebot",
        allow: ["/"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/", "/_next/"],
      },
      // ============================================
      // Social Media Crawlers - Allow OG images
      // ============================================
      {
        userAgent: "facebookexternalhit",
        allow: ["/", "/og/"],
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
      {
        userAgent: "Twitterbot",
        allow: ["/", "/og/"],
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
      {
        userAgent: "LinkedInBot",
        allow: ["/", "/og/"],
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
      {
        userAgent: "Slackbot",
        allow: ["/", "/og/"],
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
      {
        userAgent: "Discordbot",
        allow: ["/", "/og/"],
        disallow: ["/admin/", "/dashboard/", "/api/"],
      },
      // ============================================
      // AI/LLM Crawlers - Allow content for training
      // ============================================
      {
        userAgent: "GPTBot",
        allow: ["/docs/", "/resources/", "/changelog", "/faq"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/settings",
          "/inbox",
          "/chat",
          "/profile",
          "/auth/",
        ],
      },
      {
        userAgent: "ChatGPT-User",
        allow: ["/docs/", "/resources/", "/changelog", "/faq"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/"],
      },
      {
        userAgent: "Claude-Web",
        allow: ["/docs/", "/resources/", "/changelog", "/faq"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/"],
      },
      {
        userAgent: "anthropic-ai",
        allow: ["/docs/", "/resources/", "/changelog", "/faq"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/"],
      },
      {
        userAgent: "PerplexityBot",
        allow: ["/docs/", "/resources/", "/changelog", "/faq"],
        disallow: ["/admin/", "/dashboard/", "/api/", "/auth/"],
      },
      // ============================================
      // Default - All other crawlers
      // ============================================
      {
        userAgent: "*",
        allow: ["/"],
        disallow: [
          "/admin/",
          "/dashboard/",
          "/api/",
          "/settings",
          "/inbox",
          "/favorites",
          "/notifications",
          "/profile",
          "/chat",
          "/reading-lists",
          "/auth/",
          "/playground",
          "/_next/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  };
}
