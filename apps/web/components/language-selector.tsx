"use client";

import { useState, useEffect, useRef } from "react";
import {
  locales,
  getCurrentLocale,
  setLocale,
  hasMultipleLocales,
  Locale,
  defaultLocale,
} from "@/lib/i18n";

export function LanguageSelector() {
  const [currentLocale, setCurrentLocale] = useState<Locale>(defaultLocale);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load saved locale on mount
  useEffect(() => {
    setCurrentLocale(getCurrentLocale());
  }, []);

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

  // Handle locale change
  const handleLocaleChange = (locale: Locale) => {
    setLocale(locale.code);
    setCurrentLocale(locale);
    setIsOpen(false);
    // Future: trigger page refresh or content reload for i18n
  };

  const multipleLocalesAvailable = hasMultipleLocales();

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => multipleLocalesAvailable && setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1.5 text-sm text-gray-600 dark:text-gray-400 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-950 ${
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
          {currentLocale.flag}
        </span>
        <span className="hidden sm:inline">{currentLocale.name}</span>
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
              key={locale.code}
              onClick={() => handleLocaleChange(locale)}
              className={`w-full px-3 py-2 text-left flex items-center gap-2 text-sm transition-colors ${
                locale.code === currentLocale.code
                  ? "bg-orange-500/10 text-orange-600 dark:text-orange-400"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
              role="option"
              aria-selected={locale.code === currentLocale.code}
            >
              <span className="text-base" aria-hidden="true">
                {locale.flag}
              </span>
              <span>{locale.name}</span>
              {locale.code === currentLocale.code && (
                <svg
                  className="w-4 h-4 ml-auto text-orange-500"
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
