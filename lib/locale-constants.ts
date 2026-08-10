// seo-comms-12 (2026-07-27): the single, client-safe source of truth for the app's
// locale list + default locale. Split out of i18n.ts (which re-exports these two for
// backward compatibility) because i18n.ts imports `next-intl/server`, a server-only
// module; a client component pulling in lib/seo.ts (e.g. SalonDetailV3.tsx, which
// imports generateSalonSchema) would break the client bundle if lib/seo.ts imported
// defaultLocale straight from i18n.ts. Both middleware.ts (via i18n.ts's re-export)
// and lib/seo.ts (directly) now read the exact same constant, closing the drift risk
// where x-default in buildAlternates() could silently disagree with the crawler-facing
// default locale middleware.ts redirects to.

export const locales = ["de", "en", "fr", "it"] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = "de";
