"use client";

import { useState, useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { locales, localeNames, localeFlags, type Locale } from "@/i18n/config";

export function LanguageSelector() {
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
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000`;
    setIsOpen(false);
    window.location.reload();
  };

  const multipleLocalesAvailable = locales.length > 1;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => multipleLocalesAvailable && setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${
          multipleLocalesAvailable
            ? "hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer"
            : "cursor-default opacity-80"
        }`}
        title={
          multipleLocalesAvailable
            ? "Select language"
            : "More languages coming soon"
        }
        aria-haspopup={multipleLocalesAvailable ? "listbox" : undefined}
        aria-expanded={multipleLocalesAvailable ? isOpen : undefined}
      >
        <span className="text-base" aria-hidden="true">
          {localeFlags[currentLocaleCode]}
        </span>
        <span className="hidden sm:inline">{localeNames[currentLocaleCode]}</span>
        {multipleLocalesAvailable && (
          <svg
            className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`}
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
        )}
      </button>

      {/* Dropdown menu (only shown when multiple locales are available) */}
      {isOpen && multipleLocalesAvailable && (
        <div
          className="absolute right-0 mt-1 py-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50"
          role="listbox"
          aria-label="Select language"
        >
          {locales.map((locale) => (
            <button
              key={locale}
              onClick={() => handleLocaleChange(locale)}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors ${
                locale === currentLocaleCode
                  ? "bg-blue-500/10 text-blue-600 dark:text-cyan-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              role="option"
              aria-selected={locale === currentLocaleCode}
            >
              <span className="text-base" aria-hidden="true">
                {localeFlags[locale]}
              </span>
              <span>{localeNames[locale]}</span>
              {locale === currentLocaleCode && (
                <svg
                  className="w-4 h-4 ml-auto text-cyan-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
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
