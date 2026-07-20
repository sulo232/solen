// Locale picker data shared by the settings hub (page.tsx, a Server Component) and
// SettingsForm.tsx's "language" section (a Client Component). Lives in its own plain module
// (no "use client") on purpose: a Server Component importing a plain VALUE export from a
// "use client" file crosses the RSC client boundary and gets a client reference/proxy back
// at render time, not the real array. That was the root cause of the runtime crash on
// /profile/settings ("LOCALES.find is not a function", 2026-07-20): page.tsx imported LOCALES
// from SettingsForm.tsx (a "use client" file). Moving the constant here, with no directive,
// lets both server and client code import the real value safely.
// exists-check: `npm run exists "settings locales"` ran this turn, 0 matches. Net-new module
// vs the unrelated hit (hooks/useSectionObserver.ts, a scroll hook, no locale data). Extracted
// from app/[locale]/profile/settings/SettingsForm.tsx's existing LOCALES/SettingsLocale
// declarations, not a duplicate.

export type SettingsLocale = "de" | "en" | "fr" | "it";

export const LOCALES: { value: SettingsLocale; label: string }[] = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
  { value: "it", label: "Italiano" },
];
