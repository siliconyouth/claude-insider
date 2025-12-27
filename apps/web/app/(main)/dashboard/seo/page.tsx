"use client";

/**
 * SEO Dashboard
 *
 * Comprehensive SEO management dashboard with:
 * - Current configuration overview
 * - Meta tag preview
 * - Sitemap & robots.txt status
 * - Structured data validation
 * - Social media preview cards
 * - Search engine verification status
 */

import { useState, useEffect } from "react";
import Link from "next/link";
import { cn } from "@/lib/design-system";
import { SEO_CONSTANTS } from "@/lib/seo-config";

interface SEOCheckResult {
  name: string;
  status: "success" | "warning" | "error" | "loading";
  message: string;
  link?: string;
}

interface MetaPreview {
  title: string;
  description: string;
  url: string;
  image: string;
}

// Icons
const icons = {
  check: (
    <svg className="w-5 h-5 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  error: (
    <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 text-gray-400 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  ),
  external: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  ),
  refresh: (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  ),
  globe: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  ),
  code: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
    </svg>
  ),
  share: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  ),
  settings: (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
};

// Status badge component
function StatusBadge({ status }: { status: SEOCheckResult["status"] }) {
  const statusConfig = {
    success: { icon: icons.check, bg: "bg-emerald-500/10", text: "text-emerald-500" },
    warning: { icon: icons.warning, bg: "bg-amber-500/10", text: "text-amber-500" },
    error: { icon: icons.error, bg: "bg-red-500/10", text: "text-red-500" },
    loading: { icon: icons.loading, bg: "bg-gray-500/10", text: "text-gray-500" },
  };

  const config = statusConfig[status];
  return (
    <span className={cn("p-1.5 rounded-lg", config.bg)}>
      {config.icon}
    </span>
  );
}

// SEO Check Item component
function SEOCheckItem({ check }: { check: SEOCheckResult }) {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
      <div className="flex items-center gap-3">
        <StatusBadge status={check.status} />
        <div>
          <p className="text-sm font-medium text-white">{check.name}</p>
          <p className="text-xs text-gray-400">{check.message}</p>
        </div>
      </div>
      {check.link && (
        <a
          href={check.link}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-lg hover:bg-gray-700/50 text-gray-400 hover:text-white transition-colors"
        >
          {icons.external}
        </a>
      )}
    </div>
  );
}

// Google Search Preview component
function GooglePreview({ meta }: { meta: MetaPreview }) {
  return (
    <div className="p-4 rounded-lg bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-600 to-cyan-600 flex items-center justify-center">
          <span className="text-[10px] font-bold text-white">Ci</span>
        </div>
        <div>
          <p className="text-sm text-gray-800 dark:text-gray-200">{SEO_CONSTANTS.SITE_NAME}</p>
          <p className="text-xs text-gray-500">{meta.url}</p>
        </div>
      </div>
      <h3 className="text-lg text-blue-600 dark:text-blue-400 hover:underline cursor-pointer line-clamp-1">
        {meta.title}
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{meta.description}</p>
    </div>
  );
}

// Social Card Preview component
function SocialPreview({ meta, platform }: { meta: MetaPreview; platform: "twitter" | "facebook" | "linkedin" }) {
  const platformConfig = {
    twitter: { name: "Twitter/X", bg: "bg-black", border: "border-gray-700" },
    facebook: { name: "Facebook", bg: "bg-[#1877f2]/10", border: "border-[#1877f2]/30" },
    linkedin: { name: "LinkedIn", bg: "bg-[#0077b5]/10", border: "border-[#0077b5]/30" },
  };

  const config = platformConfig[platform];

  return (
    <div className={cn("rounded-lg overflow-hidden border", config.border)}>
      <div className="aspect-[1.91/1] bg-gradient-to-br from-violet-600/20 via-blue-600/20 to-cyan-600/20 flex items-center justify-center">
        <span className="text-4xl font-bold text-white/20">OG Image</span>
      </div>
      <div className={cn("p-3", config.bg)}>
        <p className="text-xs text-gray-500 uppercase mb-1">{new URL(meta.url).hostname}</p>
        <h4 className="text-sm font-medium text-white line-clamp-1">{meta.title}</h4>
        <p className="text-xs text-gray-400 line-clamp-2">{meta.description}</p>
      </div>
    </div>
  );
}

