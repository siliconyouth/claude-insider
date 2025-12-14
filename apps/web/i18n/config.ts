/**
 * Internationalization Configuration
 *
 * Defines supported locales and default language settings.
 * 18 languages: 8 original + 10 European additions
 */

export const locales = [
  // Original 8 languages
  "en", "es", "fr", "de", "ja", "zh", "ko", "pt",
  // New European languages (10)
  "sr", "ru", "it", "nl", "pl", "sv", "no", "da", "fi", "el"
] as const;

export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const localeNames: Record<Locale, string> = {
  // Original
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  ja: "日本語",
  zh: "中文",
  ko: "한국어",
  pt: "Português",
  // New European
  sr: "Српски",
  ru: "Русский",
  it: "Italiano",
  nl: "Nederlands",
  pl: "Polski",
  sv: "Svenska",
  no: "Norsk",
  da: "Dansk",
  fi: "Suomi",
  el: "Ελληνικά",
};

export const localeFlags: Record<Locale, string> = {
  // Original
  en: "🇺🇸",
  es: "🇪🇸",
  fr: "🇫🇷",
  de: "🇩🇪",
  ja: "🇯🇵",
  zh: "🇨🇳",
  ko: "🇰🇷",
  pt: "🇧🇷",
  // New European
  sr: "🇷🇸",
  ru: "🇷🇺",
  it: "🇮🇹",
  nl: "🇳🇱",
  pl: "🇵🇱",
  sv: "🇸🇪",
  no: "🇳🇴",
  da: "🇩🇰",
  fi: "🇫🇮",
  el: "🇬🇷",
};

// Language regions for grouping in UI
export const localeRegions: Record<string, Locale[]> = {
  americas: ["en", "es", "pt"],
  europe: ["fr", "de", "it", "nl", "pl", "sv", "no", "da", "fi", "el", "sr", "ru"],
  asia: ["ja", "zh", "ko"],
};

// RTL languages (none currently)
export const rtlLocales: Locale[] = [];

export function isRTL(locale: Locale): boolean {
  return rtlLocales.includes(locale);
}
