"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/design-system";
import { FooterLanguageSelector } from "@/components/footer-language-selector";

const APP_VERSION = "0.77.0";

export function Footer() {
  const t = useTranslations("footer");
  const currentYear = new Date().getFullYear();
  const buildId = process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA?.slice(0, 7) || "dev";

  const linkClass = cn(
    "hover:text-gray-900 dark:hover:text-white",
    "transition-colors duration-200"
  );

  const separatorClass = "text-gray-300 dark:text-gray-700";

  return (
    <footer className="border-t border-gray-200 dark:border-[#1a1a1a] bg-gray-50 dark:bg-[#0a0a0a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs text-gray-500 dark:text-gray-500">
          <span>{t("copyright", { year: currentYear })}</span>
          <a
            href="https://github.com/siliconyouth/claude-insider"
            target="_blank"
            rel="noopener noreferrer"
            className={cn("text-gray-600 dark:text-gray-400", linkClass)}
          >
            Vladimir Dukelic
          </a>
          <span className={separatorClass}>·</span>
          <Link href="/privacy" className={linkClass}>
            {t("privacy")}
          </Link>
          <span className={separatorClass}>·</span>
          <Link href="/terms" className={linkClass}>
            {t("terms")}
          </Link>
          <span className={separatorClass}>·</span>
          <Link href="/disclaimer" className={linkClass}>
            {t("disclaimer")}
          </Link>
          <span className={separatorClass}>·</span>
          <Link href="/accessibility" className={linkClass}>
            {t("accessibility")}
          </Link>
          <span className={separatorClass}>·</span>
          <Link href="/changelog" className={linkClass}>
            {t("changelog")}
          </Link>
          <span className={separatorClass}>·</span>
          <FooterLanguageSelector />
          <span className={separatorClass}>·</span>
          <span className="font-mono text-gray-400 dark:text-gray-600">v{APP_VERSION}-{buildId}</span>
        </div>
      </div>
    </footer>
  );
}
