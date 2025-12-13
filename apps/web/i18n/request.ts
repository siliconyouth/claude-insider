/**
 * i18n Request Configuration
 *
 * Server-side configuration for next-intl.
 */

import { getRequestConfig } from "next-intl/server";
import { cookies, headers } from "next/headers";
import { defaultLocale, locales, type Locale } from "./config";

export default getRequestConfig(async () => {
  // Try to get locale from cookie first
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get("NEXT_LOCALE")?.value;

  // Then try Accept-Language header
  const headersList = await headers();
  const acceptLanguage = headersList.get("accept-language");

  let locale: Locale = defaultLocale;

  // Check cookie
  if (localeCookie && locales.includes(localeCookie as Locale)) {
    locale = localeCookie as Locale;
  }
  // Check Accept-Language header
  else if (acceptLanguage) {
    const preferredLocale = acceptLanguage
      .split(",")
      .map((lang) => lang.split(";")[0]?.trim().split("-")[0])
      .find((lang) => locales.includes(lang as Locale));

    if (preferredLocale) {
      locale = preferredLocale as Locale;
    }
  }

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
