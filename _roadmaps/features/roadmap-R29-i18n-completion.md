# Roadmap R29: i18n Completion — Footer, Dashboard Nav, Remaining Hardcoded Strings

> **Scope:** Move all remaining hardcoded German strings to translation files (`messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`). Focus on Footer, DashboardLayout, TerminePage, and ~20 components with inline German text.
> **Design System:** V3 — read `_rules/UI_RULES.md` fully before starting.
> **Pre-read:** `CLAUDE.md`, `_rules/UI_RULES.md`, `_rules/ROADMAP_RULES.md`
> **Existing i18n:** Read `messages/de.json` to understand existing namespace structure.

---

## Breakage Risk Assessment

| Phase | Risk Level | Could Break | How to Prevent |
|---|---|---|---|
| Phase 1 | 🟡 MEDIUM | Footer rendering if translation key is missing | Add ALL keys to ALL 4 locale files before modifying the component |
| Phase 2 | 🟡 MEDIUM | Dashboard nav labels if key is wrong | Add keys first, then modify component — build after each file |
| Phase 3 | 🟡 MEDIUM | Component text if key is typo'd | Always build after each batch of changes |

---

## 🤖 Phase 1: Footer i18n

#### Files
- `[MODIFY]` `messages/de.json` — Add `"footer"` namespace
- `[MODIFY]` `messages/en.json` — Add `"footer"` namespace
- `[MODIFY]` `messages/fr.json` — Add `"footer"` namespace (if exists)
- `[MODIFY]` `messages/it.json` — Add `"footer"` namespace (if exists)
- `[MODIFY]` `components/layout/Footer.tsx` — Replace hardcoded strings with `t("key")`

#### Step 1: Add translation keys FIRST (before modifying component)

#### ✅ DO
```json
// messages/de.json — ADD this "footer" block
{
  "footer": {
    "categories": "Kategorien",
    "company": "Unternehmen",
    "forSalons": "Für Salons",
    "social": "Sozial",
    "tagline": "Von Basel, für Basel.",
    "impressum": "Impressum",
    "agb": "AGB",
    "privacy": "Datenschutz",
    "help": "Hilfe",
    "salonPitch": "Du hast einen Salon? Bring dein Business auf Solen.",
    "becomePartner": "Partner werden",
    "registerSalon": "Salon registrieren",
    "dashboard": "Dashboard",
    "copyright": "© {year} solen.ch — Alle Rechte vorbehalten.",
    "compliance": "nDSG-konform · Daten in der Schweiz"
  }
}

// messages/en.json — ADD "footer" block
{
  "footer": {
    "categories": "Categories",
    "company": "Company",
    "forSalons": "For Salons",
    "social": "Social",
    "tagline": "From Basel, for Basel.",
    "impressum": "Imprint",
    "agb": "Terms",
    "privacy": "Privacy",
    "help": "Help",
    "salonPitch": "Own a salon? Bring your business to Solen.",
    "becomePartner": "Become a Partner",
    "registerSalon": "Register Salon",
    "dashboard": "Dashboard",
    "copyright": "© {year} solen.ch — All rights reserved.",
    "compliance": "Swiss data protection compliant"
  }
}
```

#### Step 2: Modify Footer.tsx
```tsx
import { useTranslations } from "next-intl";

export default function Footer() {
  const t = useTranslations("footer");
  // Replace "Kategorien" → t("categories"), etc.
}
```

#### ❌ DON'T
```tsx
// DON'T modify the component BEFORE adding translation keys — it will crash
// DON'T forget any locale file — if en.json has a key, ALL locale files must have it
// DON'T change the Footer's layout/structure — only replace string literals with t() calls
```

#### Verification
```bash
npm run build
# Switch locale: visit /en/ and verify footer renders in English
git add -A && git commit -m "R29 phase 1: Footer i18n — all strings moved to translation files"
```

> ⚠️ **BE CAREFUL**:
> - Add keys to ALL 4 locale files before modifying the component — missing keys = runtime error
> - Use `{year}` interpolation for copyright year — `t("copyright", { year: new Date().getFullYear() })`
> - Check which locale files actually exist: `ls messages/` — if only de.json and en.json exist, skip fr/it
> - Don't change the `CATEGORIES` array labels — those should stay as hardcoded display names (not i18n)

---

## 🤖 Phase 2: Dashboard Nav i18n

#### Files
- `[MODIFY]` `messages/de.json` — Add `"dashboard.nav"` namespace
- `[MODIFY]` `messages/en.json` — Add `"dashboard.nav"` namespace
- `[MODIFY]` `components/dashboard/DashboardLayout.tsx` — Replace hardcoded nav labels

