import { getRequestConfig } from "next-intl/server";

// seo-comms-12 (2026-07-27): locales/Locale/defaultLocale now live in
// lib/locale-constants.ts (a next-intl/server-free module) so a client component can
// import them without pulling next-intl/server into the client bundle. Re-exported here
// unchanged so every existing `from "./i18n"` import (middleware.ts included) keeps working.
export { locales, defaultLocale } from "./lib/locale-constants";
export type { Locale } from "./lib/locale-constants";
import { defaultLocale } from "./lib/locale-constants";

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? defaultLocale;
  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
