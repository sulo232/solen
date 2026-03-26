# City Expansion — Phase 1: City Selector & Persistence

> **Scope:** City selector dropdown component, header integration, footer city links, language switcher relocation.
> **Standard:** Solen V3 — `CLAUDE.md` + `UI_RULES.md` Zone 1.
> **Depends On:** Phase 0 (cities table, types, cookie utility).
> **Strategy:** One step = one commit + `npm run build`.

---

## Breakage Risk Assessment

| Step | Risk | Reason |
|---|---|---|
| S1 — CitySelector component | 🟢 Low | New component, no existing code changed |
| S2 — Header integration | 🟡 Medium | Modifying shared Header — test mobile + desktop |
| S3 — Footer city links | 🟢 Low | Additive footer section |
| S4 — Language switcher relocation | 🟡 Medium | Moving component — ensure header still works without it |
| S5 — Geolocation auto-detect | 🟢 Low | Passive detection, no popup, silent cookie set |

---

## Step 1 — CitySelector Dropdown Component

> **Goal:** Create a reusable city selector dropdown with design system compliance.

#### [NEW] `components/ui/CitySelector.tsx`

```tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MapPin, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { CITY_SLUGS, getCityName, type CitySlug } from "@/lib/cities";
import { getPersistedCity, setPersistedCity, clearPersistedCity } from "@/lib/city-cookie";

interface CitySelectorProps {
  variant?: "header" | "footer" | "menu";
  onCityChange?: (city: CitySlug | null) => void;
}

export default function CitySelector({ variant = "header", onCityChange }: CitySelectorProps) {
  const locale = useLocale();
  const t = useTranslations("cities");
  const [selectedCity, setSelectedCity] = useState<CitySlug | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Load persisted city on mount
  useEffect(() => {
    setSelectedCity(getPersistedCity());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (slug: CitySlug | null) => {
    setSelectedCity(slug);
    if (slug) {
      setPersistedCity(slug);
    } else {
      clearPersistedCity();
    }
    setIsOpen(false);
    onCityChange?.(slug);
  };

  const displayName = selectedCity ? getCityName(selectedCity, locale) : t("all");

  if (variant === "footer") {
    return (
      <div className="flex gap-4 flex-wrap">
        {CITY_SLUGS.map((slug) => (
          <button
            key={slug}
            onClick={() => handleSelect(slug)}
            className={`text-sm font-body transition-colors duration-150 ${
              selectedCity === slug
                ? "text-s-coral font-semibold"
                : "text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text"
            }`}
          >
            {getCityName(slug, locale)}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div ref={dropdownRef} className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          inline-flex items-center gap-1.5 text-sm font-body transition-all duration-150
          ${variant === "menu"
            ? "w-full px-4 py-3 rounded-input bg-s-bg-surface dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text"
            : "px-3 py-1.5 rounded-pill border border-s-ink/10 dark:border-white/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-ink/20 dark:hover:border-white/20 hover:text-s-ink dark:hover:text-s-dm-text"
          }
        `}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label={t("select")}
      >
        <MapPin size={14} className="text-s-coral shrink-0" aria-hidden="true" />
        <span className="truncate">{displayName}</span>
        <ChevronDown size={12} className={`shrink-0 transition-transform duration-150 ${isOpen ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute z-50 mt-2 min-w-[180px] rounded-input overflow-hidden
              bg-[--raised] dark:bg-s-dm-surface
              border border-s-ink/10 dark:border-white/10
              shadow-warm-lg
              ${variant === "menu" ? "left-0 right-0" : "right-0"}
            `}
            role="listbox"
            aria-label={t("select")}
          >
            {/* "All cities" option */}
            <button
              onClick={() => handleSelect(null)}
              className="w-full flex items-center gap-2 px-4 py-3 text-sm font-body text-s-ink dark:text-s-dm-text hover:bg-s-bg-surface dark:hover:bg-s-dm-bg transition-colors duration-150"
              role="option"
              aria-selected={selectedCity === null}
            >
              <span className="flex-1 text-left">{t("all")}</span>
              {selectedCity === null && <Check size={14} className="text-s-coral shrink-0" />}
            </button>

            <div className="h-px bg-s-ink/5 dark:bg-white/5" />

            {CITY_SLUGS.map((slug) => (
              <button
                key={slug}
                onClick={() => handleSelect(slug)}
                className="w-full flex items-center gap-2 px-4 py-3 text-sm font-body text-s-ink dark:text-s-dm-text hover:bg-s-bg-surface dark:hover:bg-s-dm-bg transition-colors duration-150"
                role="option"
                aria-selected={selectedCity === slug}
              >
                <span className="flex-1 text-left">{getCityName(slug, locale)}</span>
                {selectedCity === slug && <Check size={14} className="text-s-coral shrink-0" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
```

### ⚠️ BE CAREFUL
- Uses `rounded-pill` for header variant, `rounded-input` for menu/dropdown (per UI_RULES §10).
- Dropdown uses `shadow-warm-lg` (per UI_RULES §11 — active dropdowns).
- Animation: 150ms fade (Tier 1 fast), NOT a slide (per UI_RULES §4 — dropdowns are not page navigation).
- `z-50` for dropdown (per UI_RULES §14 — same as header level).
- No emoji icons — uses `MapPin` from lucide-react.

**Git commit:** `git add components/ui/CitySelector.tsx && git commit -m "CITY-P1-S1: CitySelector dropdown component with design system compliance"`

---

## Step 2 — Header Integration

> **Goal:** Add CitySelector to the Header, next to login/profile buttons.

#### [MODIFY] `components/layout/Header.tsx`

**Import CitySelector:**
```tsx
import CitySelector from "@/components/ui/CitySelector";
```

**Add to desktop nav** (after the existing nav links, before the auth buttons):
```tsx
{/* City selector — desktop only */}
<div className="hidden lg:flex items-center">
  <CitySelector variant="header" />
</div>
```

**Add to mobile hamburger menu** (inside the menu panel, above language selector):
```tsx
{/* City selector — mobile menu */}
<div className="px-4 py-2">
  <p className="text-[10px] font-heading font-bold uppercase tracking-[.16em] text-s-ink/40 dark:text-s-dm-text/40 mb-2">
    {t("cities.label")}
  </p>
  <CitySelector variant="menu" />
</div>
```

### ⚠️ BE CAREFUL
- Do NOT remove any existing header elements.
- The CitySelector is placed BETWEEN nav links and auth buttons on desktop.
- On mobile it's INSIDE the hamburger menu, above the language selector.
- Translation key `cities.label` must be added to all 4 locale files: `Stadt` (de), `City` (en), `Ville` (fr), `Città` (it).

**Git commit:** `git add components/layout/Header.tsx && git commit -m "CITY-P1-S2: city selector in header (desktop pill + mobile menu dropdown)"`

---

## Step 3 — Footer City Links

> **Goal:** Add city links section to Footer, matching Fresha's footer pattern.

#### [MODIFY] `components/layout/Footer.tsx`

**Add a "Städte" column** in the footer grid:
```tsx
{/* Cities column */}
<div>
  <h3 className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text mb-4 uppercase tracking-[.08em]">
    {t("footer.cities")}
  </h3>
  <ul className="space-y-2">
    {CITY_SLUGS.map((slug) => (
      <li key={slug}>
        <Link
          href={`/${locale}/${slug}`}
          className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-coral transition-colors duration-150"
        >
          {getCityName(slug, locale)}
        </Link>
      </li>
    ))}
  </ul>
</div>
```

**Import:**
```tsx
import { CITY_SLUGS, getCityName } from "@/lib/cities";
```

**Git commit:** `git add components/layout/Footer.tsx && git commit -m "CITY-P1-S3: footer city links column"`

---

## Step 4 — Language Switcher Relocation

> **Goal:** Move the `LanguageSwitcher` from the header down to the footer.

#### [MODIFY] `components/layout/Header.tsx`

- Remove the `<LanguageSwitcher />` component from the desktop header nav area
- Keep it in the mobile hamburger menu (at the bottom, BELOW city selector)

#### [MODIFY] `components/layout/Footer.tsx`

- Import and render `<LanguageSwitcher />` at the bottom of the footer, below city links
- Style: horizontal flag pills (same styling as current, just in the footer context)

```tsx
{/* Language switcher — footer */}
<div className="mt-8 pt-6 border-t border-s-ink/5 dark:border-white/5">
  <LanguageSwitcher variant="footer" />
</div>
```

### ⚠️ BE CAREFUL
- The `LanguageSwitcher` likely needs a `variant` prop to support both header and footer layouts.
- If the component doesn't support a `variant` prop yet, add it: `variant?: "header" | "footer" | "menu"`.
- The mobile hamburger menu KEEPS the language switcher — it's only removed from the desktop header bar.

**Git commit:** `git add components/layout/Header.tsx components/layout/Footer.tsx components/ui/LanguageSwitcher.tsx && git commit -m "CITY-P1-S4: language switcher moved to footer, kept in mobile menu"`

---

## Step 5 — Passive Geolocation Auto-Detect

> **Goal:** Silently detect user's city via browser geolocation (no popup).

#### [NEW] `hooks/useCityDetection.ts`

```tsx
"use client";

import { useEffect } from "react";
import { findNearestCity } from "@/lib/cities";
import { getPersistedCity, setPersistedCity } from "@/lib/city-cookie";

/**
 * Passively detect user's city from geolocation.
 * Only runs if no city is already set AND geolocation permission is already granted.
 * NEVER triggers a permission popup.
 */
export function useCityDetection() {
  useEffect(() => {
    // Skip if city already set
    if (getPersistedCity()) return;

    // Only auto-detect if permission is already granted (no popup!)
    if (!navigator.permissions) return;

    navigator.permissions.query({ name: "geolocation" }).then((result) => {
      if (result.state === "granted") {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const nearest = findNearestCity(pos.coords.latitude, pos.coords.longitude);
            setPersistedCity(nearest);
          },
          () => {} // Silently fail
        );
      }
    }).catch(() => {}); // Silently fail
  }, []);
}
```

#### [MODIFY] `components/HomePage.tsx`

**Import and call the hook at the top of the component:**
```tsx
import { useCityDetection } from "@/hooks/useCityDetection";

export default function HomePage() {
  useCityDetection(); // Passive city detection
  // ... rest of component
}
```

### ⚠️ BE CAREFUL
- This ONLY runs if the user has ALREADY granted geolocation permission (e.g., from using the "near you" feature).
- If permission is `"prompt"` or `"denied"`, this does NOTHING. No popup, ever.
- The `findNearestCity` function uses Haversine distance to find the closest city center.

**Git commit:** `git add hooks/useCityDetection.ts components/HomePage.tsx && git commit -m "CITY-P1-S5: passive geolocation city detection (no popup)"`

---

## Step 6 — i18n Translation Keys

> **Goal:** Add all city-related translation keys to all 4 locale files.

#### [MODIFY] `messages/de.json`, `messages/en.json`, `messages/fr.json`, `messages/it.json`

Add to each locale file:

**German (`de.json`):**
```json
{
  "cities": {
    "label": "Stadt",
    "select": "Stadt wählen",
    "all": "Alle Städte",
    "zuerich": "Zürich",
    "basel": "Basel",
    "bern": "Bern"
  },
  "footer": {
    "cities": "Städte"
  }
}
```

**English (`en.json`):**
```json
{
  "cities": {
    "label": "City",
    "select": "Select city",
    "all": "All cities",
    "zuerich": "Zurich",
    "basel": "Basel",
    "bern": "Berne"
  },
  "footer": {
    "cities": "Cities"
  }
}
```

**French (`fr.json`):**
```json
{
  "cities": {
    "label": "Ville",
    "select": "Choisir une ville",
    "all": "Toutes les villes",
    "zuerich": "Zurich",
    "basel": "Bâle",
    "bern": "Berne"
  },
  "footer": {
    "cities": "Villes"
  }
}
```

**Italian (`it.json`):**
```json
{
  "cities": {
    "label": "Città",
    "select": "Seleziona città",
    "all": "Tutte le città",
    "zuerich": "Zurigo",
    "basel": "Basilea",
    "bern": "Berna"
  },
  "footer": {
    "cities": "Città"
  }
}
```

**Git commit:** `git add messages/ && git commit -m "CITY-P1-S6: city translation keys for all 4 locales"`

---

## Smoke Test (Phase 1)

1. ✅ `npm run build` passes
2. ✅ `npx tsc --noEmit` passes
3. ✅ CitySelector renders on desktop header (pill with MapPin icon)
4. ✅ CitySelector works in mobile hamburger menu
5. ✅ Footer shows city links + language switcher
6. ✅ Selecting a city sets `solen-city` cookie
7. ✅ Refreshing page preserves city selection
8. ✅ All 4 locale files have `cities` translation keys
9. ✅ No banned tokens (run grep from UI_RULES Rule 20)