#### Instructions
1. Add ALL 38 nav labels (17 OWNER + 12 ADMIN + 4 STAFF + 5 MOBILE) to each locale
2. Modify the nav arrays to use `useTranslations("dashboard.nav")`

#### ✅ DO
```json
// messages/de.json
{
  "dashboard": {
    "nav": {
      "overview": "Übersicht",
      "bookings": "Termine",
      "calendar": "Kalender",
      "messages": "Nachrichten",
      "team": "Team",
      "clients": "Kunden",
      "services": "Services",
      "marketing": "Marketing",
      "analytics": "Statistiken",
      "reviews": "Bewertungen",
      "posts": "Meine Posts",
      "nailClients": "Nail Kunden",
      "barberClients": "Barber Kunden",
      "barberOps": "Barber Ops",
      "loyalty": "Treueprogramm",
      "settings": "Einstellungen",
      "verification": "Verifizierung",
      "backToSite": "Zur Website"
    }
  }
}
```

#### ❌ DON'T
```tsx
// DON'T make the OWNER_NAV array dynamic inside the render — keep it static and use t() for labels only
// DON'T replace icon imports — only replace label strings
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R29 phase 2: Dashboard nav i18n — 38 labels moved to translation files"
```

> ⚠️ **BE CAREFUL**:
> - The `OWNER_NAV`, `ADMIN_NAV`, `STAFF_NAV`, and `MOBILE_NAV` arrays are `as const` — you need to change the `label` field to use `t()` calls
> - This means either: (a) move the arrays inside the component where `t()` is available, or (b) change labels to key strings and look up `t(key)` in the rendering
> - Option (b) is cleaner: `{ key: "overview", href: "/dashboard", icon: Home }` then `t(item.key)` in render

---

## 🤖 Phase 3: Sweep Remaining Hardcoded Strings

#### Instructions
1. Run this grep to find hardcoded German strings in components:
```bash
grep -rn '"Keine\|"Fehler\|"Bitte\|"Laden\|"Speichern\|"Löschen\|"Abbrechen\|"Bestätigen\|"Weiter\|"Zurück' components/ --include="*.tsx" | grep -v "useTranslations\|import.*Translations\|messages/" | head -40
```

2. For EACH found string:
   - Add to appropriate namespace in `messages/de.json` (and en.json)
   - Replace with `t("key")` call
   - If the component doesn't have `useTranslations` yet, add the import

3. Focus on user-facing strings ONLY — skip:
   - API error messages (those stay in the route handler)
   - Console.log strings
   - Developer comments

#### Common strings to move:
- "Keine Ergebnisse" → `t("noResults")`
- "Laden..." → `t("loading")`
- "Speichern" → `t("save")`
- "Abbrechen" → `t("cancel")`
- "Löschen" → `t("delete")`
- "Bestätigen" → `t("confirm")`

#### ✅ DO — Create a shared `"common"` namespace for repeated strings:
```json
{
  "common": {
    "save": "Speichern",
    "cancel": "Abbrechen",
    "delete": "Löschen",
    "confirm": "Bestätigen",
    "loading": "Laden...",
    "noResults": "Keine Ergebnisse",
    "error": "Fehler",
    "retry": "Nochmal versuchen",
    "back": "Zurück",
    "next": "Weiter",
    "close": "Schliessen"
  }
}
```

#### ❌ DON'T
```tsx
// DON'T create per-component translation files — use shared namespaces
// DON'T translate developer-facing strings (console, API keys, etc.)
// DON'T translate component prop names or className values
```

#### Verification
```bash
npm run build
git add -A && git commit -m "R29 phase 3: remaining hardcoded strings moved to i18n translation files"
git push origin main
```

> ⚠️ **BE CAREFUL**:
> - This is a large sweep — do it in batches of ~5 files, `npm run build` after each batch
> - If a component file doesn't have `useTranslations` already, you need to add `"use client"` (if not already) and `import { useTranslations } from "next-intl"`
> - Don't change strings inside `toast()` calls if they reference specific API errors — those should stay as-is

---

## Dependency Ordering

| Step | Type | What | Depends On |
|---|---|---|---|
| Phase 1 | 🤖 | Footer i18n (1 component + 4 locale files) | Nothing |
| Phase 2 | 🤖 | Dashboard nav i18n (1 component + 4 locale files) | Nothing |
| Phase 3 | 🤖 | Sweep remaining strings (~20 components + locale files) | Nothing |
