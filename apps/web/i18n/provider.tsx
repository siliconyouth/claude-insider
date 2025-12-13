"use client";

/**
 * i18n Provider
 *
 * Wraps the application with next-intl context.
 */

import { NextIntlClientProvider, AbstractIntlMessages } from "next-intl";
import { type ReactNode } from "react";

interface I18nProviderProps {
  children: ReactNode;
  locale: string;
  messages: AbstractIntlMessages;
}

export function I18nProvider({ children, locale, messages }: I18nProviderProps) {
  return (
    <NextIntlClientProvider
      locale={locale}
      messages={messages}
      timeZone="UTC"
      now={new Date()}
    >
      {children}
    </NextIntlClientProvider>
  );
}
