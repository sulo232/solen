import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { locales, defaultLocale } from "@/i18n";
import LocaleNotFound from "./[locale]/not-found";

/**
 * ia-navigation-02: this is the ROOT not-found.tsx (sits above the [locale]
 * segment, so it renders for a request that never got a locale prefix added,
 * e.g. a bot probing "/wp-login.php" or ".env" which middleware.ts's static-file
 * check waves through without the locale redirect). There is exactly ONE 404
 * experience for the whole app (app/[locale]/not-found.tsx, LOCKFILE §15.3);
 * this file renders THAT SAME component (not a hand-rolled, hardcoded variant)
 * wrapped in the locale provider it expects, no visual change from what's
 * already shipped and approved. Locale is derived from the `x-pathname` header
 * middleware.ts stamps on every request, the same pattern app/layout.tsx
 * already uses for <html lang>, since this route has no [locale] param.
 */
export default async function NotFound() {
  const pathname = (await headers()).get("x-pathname") ?? "";
  const locale = locales.find((l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)) ?? defaultLocale;
  const messages = (await import(`@/messages/${locale}.json`)).default;

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleNotFound />
    </NextIntlClientProvider>
  );
}
