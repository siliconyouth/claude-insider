"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/design-system";
import { FooterLanguageSelector } from "@/components/footer-language-selector";
import { SoundToggle } from "@/components/sound-toggle";

const APP_VERSION = "1.2.0";

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
          <Link
            href="/donate"
            className={cn(linkClass, "text-pink-500 dark:text-pink-400 hover:text-pink-600 dark:hover:text-pink-300 flex items-center gap-1")}
          >
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
            {t("donate")}
          </Link>
          <span className={separatorClass}>·</span>
          <FooterLanguageSelector />
          <span className={separatorClass}>·</span>
          <SoundToggle />
          <span className={separatorClass}>·</span>
          <span className="font-mono text-gray-400 dark:text-gray-600">v{APP_VERSION}-{buildId}</span>
        </div>
      </div>
    </footer>
  );
}
