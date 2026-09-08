import { locales, defaultLocale, type Locale } from "@/lib/locale-constants";

/**
 * Reads the locale segment off a pathname (e.g. "/fr/salon" -> "fr").
 * Falls back to the default locale when the first segment isn't one of
 * the supported locales. Used by app/error.tsx, which sits outside the
 * [locale] route segment and has no next-intl provider above it, so it
 * can't call useLocale() and has to read the URL directly on the client.
 */
export function detectLocaleFromPathname(pathname: string): Locale {
  const first = pathname.split("/")[1];
  return (locales as readonly string[]).includes(first)
    ? (first as Locale)
    : defaultLocale;
}
