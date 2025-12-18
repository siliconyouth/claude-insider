"use client";

/**
 * Footer Language Selector
 *
 * Displays all 18 supported languages in a compact grid layout
 * positioned in the footer for easy access without cluttering the header.
 */

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import {
  localeNames,
  localeFlags,
  localeRegions,
  type Locale,
} from "@/i18n/config";
import { cn } from "@/lib/design-system";

export function FooterLanguageSelector() {
  const currentLocaleCode = useLocale() as Locale;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
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

  // Handle locale change - set cookie and reload
  const handleLocaleChange = (locale: Locale) => {
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    setIsOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex items-center gap-1.5 px-2 py-1 text-xs",
          "text-gray-500 dark:text-gray-500 rounded-md transition-colors",
          "hover:text-gray-900 dark:hover:text-white",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        )}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-label={`${localeNames[currentLocaleCode]}, select language`}
      >
        <span className="text-sm" aria-hidden="true">
          {localeFlags[currentLocaleCode]}
        </span>
        <span>{localeNames[currentLocaleCode]}</span>
        <svg
          className={cn(
            "w-3 h-3 transition-transform",
            isOpen && "rotate-180"
          )}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {/* Language Grid Dropdown */}
      {isOpen && (
        <div
          className={cn(
            "absolute bottom-full mb-2 left-1/2 -translate-x-1/2",
            "w-[420px] max-w-[90vw] p-4",
            "bg-white dark:bg-[#111111]",
            "border border-gray-200 dark:border-[#262626]",
            "rounded-xl shadow-lg",
            "animate-fade-in z-50"
          )}
          role="listbox"
          aria-label="Select language"
        >
          {/* Region: Americas */}
          <div className="mb-3">
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-2">
              Americas
            </h3>
            <div className="grid grid-cols-3 gap-1">
              {(localeRegions.americas ?? []).map((locale) => (
                <LanguageButton
                  key={locale}
                  locale={locale}
                  isActive={locale === currentLocaleCode}
                  onClick={() => handleLocaleChange(locale)}
                />
              ))}
            </div>
          </div>

          {/* Region: Europe */}
          <div className="mb-3">
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-2">
              Europe
            </h3>
            <div className="grid grid-cols-4 gap-1">
              {(localeRegions.europe ?? []).map((locale) => (
                <LanguageButton
                  key={locale}
                  locale={locale}
                  isActive={locale === currentLocaleCode}
                  onClick={() => handleLocaleChange(locale)}
                />
              ))}
            </div>
          </div>

          {/* Region: Asia */}
          <div>
            <h3 className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-600 mb-2">
              Asia
            </h3>
            <div className="grid grid-cols-3 gap-1">
              {(localeRegions.asia ?? []).map((locale) => (
                <LanguageButton
                  key={locale}
                  locale={locale}
                  isActive={locale === currentLocaleCode}
                  onClick={() => handleLocaleChange(locale)}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LanguageButton({
  locale,
  isActive,
  onClick,
}: {
  locale: Locale;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs",
        "transition-all duration-200",
        isActive
          ? "bg-gradient-to-r from-violet-600/10 via-blue-600/10 to-cyan-600/10 text-blue-600 dark:text-cyan-400 ring-1 ring-blue-500/30"
          : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-[#1a1a1a]"
      )}
      role="option"
      aria-selected={isActive}
    >
      <span className="text-sm" aria-hidden="true">
        {localeFlags[locale]}
      </span>
      <span className="truncate">{localeNames[locale]}</span>
    </button>
  );
}
