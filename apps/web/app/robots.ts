import { MetadataRoute } from "next";

/**
 * Robots.txt Configuration
 *
 * Explicitly allows all major search engines, AI crawlers, and social media bots.
 * This helps with SEO discoverability and ensures content can be indexed/previewed.
 *
 * Categories:
 * - Traditional Search Engines (Google, Bing, Yahoo, DuckDuckGo, etc.)
 * - Regional Search Engines (Baidu, Yandex, Sogou, Naver, etc.)
 * - AI/LLM Crawlers (GPTBot, ClaudeBot, PerplexityBot, etc.)
 * - Social Media Preview Bots (Facebook, Twitter, LinkedIn, etc.)
 * - Archive/Research Bots (Internet Archive, Common Crawl, etc.)
 */

// Known search engine user agents
const SEARCH_ENGINES = [
  // Google (all variants)
  "Googlebot",
  "Googlebot-Image",
  "Googlebot-News",
  "Googlebot-Video",
  "Storebot-Google",
  "Google-InspectionTool",
  "GoogleOther",

  // Microsoft/Bing
  "Bingbot",
  "BingPreview",
  "MSNBot",
  "AdIdxBot",

  // Yahoo
  "Slurp",

  // DuckDuckGo
  "DuckDuckBot",
  "DuckDuckGo-Favicons-Bot",

  // Apple
  "Applebot",

  // Other Western search engines
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "PetalBot",
  "Bytespider",
];

// Regional search engines (Asia, Russia, etc.)
const REGIONAL_SEARCH_ENGINES = [
  // China
  "Baiduspider",
  "Baiduspider-image",
  "Baiduspider-video",
  "Baiduspider-news",
  "Sogou",
  "Sosospider",
  "360Spider",

  // Russia
  "YandexBot",
  "YandexImages",
  "YandexVideo",
  "YandexMedia",
  "YandexBlogs",
  "YandexNews",
  "YandexPagechecker",

  // South Korea
  "Yeti", // Naver

  // Other
  "Exabot",
  "Qwantify",
];

// AI/LLM crawlers - allowing these helps your content appear in AI responses
const AI_CRAWLERS = [
  // OpenAI
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",

  // Anthropic
  "anthropic-ai",
  "ClaudeBot",
  "Claude-Web",

  // Other AI services
  "PerplexityBot",
  "Cohere-ai",
  "Google-Extended", // Google AI training
  "CCBot", // Common Crawl (used for AI training)
  "Diffbot",
  "Omgilibot",
  "Bytespider", // TikTok/ByteDance AI
];

// Social media preview bots - necessary for link previews
const SOCIAL_BOTS = [
  "facebookexternalhit",
  "Facebot",
  "Twitterbot",
  "LinkedInBot",
  "Pinterestbot",
  "Redditbot",
  "Discordbot",
  "Slackbot",
  "TelegramBot",
  "WhatsApp",
  "Embedly",
];

// Archive and research bots
const ARCHIVE_BOTS = [
  "ia_archiver", // Internet Archive
  "archive.org_bot",
  "Screaming Frog SEO Spider",
];

// Combine all allowed bots
const ALL_ALLOWED_BOTS = [
  ...SEARCH_ENGINES,
  ...REGIONAL_SEARCH_ENGINES,
  ...AI_CRAWLERS,
  ...SOCIAL_BOTS,
  ...ARCHIVE_BOTS,
];

// Paths to disallow for all bots (private/auth pages)
const DISALLOWED_PATHS = [
  "/admin",
  "/admin/*",
  "/api/*",
  "/auth/*",
  "/dashboard",
  "/dashboard/*",
  "/settings",
  "/settings/*",
  "/inbox",
  "/inbox/*",
  "/profile", // User's own profile page (private)
];

// Paths that should always be allowed
const ALLOWED_PATHS = [
  "/",
  "/docs",
  "/docs/*",
  "/resources",
  "/resources/*",
  "/privacy",
  "/terms",
  "/accessibility",
  "/disclaimer",
  "/changelog",
  "/faq",
  "/donate",
  "/donors",
  "/users", // Public user directory
  "/users/*", // Public user profiles
  "/feed.xml",
  "/sitemap.xml",
];

export default function robots(): MetadataRoute.Robots {
  const baseUrl = "https://www.claudeinsider.com";

  // Create explicit rules for each known bot
  const botRules: MetadataRoute.Robots["rules"] = ALL_ALLOWED_BOTS.map((bot) => ({
    userAgent: bot,
    allow: ALLOWED_PATHS,
    disallow: DISALLOWED_PATHS,
  }));

  // Add a catch-all rule for any other bots
  const catchAllRule = {
    userAgent: "*",
    allow: ALLOWED_PATHS,
    disallow: DISALLOWED_PATHS,
  };

  return {
    rules: [...botRules, catchAllRule],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
