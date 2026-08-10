import { getRequestConfig } from "next-intl/server";

// seo-comms-12 (2026-07-27): locales/Locale/defaultLocale now live in
// lib/locale-constants.ts (a next-intl/server-free module) so a client component can
// import them without pulling next-intl/server into the client bundle. Re-exported here
// unchanged so every existing `from "./i18n"` import (middleware.ts included) keeps working.
export { locales, defaultLocale } from "./lib/locale-constants";
export type { Locale } from "./lib/locale-constants";
import { defaultLocale } from "./lib/locale-constants";

// copy-i18n-07: next-intl's un-configured default is to console.error and render
// the bare "namespace.key" dotted path as the visible fallback text for a missing
// message, so a translator/merge gap that skips the check-i18n-parity.mjs CI gate
// still ships a raw key path to a real visitor. `getMessageFallback` below falls
// back to the German (source-of-truth locale) string instead, and `onError` logs
// the miss server-side so it is caught in monitoring rather than only in a build
// log nobody reads. This is the runtime safety net; check-i18n-parity.mjs (wired
// into the `i18n` CI job) is the actual gate meant to stop the gap from merging.
function getNestedString(messages: unknown, path: string): string | undefined {
  const value = path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, messages);
  return typeof value === "string" ? value : undefined;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? defaultLocale;
  const messages = (await import(`./messages/${locale}.json`)).default;
  const deMessages = locale === "de" ? messages : (await import("./messages/de.json")).default;

  return {
    locale,
    messages,
    onError(error) {
      console.error(`[i18n] ${error.code} (locale=${locale}):`, error.originalMessage ?? error.message);
    },
    getMessageFallback({ error, key, namespace }) {
      const path = namespace ? `${namespace}.${key}` : key;
      // "MISSING_MESSAGE" mirrors use-intl's IntlErrorCode.MISSING_MESSAGE (a string
      // enum); compared as a literal here to avoid a second package import for one enum value.
      if (error.code === "MISSING_MESSAGE") {
        const fallback = getNestedString(deMessages, path);
        if (fallback !== undefined) return fallback;
      }
      return path;
    },
  };
});
