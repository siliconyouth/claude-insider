/**
 * Navigation Commands
 *
 * Commands for navigating to dashboard pages and main site sections.
 */

import type { Command } from "./types";

// ============================================
// DASHBOARD NAVIGATION
// ============================================

export const dashboardNavigationCommands: Command[] = [
  // Overview
  {
    id: "nav-dashboard",
    label: "Dashboard Overview",
    description: "Go to main dashboard",
    category: "navigation",
    keywords: ["home", "overview", "stats"],
    action: ({ navigate }) => navigate("/dashboard"),
    minRole: "moderator",
  },

  // Content Section
  {
    id: "nav-documentation",
    label: "Documentation",
    description: "Manage documentation pages",
    category: "navigation",
    keywords: ["docs", "pages", "content"],
    action: ({ navigate }) => navigate("/dashboard/documentation"),
    minRole: "moderator",
  },
  {
    id: "nav-doc-versions",
    label: "Doc Versions",
    description: "Manage documentation version history",
    category: "navigation",
    keywords: ["versions", "history", "diff"],
    action: ({ navigate }) => navigate("/dashboard/doc-versions"),
    minRole: "moderator",
  },
  {
    id: "nav-resources",
    label: "Resources",
    description: "Manage resources catalog",
    category: "navigation",
    keywords: ["tools", "mcp", "sdk", "library"],
    action: ({ navigate }) => navigate("/dashboard/resources-admin"),
    minRole: "moderator",
  },
  {
    id: "nav-prompts",
    label: "Prompts",
    description: "Manage system prompts",
    category: "navigation",
    keywords: ["prompt", "template", "system"],
    action: ({ navigate }) => navigate("/dashboard/prompts"),
    minRole: "moderator",
  },
  {
    id: "nav-relationships",
    label: "Relationships",
    description: "Manage cross-links between docs and resources",
    category: "navigation",
    keywords: ["links", "cross-link", "related"],
    action: ({ navigate }) => navigate("/dashboard/relationships"),
    minRole: "moderator",
  },
  {
    id: "nav-discovery",
    label: "Discovery",
    description: "Resource discovery queue and sources",
    category: "navigation",
    keywords: ["queue", "scan", "sources"],
    action: ({ navigate }) => navigate("/dashboard/discovery"),
    minRole: "moderator",
  },
  {
    id: "nav-auto-updates",
    label: "Auto-Updates",
    description: "AI-powered resource update jobs",
    category: "navigation",
    keywords: ["ai", "update", "automation"],
    action: ({ navigate }) => navigate("/dashboard/auto-updates"),
    minRole: "moderator",
  },
  {
    id: "nav-seo",
    label: "SEO",
    description: "SEO management and indexing",
    category: "navigation",
    keywords: ["seo", "indexnow", "sitemap"],
    action: ({ navigate }) => navigate("/dashboard/seo"),
    minRole: "moderator",
  },

  // Moderation Section
  {
    id: "nav-beta",
    label: "Beta Applications",
    description: "Review beta access applications",
    category: "navigation",
    keywords: ["beta", "application", "access"],
    action: ({ navigate }) => navigate("/dashboard/beta"),
    minRole: "moderator",
  },
  {
    id: "nav-beta-testers",
    label: "Beta Testers",
    description: "Manage approved beta testers",
    category: "navigation",
    keywords: ["testers", "beta", "users"],
    action: ({ navigate }) => navigate("/dashboard/beta-testers"),
    minRole: "moderator",
  },
  {
    id: "nav-feedback",
    label: "Feedback",
    description: "Review user feedback",
    category: "navigation",
    keywords: ["feedback", "suggestions", "bugs"],
    action: ({ navigate }) => navigate("/dashboard/feedback"),
    minRole: "moderator",
  },
  {
    id: "nav-suggestions",
    label: "Edit Suggestions",
    description: "Review documentation edit suggestions",
    category: "navigation",
    keywords: ["edit", "suggestion", "change"],
    action: ({ navigate }) => navigate("/dashboard/suggestions"),
    minRole: "moderator",
  },
  {
    id: "nav-comments",
    label: "Comments",
    description: "Moderate user comments",
    category: "navigation",
    keywords: ["comments", "moderation"],
    action: ({ navigate }) => navigate("/dashboard/comments"),
    minRole: "moderator",
  },
  {
    id: "nav-reports",
    label: "Reports",
    description: "Review content reports",
    category: "navigation",
    keywords: ["reports", "abuse", "flag"],
    action: ({ navigate }) => navigate("/dashboard/reports"),
    minRole: "moderator",
  },

  // Analytics Section
  {
    id: "nav-faq-analytics",
    label: "FAQ Analytics",
    description: "View AI assistant question patterns",
    category: "navigation",
    keywords: ["faq", "questions", "analytics"],
    action: ({ navigate }) => navigate("/dashboard/faq-analytics"),
    minRole: "moderator",
  },
  {
    id: "nav-search-analytics",
    label: "Search Analytics",
    description: "View search patterns and trends",
    category: "navigation",
    keywords: ["search", "analytics", "queries"],
    action: ({ navigate }) => navigate("/dashboard/search-analytics"),
    minRole: "moderator",
  },
  {
    id: "nav-diagnostics",
    label: "Diagnostics",
    description: "System health and tests",
    category: "navigation",
    keywords: ["diagnostics", "health", "tests", "debug"],
    action: ({ navigate }) => navigate("/dashboard/diagnostics"),
    minRole: "moderator",
  },

  // Security Section
  {
    id: "nav-security",
    label: "Security Overview",
    description: "Security dashboard and metrics",
    category: "navigation",
    keywords: ["security", "overview"],
    action: ({ navigate }) => navigate("/dashboard/security"),
    minRole: "moderator",
  },
  {
    id: "nav-bots",
    label: "Bot Analytics",
    description: "Bot detection and blocking",
    category: "navigation",
    keywords: ["bots", "detection", "block"],
    action: ({ navigate }) => navigate("/dashboard/security/bots"),
    minRole: "moderator",
  },
  {
    id: "nav-logs",
    label: "Security Logs",
    description: "View audit and security logs",
    category: "navigation",
    keywords: ["logs", "audit", "activity"],
    action: ({ navigate }) => navigate("/dashboard/security/logs"),
    minRole: "moderator",
  },
  {
    id: "nav-visitors",
    label: "Visitors",
    description: "View visitor fingerprints and sessions",
    category: "navigation",
    keywords: ["visitors", "fingerprint", "sessions"],
    action: ({ navigate }) => navigate("/dashboard/security/visitors"),
    minRole: "moderator",
  },
  {
    id: "nav-honeypots",
    label: "Honeypots",
    description: "Manage honeypot traps",
    category: "navigation",
    keywords: ["honeypot", "trap", "security"],
    action: ({ navigate }) => navigate("/dashboard/security/honeypots"),
    minRole: "moderator",
  },
  {
    id: "nav-security-settings",
    label: "Security Settings",
    description: "Configure security options",
    category: "navigation",
    keywords: ["settings", "config", "security"],
    action: ({ navigate }) => navigate("/dashboard/security/settings"),
    minRole: "admin",
  },

  // Admin Section
  {
    id: "nav-users",
    label: "Users",
    description: "Manage user accounts",
    category: "navigation",
    keywords: ["users", "accounts", "members"],
    action: ({ navigate }) => navigate("/dashboard/users"),
    minRole: "admin",
  },
  {
    id: "nav-banned-users",
    label: "Banned Users",
    description: "View and manage banned users",
    category: "navigation",
    keywords: ["banned", "block", "suspend"],
    action: ({ navigate }) => navigate("/dashboard/banned-users"),
    minRole: "admin",
  },
  {
    id: "nav-notifications",
    label: "Notifications",
    description: "Manage system notifications",
    category: "navigation",
    keywords: ["notifications", "alerts", "messages"],
    action: ({ navigate }) => navigate("/dashboard/notifications"),
    minRole: "admin",
  },
  {
    id: "nav-donations",
    label: "Donations",
    description: "View donation history",
    category: "navigation",
    keywords: ["donations", "payments", "paypal"],
    action: ({ navigate }) => navigate("/dashboard/donations"),
    minRole: "admin",
  },
  {
    id: "nav-exports",
    label: "Exports",
    description: "Manage data exports",
    category: "navigation",
    keywords: ["exports", "download", "data"],
    action: ({ navigate }) => navigate("/dashboard/exports"),
    minRole: "admin",
  },
];

