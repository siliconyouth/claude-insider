"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/design-system";
import { FooterLanguageSelector } from "@/components/footer-language-selector";
import { SoundToggle } from "@/components/sound-toggle";
import { MonochromeLogo } from "@/components/monochrome-logo";
import { ThemeToggle } from "@/components/theme-toggle";

const APP_VERSION = "1.10.8";

// Type definitions for footer links
interface FooterLink {
  href: string;
  label?: string;
  labelKey?: string;
  badge?: string;
  highlight?: boolean;
  external?: boolean;
}

interface FooterColumn {
  titleKey: string;
  links: FooterLink[];
}

type FooterColumnKeys = "features" | "documentation" | "resources" | "project" | "legal";

// Footer column configuration
const footerColumns: Record<FooterColumnKeys, FooterColumn> = {
  features: {
    titleKey: "features",
    links: [
      { href: "/docs", labelKey: "documentation" },
      { href: "/resources", labelKey: "resources" },
      { href: "/playground", label: "Playground" },
      { href: "/prompts", label: "Prompt Library" },
      { href: "/assistant", label: "Ask AI", badge: "New" },
      { href: "/messages", label: "Chat" },
    ],
  },
  documentation: {
    titleKey: "documentationTitle",
    links: [
      { href: "/docs/getting-started", labelKey: "gettingStarted" },
      { href: "/docs/configuration", labelKey: "configuration" },
      { href: "/docs/api", labelKey: "apiReference" },
      { href: "/docs/tips-and-tricks", labelKey: "tipsTricks" },
      { href: "/docs/tutorials", labelKey: "tutorials" },
      { href: "/docs/examples", labelKey: "examples" },
    ],
  },
  resources: {
    titleKey: "resourcesTitle",
    links: [
      { href: "/resources/mcp-servers", label: "MCP Servers", badge: "1,950+" },
      { href: "/resources/tools", label: "Tools & SDKs" },
      { href: "/resources/rules", label: "CLAUDE.md Rules" },
      { href: "/resources/prompts", label: "Prompts" },
      { href: "/resources/showcases", label: "Showcases" },
      { href: "/resources/community", label: "Community" },
    ],
  },
  project: {
    titleKey: "project",
    links: [
      { href: "https://github.com/siliconyouth/claude-insider", label: "GitHub", external: true },
      { href: "/changelog", labelKey: "changelog" },
      { href: "/stats", label: "Stats" },
      { href: "/design-system", label: "Design System" },
      { href: "/users", label: "Members" },
      { href: "/donate", labelKey: "donate", highlight: true },
    ],
  },
  legal: {
    titleKey: "legal",
    links: [
      { href: "/privacy", labelKey: "privacy" },
      { href: "/terms", labelKey: "terms" },
      { href: "/disclaimer", labelKey: "disclaimer" },
      { href: "/accessibility", labelKey: "accessibility" },
    ],
  },
};

// Social links
const socialLinks = [
  {
    href: "https://github.com/siliconyouth/claude-insider",
    label: "GitHub",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    href: "https://x.com/claudeinsider",
    label: "X (Twitter)",
    icon: (
      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
];

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();
  const buildId = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

  const linkClass = cn(
    "text-sm text-gray-600 dark:text-gray-400",
    "hover:text-gray-900 dark:hover:text-white",
    "transition-colors duration-200"
  );

  const columnTitleClass = cn(
    "text-sm font-semibold text-gray-900 dark:text-white",
    "mb-4"
  );

  return (
    <footer className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0a0a0a]">
      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-3 lg:grid-cols-6">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1">
            <Link
              href="/"
              className="inline-flex flex-col mb-4 hover:opacity-80 transition-opacity"
              aria-label="Claude Insider home"
            >
              <MonochromeLogo size={32} className="mb-2" />
              <span className="text-lg font-semibold text-gray-900 dark:text-white">
                Claude Insider
              </span>
            </Link>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6 max-w-xs">
              {t("tagline")}
            </p>
            {/* Social Links */}
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Features Column */}
          <div>
            <h3 className={columnTitleClass}>{t(footerColumns.features.titleKey)}</h3>
            <ul className="space-y-3">
              {footerColumns.features.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={cn(linkClass, "flex items-center gap-2")}>
                    {link.labelKey ? t(link.labelKey) : link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-semibold rounded bg-gradient-to-r from-violet-500 to-blue-500 text-white">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Documentation Column */}
          <div>
            <h3 className={columnTitleClass}>{t(footerColumns.documentation.titleKey)}</h3>
            <ul className="space-y-3">
              {footerColumns.documentation.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.labelKey ? t(link.labelKey) : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className={columnTitleClass}>{t(footerColumns.resources.titleKey)}</h3>
            <ul className="space-y-3">
              {footerColumns.resources.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={cn(linkClass, "flex items-center gap-2")}>
                    {link.labelKey ? t(link.labelKey) : link.label}
                    {link.badge && (
                      <span className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-cyan-400">
                        {link.badge}
                      </span>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Project Column */}
          <div>
            <h3 className={columnTitleClass}>{t(footerColumns.project.titleKey)}</h3>
            <ul className="space-y-3">
              {footerColumns.project.links.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cn(linkClass, "flex items-center gap-1")}
                    >
                      {link.labelKey ? t(link.labelKey) : link.label}
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                      </svg>
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className={cn(
                        linkClass,
                        link.highlight && "text-pink-500 hover:text-rose-500 dark:text-pink-500 dark:hover:text-rose-400 flex items-center gap-1"
                      )}
                    >
                      {link.highlight && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                      )}
                      {link.labelKey ? t(link.labelKey) : link.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Legal Column */}
          <div>
            <h3 className={columnTitleClass}>{t(footerColumns.legal.titleKey)}</h3>
            <ul className="space-y-3">
              {footerColumns.legal.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className={linkClass}>
                    {link.labelKey ? t(link.labelKey) : link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-200 dark:border-[#1a1a1a]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            {/* Copyright */}
            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-500">
              <Link
                href="/"
                className="hover:opacity-80 transition-opacity"
                aria-label="Claude Insider home"
              >
                <MonochromeLogo size={16} />
              </Link>
              <span>
                © {currentYear} {t("copyrightShort")}
              </span>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-700">·</span>
              <a
                href="https://github.com/siliconyouth/claude-insider"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:inline hover:text-gray-900 dark:hover:text-white transition-colors"
              >
                Vladimir Dukelic
              </a>
              <span className="hidden sm:inline text-gray-300 dark:text-gray-700">·</span>
              <span className="hidden sm:inline font-mono text-gray-400 dark:text-gray-600">
                v{APP_VERSION}-{buildId}
              </span>
            </div>

            {/* Utilities */}
            <div className="flex items-center gap-2">
              <FooterLanguageSelector />
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <SoundToggle />
              <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
