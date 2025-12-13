"use client";

/**
 * Language Switcher Component
 *
 * Dropdown for changing the application language.
 */

import { useState, useRef, useEffect } from "react";
import { useLocale } from "next-intl";
import { cn } from "@/lib/design-system";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";

interface LanguageSwitcherProps {
  className?: string;
  variant?: "dropdown" | "inline" | "compact";
}

export function LanguageSwitcher({
  className,
  variant = "dropdown",
}: LanguageSwitcherProps) {
  const currentLocale = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLocaleChange = (locale: Locale) => {
    // Set cookie and reload
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    window.location.reload();
  };

  if (variant === "inline") {
    return (
      <div className={cn("flex flex-wrap gap-2", className)}>
        {locales.map((locale) => (
          <button
            key={locale}
            onClick={() => handleLocaleChange(locale)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              currentLocale === locale
                ? "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
            )}
          >
            <span className="mr-1.5">{localeFlags[locale]}</span>
            {localeNames[locale]}
          </button>
        ))}
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div ref={dropdownRef} className={cn("relative", className)}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-lg text-sm",
            "text-gray-600 dark:text-gray-400",
            "hover:bg-gray-100 dark:hover:bg-[#1a1a1a]",
            "transition-colors"
          )}
          aria-label="Change language"
        >
          <span>{localeFlags[currentLocale]}</span>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className={cn(
              "w-3 h-3 transition-transform",
              isOpen && "rotate-180"
            )}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </button>

        {isOpen && (
          <div
            className={cn(
              "absolute top-full right-0 mt-1 py-1 z-50",
              "min-w-[120px] rounded-lg",
              "bg-white dark:bg-[#111111]",
              "border border-gray-200 dark:border-[#262626]",
              "shadow-lg",
              "animate-in fade-in slide-in-from-top-1 duration-150"
            )}
          >
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => {
                  handleLocaleChange(locale);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-2 w-full px-3 py-1.5 text-sm text-left",
                  "transition-colors",
                  currentLocale === locale
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                )}
              >
                <span>{localeFlags[locale]}</span>
                <span>{localeNames[locale]}</span>
                {currentLocale === locale && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4 ml-auto"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Default dropdown variant
  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-2 px-3 py-2 rounded-lg text-sm",
          "bg-gray-100 dark:bg-[#111111]",
          "border border-gray-200 dark:border-[#262626]",
          "text-gray-700 dark:text-gray-300",
          "hover:border-blue-500/50",
          "transition-all"
        )}
        aria-label="Change language"
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          className="w-4 h-4"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M10.5 21l5.25-11.25L21 21m-9-3h7.5M3 5.621a48.474 48.474 0 016-.371m0 0c1.12 0 2.233.038 3.334.114M9 5.25V3m3.334 2.364C11.176 10.658 7.69 15.08 3 17.502m9.334-12.138c.896.061 1.785.147 2.666.257m-4.589 8.495a18.023 18.023 0 01-3.827-5.802"
          />
        </svg>
        <span>{localeFlags[currentLocale]}</span>
        <span>{localeNames[currentLocale]}</span>
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className={cn(
            "absolute top-full right-0 mt-2 py-2 z-50",
            "min-w-[180px] rounded-xl",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "shadow-xl",
            "animate-in fade-in slide-in-from-top-2 duration-200"
          )}
        >
          <div className="px-3 py-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
            Select Language
          </div>
          <div className="mt-1">
            {locales.map((locale) => (
              <button
                key={locale}
                onClick={() => {
                  handleLocaleChange(locale);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 w-full px-3 py-2 text-sm text-left",
                  "transition-colors",
                  currentLocale === locale
                    ? "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20"
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
                )}
              >
                <span className="text-lg">{localeFlags[locale]}</span>
                <span className="flex-1">{localeNames[locale]}</span>
                {currentLocale === locale && (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                    className="w-4 h-4"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M4.5 12.75l6 6 9-13.5"
                    />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