export default function SEODashboard() {
  const [checks, setChecks] = useState<SEOCheckResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [testUrl, setTestUrl] = useState(SEO_CONSTANTS.SITE_URL);

  // Default meta preview
  const metaPreview: MetaPreview = {
    title: SEO_CONSTANTS.SITE_NAME,
    description: SEO_CONSTANTS.SITE_DESCRIPTION,
    url: SEO_CONSTANTS.SITE_URL,
    image: `${SEO_CONSTANTS.SITE_URL}/api/og`,
  };

  // Run SEO checks
  const runChecks = async () => {
    setIsRunning(true);

    const newChecks: SEOCheckResult[] = [
      { name: "Loading...", status: "loading", message: "Running SEO checks..." },
    ];
    setChecks(newChecks);

    const results: SEOCheckResult[] = [];

    // Check sitemap.xml
    try {
      const sitemapRes = await fetch("/sitemap.xml", { method: "HEAD" });
      results.push({
        name: "Sitemap",
        status: sitemapRes.ok ? "success" : "error",
        message: sitemapRes.ok ? "sitemap.xml is accessible" : "sitemap.xml not found",
        link: "/sitemap.xml",
      });
    } catch {
      results.push({
        name: "Sitemap",
        status: "error",
        message: "Failed to check sitemap.xml",
      });
    }

    // Check robots.txt
    try {
      const robotsRes = await fetch("/robots.txt", { method: "HEAD" });
      results.push({
        name: "Robots.txt",
        status: robotsRes.ok ? "success" : "error",
        message: robotsRes.ok ? "robots.txt is accessible" : "robots.txt not found",
        link: "/robots.txt",
      });
    } catch {
      results.push({
        name: "Robots.txt",
        status: "error",
        message: "Failed to check robots.txt",
      });
    }

    // Check manifest.json
    try {
      const manifestRes = await fetch("/manifest.json", { method: "HEAD" });
      results.push({
        name: "Web Manifest",
        status: manifestRes.ok ? "success" : "warning",
        message: manifestRes.ok ? "manifest.json is accessible" : "manifest.json not found (optional)",
        link: "/manifest.json",
      });
    } catch {
      results.push({
        name: "Web Manifest",
        status: "warning",
        message: "manifest.json not found (optional)",
      });
    }

    // Check OG image endpoint
    try {
      const ogRes = await fetch("/api/og", { method: "HEAD" });
      results.push({
        name: "OG Image API",
        status: ogRes.ok ? "success" : "warning",
        message: ogRes.ok ? "OG image endpoint is working" : "OG image endpoint returned error",
        link: "/api/og",
      });
    } catch {
      results.push({
        name: "OG Image API",
        status: "warning",
        message: "OG image endpoint check failed",
      });
    }

    // Check RSS feed
    try {
      const rssRes = await fetch("/rss.xml", { method: "HEAD" });
      results.push({
        name: "RSS Feed",
        status: rssRes.ok ? "success" : "warning",
        message: rssRes.ok ? "RSS feed is accessible" : "RSS feed not found (optional)",
        link: "/rss.xml",
      });
    } catch {
      results.push({
        name: "RSS Feed",
        status: "warning",
        message: "RSS feed not found (optional)",
      });
    }

    // Static checks
    results.push({
      name: "HTTPS",
      status: SEO_CONSTANTS.SITE_URL.startsWith("https://") ? "success" : "error",
      message: SEO_CONSTANTS.SITE_URL.startsWith("https://") ? "Site uses HTTPS" : "Site should use HTTPS",
    });

    results.push({
      name: "WWW Redirect",
      status: SEO_CONSTANTS.SITE_URL.includes("www.") ? "success" : "warning",
      message: SEO_CONSTANTS.SITE_URL.includes("www.") ? "Using www subdomain" : "Consider using www for consistency",
    });

    results.push({
      name: "Title Length",
      status: SEO_CONSTANTS.SITE_NAME.length <= 60 ? "success" : "warning",
      message: `${SEO_CONSTANTS.SITE_NAME.length}/60 characters`,
    });

    results.push({
      name: "Description Length",
      status: SEO_CONSTANTS.SITE_DESCRIPTION.length <= 160 ? "success" : "warning",
      message: `${SEO_CONSTANTS.SITE_DESCRIPTION.length}/160 characters`,
    });

    setChecks(results);
    setIsRunning(false);
  };

  // Run checks on mount
  useEffect(() => {
    runChecks();
  }, []);

  // Quick stats
  const successCount = checks.filter((c) => c.status === "success").length;
  const warningCount = checks.filter((c) => c.status === "warning").length;
  const errorCount = checks.filter((c) => c.status === "error").length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">SEO Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Manage search engine optimization settings and validate your site&apos;s SEO health
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={runChecks}
            disabled={isRunning}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white",
              "border border-gray-700",
              isRunning && "opacity-50 cursor-not-allowed"
            )}
          >
            <span className={cn(isRunning && "animate-spin")}>{icons.refresh}</span>
            Re-run Checks
          </button>
          <Link
            href="/admin/globals/seo-settings"
            target="_blank"
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              "bg-gradient-to-r from-violet-600 to-cyan-600 text-white",
              "hover:from-violet-500 hover:to-cyan-500",
              "shadow-lg shadow-blue-500/25"
            )}
          >
            {icons.settings}
            Edit SEO Settings
          </Link>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
          <div className="flex items-center gap-3">
            {icons.check}
            <div>
              <p className="text-2xl font-bold text-emerald-500">{successCount}</p>
              <p className="text-sm text-emerald-400/80">Checks Passed</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <div className="flex items-center gap-3">
            {icons.warning}
            <div>
              <p className="text-2xl font-bold text-amber-500">{warningCount}</p>
              <p className="text-sm text-amber-400/80">Warnings</p>
            </div>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
          <div className="flex items-center gap-3">
            {icons.error}
            <div>
              <p className="text-2xl font-bold text-red-500">{errorCount}</p>
              <p className="text-sm text-red-400/80">Issues Found</p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Link
          href="/admin/globals/seo-settings"
          target="_blank"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800 transition-all group"
        >
          <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">
            {icons.settings}
          </span>
          <span className="text-sm text-gray-300">SEO Settings</span>
        </Link>
        <Link
          href="/admin/collections/documents"
          target="_blank"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800 transition-all group"
        >
          <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">
            {icons.globe}
          </span>
          <span className="text-sm text-gray-300">Documents SEO</span>
        </Link>
        <Link
          href="/admin/collections/resources"
          target="_blank"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800 transition-all group"
        >
          <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">
            {icons.code}
          </span>
          <span className="text-sm text-gray-300">Resources SEO</span>
        </Link>
        <a
          href="https://search.google.com/search-console"
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800 transition-all group"
        >
          <span className="text-gray-400 group-hover:text-cyan-400 transition-colors">
            {icons.share}
          </span>
          <span className="text-sm text-gray-300">Search Console</span>
        </a>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* SEO Checks */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-blue-500/10">{icons.check}</span>
            SEO Health Checks
          </h2>
          <div className="space-y-2">
            {checks.map((check, index) => (
              <SEOCheckItem key={index} check={check} />
            ))}
          </div>
        </div>

        {/* Previews */}
        <div className="space-y-6">
          {/* Google Preview */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10">{icons.globe}</span>
              Google Search Preview
            </h2>
            <GooglePreview meta={metaPreview} />
          </div>

          {/* Social Previews */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10">{icons.share}</span>
              Social Media Previews
            </h2>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <p className="text-xs text-gray-500 mb-2">Twitter/X</p>
                <SocialPreview meta={metaPreview} platform="twitter" />
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Facebook</p>
                <SocialPreview meta={metaPreview} platform="facebook" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Configuration Overview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-500/10">{icons.settings}</span>
          Current Configuration
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Site Name</p>
            <p className="text-white font-medium">{SEO_CONSTANTS.SITE_NAME}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Canonical URL</p>
            <p className="text-white font-medium truncate">{SEO_CONSTANTS.SITE_URL}</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Title Max Length</p>
            <p className="text-white font-medium">{SEO_CONSTANTS.TITLE_MAX_LENGTH} characters</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Description Max Length</p>
            <p className="text-white font-medium">{SEO_CONSTANTS.DESCRIPTION_MAX_LENGTH} characters</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">OG Image Size</p>
            <p className="text-white font-medium">{SEO_CONSTANTS.OG_IMAGE_WIDTH} x {SEO_CONSTANTS.OG_IMAGE_HEIGHT}px</p>
          </div>
          <div className="p-4 rounded-xl bg-gray-800/50 border border-gray-700/50">
            <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Collections with SEO</p>
            <p className="text-white font-medium">documents, resources</p>
          </div>
        </div>
      </div>

      {/* External Tools */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-blue-500/10">{icons.external}</span>
          External SEO Tools
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { name: "Google Search Console", url: "https://search.google.com/search-console" },
            { name: "Bing Webmaster", url: "https://www.bing.com/webmasters" },
            { name: "Yandex Webmaster", url: "https://webmaster.yandex.com" },
            { name: "Rich Results Test", url: `https://search.google.com/test/rich-results?url=${encodeURIComponent(SEO_CONSTANTS.SITE_URL)}` },
            { name: "PageSpeed Insights", url: `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SEO_CONSTANTS.SITE_URL)}` },
            { name: "Schema Validator", url: "https://validator.schema.org" },
          ].map((tool) => (
            <a
              key={tool.name}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 p-3 rounded-lg bg-gray-800/50 border border-gray-700/50 hover:border-blue-500/30 hover:bg-gray-800 transition-all text-sm text-gray-300 hover:text-white"
            >
              {tool.name}
              {icons.external}
            </a>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <h3 className="text-sm font-medium text-blue-400 mb-2">How to Use</h3>
        <ul className="text-sm text-blue-300/80 space-y-1 list-disc list-inside">
          <li><strong>SEO Settings:</strong> Edit global SEO configuration in Payload CMS at /admin/globals/seo-settings</li>
          <li><strong>Per-Page SEO:</strong> Edit SEO fields on individual documents and resources in Payload CMS</li>
          <li><strong>JSON-LD:</strong> Structured data is automatically generated using next-seo components</li>
          <li><strong>IndexNow:</strong> Enable in SEO Settings to push URL changes to search engines instantly</li>
        </ul>
      </div>
    </div>
  );
}