// ============================================
// MAIN SITE NAVIGATION
// ============================================

export const siteNavigationCommands: Command[] = [
  {
    id: "nav-home",
    label: "Home",
    description: "Go to homepage",
    category: "navigation",
    keywords: ["home", "main"],
    action: ({ navigate }) => navigate("/"),
  },
  {
    id: "nav-docs",
    label: "Documentation",
    description: "Browse documentation",
    category: "navigation",
    keywords: ["docs", "guide"],
    action: ({ navigate }) => navigate("/docs"),
  },
  {
    id: "nav-resources-browse",
    label: "Browse Resources",
    description: "Explore Claude AI resources",
    category: "navigation",
    keywords: ["resources", "tools", "browse"],
    action: ({ navigate }) => navigate("/resources"),
  },
  {
    id: "nav-changelog",
    label: "Changelog",
    description: "View version history",
    category: "navigation",
    keywords: ["changelog", "updates", "versions"],
    action: ({ navigate }) => navigate("/changelog"),
  },
];

// ============================================
// SETTINGS NAVIGATION
// ============================================

export const settingsNavigationCommands: Command[] = [
  {
    id: "nav-site-settings",
    label: "Site Settings",
    description: "Configure site settings (Payload CMS)",
    category: "navigation",
    keywords: ["settings", "config", "site"],
    action: ({ navigate }) => navigate("/admin/globals/site-settings"),
    minRole: "admin",
  },
  {
    id: "nav-seo-settings",
    label: "SEO Settings",
    description: "Configure SEO settings (Payload CMS)",
    category: "navigation",
    keywords: ["seo", "settings", "meta"],
    action: ({ navigate }) => navigate("/admin/globals/seo-settings"),
    minRole: "admin",
  },
  {
    id: "nav-crosslink-settings",
    label: "Cross-Link Settings",
    description: "Configure cross-linking (Payload CMS)",
    category: "navigation",
    keywords: ["crosslink", "settings"],
    action: ({ navigate }) => navigate("/admin/globals/cross-link-settings"),
    minRole: "admin",
  },
  {
    id: "nav-gamification-settings",
    label: "Gamification Settings",
    description: "Configure achievements and rewards",
    category: "navigation",
    keywords: ["gamification", "achievements", "settings"],
    action: ({ navigate }) => navigate("/admin/globals/gamification-settings"),
    minRole: "admin",
  },
  {
    id: "nav-ai-pipeline-settings",
    label: "AI Pipeline Settings",
    description: "Configure AI automation (Superadmin only)",
    category: "navigation",
    keywords: ["ai", "pipeline", "settings"],
    action: ({ navigate }) => navigate("/admin/globals/ai-pipeline-settings"),
    minRole: "superadmin",
  },
];
