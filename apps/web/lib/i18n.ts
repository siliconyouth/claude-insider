export interface Locale {
  code: string;
  name: string;
  flag: string;
  nativeName: string;
}

/**
 * Available locales for the application
 * Currently only English (US) is active
 * Future locales are commented out for reference
 */
export const locales: Locale[] = [
  { code: "en-US", name: "English (US)", flag: "🇺🇸", nativeName: "English" },
  // Future locales (commented for now):
  // { code: "es", name: "Spanish", flag: "🇪🇸", nativeName: "Español" },
  // { code: "fr", name: "French", flag: "🇫🇷", nativeName: "Français" },
  // { code: "de", name: "German", flag: "🇩🇪", nativeName: "Deutsch" },
  // { code: "ja", name: "Japanese", flag: "🇯🇵", nativeName: "日本語" },
  // { code: "zh", name: "Chinese", flag: "🇨🇳", nativeName: "中文" },
  // { code: "pt-BR", name: "Portuguese (Brazil)", flag: "🇧🇷", nativeName: "Português" },
  // { code: "ko", name: "Korean", flag: "🇰🇷", nativeName: "한국어" },
];

export const defaultLocale = locales[0];

const LOCALE_STORAGE_KEY = "claude-insider-locale";

/**
 * Get the current locale from localStorage or return default
 */
export function getCurrentLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;

  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored) {
      const found = locales.find((l) => l.code === stored);
      if (found) return found;
    }
  } catch {
    // Silently fail if localStorage is unavailable
  }

  return defaultLocale;
}

/**
 * Set the current locale in localStorage
 */
export function setLocale(code: string): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(LOCALE_STORAGE_KEY, code);
  } catch {
    // Silently fail if localStorage is unavailable
  }
}

/**
 * Check if multiple locales are available
 */
export function hasMultipleLocales(): boolean {
  return locales.length > 1;
}
