# City Expansion — Phase 3: Landing Page Redesign

> **Scope:** Homepage redesign — 3-field search bar, category grid with custom SVGs, discover preview, deals rebrand, map preview, scroll animations.
> **Standard:** Solen V3 — `CLAUDE.md` + `UI_RULES.md` Zone 1 (Full Maximalist).
> **Depends On:** Phase 0 (types) + Phase 1 (city cookie) + Phase 2 (city routes).
> **Strategy:** One step = one commit + `npm run build`.

---

## Breakage Risk Assessment

| Step | Risk | Reason |
|---|---|---|
| S1 — Hero text update | 🟢 Low | Text change only, layout stays |
| S2 — 3-field search bar | 🔴 High | Full HomeSearchBar rewrite — search logic must survive |
| S3 — Category SVG icons | 🟡 Medium | New icon components, tile JSX change |
| S4 — Discover preview section | 🟢 Low | New section, additive |
| S5 — Deals rebrand | 🟢 Low | Text/translation changes only |
| S6 — Map preview section | 🟡 Medium | New component, map integration |
| S7 — Quartier section removal | 🟢 Low | Remove section + dead code |
| S8 — Payment methods update | 🟢 Low | Update trust strip text |
| S9 — Scroll animations polish | 🟢 Low | Additive animations |

---

## Step 1 — Hero Text Update (City-Agnostic)

> **Goal:** Change "BEAUTY. BASEL." → "BEAUTY. BUCHEN." and update tagline.

#### [MODIFY] `components/HomePage.tsx`

**Line ~271** — Change hero text:

```tsx
// FROM:
<>BEAUTY<span className="text-s-coral">.</span><br />BASEL<span className="text-s-coral">.</span></>

// TO:
<>BEAUTY<span className="text-s-coral">.</span><br />BUCHEN<span className="text-s-coral">.</span></>
```

**Line ~261** — Change eyebrow from `t("hero.byline")` ("Von Basel, für Basel") to a new key:

```tsx
// Update translation key:
{t("hero.byline")} // Update messages/ to: "Deine Schweizer Salon-Plattform"
```

**Update `messages/de.json`:**
```json
"hero": {
  "byline": "Deine Schweizer Salon-Plattform",
  // ... rest stays
}
```

**Update all 4 locales** with the equivalent translation.

### ⚠️ BE CAREFUL
- The personalized greeting (`Hallo {userName}`) STAYS for logged-in users — only the default (non-logged-in) hero text changes.
- The `clamp(64px, 9vw, 130px)` font size stays.

**Git commit:** `git add components/HomePage.tsx messages/ && git commit -m "CITY-P3-S1: hero text city-agnostic — BEAUTY.BUCHEN., Swiss platform tagline"`

---

## Step 2 — 3-Field Search Bar (Airbnb-Style)

> **Goal:** Upgrade HomeSearchBar from 1-field to Service + City + Date.

#### [MODIFY] `components/ui/HomeSearchBar.tsx`

This is the most complex step. The existing search bar has:
- Date chip row (Heute / Morgen / custom)
- Category pill row
- Text input + submit button

**New layout:**
```
┌────────────────────────────────────────────────────────────────┐
│ 🔍 Service suchen... │ 📍 City ▼ │ 📅 Datum │ [ SUCHEN ] │
└────────────────────────────────────────────────────────────────┘
```

**On mobile: stacks vertically.**

Key changes:
1. Add a **city dropdown** field (uses `CITY_SLUGS` + `getPersistedCity()` as default)
2. Keep the **date picker** but inline it as field 3 (not chips above)
3. Keep the **category autocomplete** in the service text input (existing AI detect)
4. Submit navigates to `/{locale}/{city}/{category}` or `/{locale}/search?city={city}&date={date}`

```tsx
// New state:
const [selectedCity, setSelectedCity] = useState<CitySlug | null>(null);

// On mount, prefill from cookie:
useEffect(() => {
  setSelectedCity(getPersistedCity());
}, []);

// Submit handler update:
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  const citySlug = selectedCity ?? ""; // empty = all cities
  const basePath = citySlug
    ? `/${locale}/${citySlug}/${selectedCategory ?? "search"}`
    : `/${locale}/search`;
  const params = new URLSearchParams();
  if (query) params.set("q", query);
  if (selectedDate) params.set("date", selectedDate);
  router.push(`${basePath}?${params}`);
};
```

### ⚠️ BE CAREFUL
- The existing AI category detection (`detectCategory`) logic MUST stay intact — don't remove it.
- The search bar container: `rounded-search` (18px), `shadow-warm-md` at rest, `shadow-warm-lg` on `:focus-within`.
- City dropdown uses a simple `<select>` or custom dropdown inside the search bar — NOT the full CitySelector component (too heavy for inline use).
- Field dividers: `border-r border-s-ink/[0.06]` (1px barely-there lines per §19e).
- On mobile (<768px): fields stack vertically, each full-width.

**Git commit:** `git add components/ui/HomeSearchBar.tsx && git commit -m "CITY-P3-S2: 3-field search bar — service + city + date, Airbnb-style"`

---

## Step 3 — Category Grid with Custom SVG Icons

> **Goal:** Replace gradient-only category tiles with illustrated SVG icons.

#### [NEW] `components/icons/category/` folder

Create one SVG component per category:

```
components/icons/category/
├── CoiffeurIcon.tsx
├── BarberIcon.tsx
├── NailsIcon.tsx
├── MakeupIcon.tsx
├── WaxingIcon.tsx
└── index.ts (barrel export)
```

Each icon SVG should:
- Use `currentColor` for stroke/fill
- Size: accept `size` prop, default 32
- Be clean line-art style (like Fresha category icons)
- NOT use lucide-react (these are custom brand illustrations)

**Example (CoiffeurIcon.tsx):**
```tsx
interface Props { size?: number; className?: string }

export default function CoiffeurIcon({ size = 32, className }: Props) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none"
      stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      className={className}>
      {/* Scissors illustration */}
      <circle cx="10" cy="22" r="3" />
      <circle cx="22" cy="22" r="3" />
      <path d="M13 22L22 10M19 22L10 10" />
    </svg>
  );
}
```

#### [MODIFY] `components/HomePage.tsx`

**Update CATEGORIES constant and tile JSX:**

```tsx
import { CoiffeurIcon, BarberIcon, NailsIcon, MakeupIcon, WaxingIcon } from "@/components/icons/category";

const CATEGORIES = [
  { key: "coiffeur",   label: "COIFFEUR",   Icon: CoiffeurIcon, grad: "linear-gradient(145deg,#D4870A,#E8624A)" },
  { key: "barbershop", label: "BARBER",      Icon: BarberIcon,   grad: "linear-gradient(145deg,#4A1E3C,#6BA3C8)" },
  { key: "nails",      label: "NAILS",       Icon: NailsIcon,    grad: "linear-gradient(145deg,#E8624A,#F2C144)" },
  { key: "makeup",     label: "MAKEUP",      Icon: MakeupIcon,   grad: "linear-gradient(145deg,#C9A96E,#E8624A)" },
  { key: "waxing",     label: "WAXING",      Icon: WaxingIcon,   grad: "linear-gradient(145deg,#4A1E3C,#7BA688)" },
] as const;

// Updated tile JSX:
<Link key={key} href={cityLink} className="relative aspect-square rounded-card overflow-hidden group hover:-translate-y-[5px] transition-all duration-[250ms]"
  style={{ boxShadow: "var(--sh-sm)" }}>
  <div className="absolute inset-0 transition-transform duration-[250ms] group-hover:scale-[1.03] group-hover:-rotate-1"
    style={{ background: grad }} />
  <div className="absolute inset-0 bg-gradient-to-t from-s-ink/60 to-transparent" />
  {/* SVG Icon */}
  <div className="absolute top-3 right-3 text-white/40">
    <Icon size={28} />
  </div>
  <div className="absolute bottom-0 inset-x-0 p-3">
    <div className="font-display text-[22px] text-white leading-none">{label}</div>
  </div>
</Link>
```

### ⚠️ BE CAREFUL
- Remove the hardcoded `count` from CATEGORIES — it violates Rule 32 (no hardcoded marketing stats).
- The icons are in the top-right corner at reduced opacity (`text-white/40`), not replacing the gradient background.
- `rounded-card` (20px) per UI_RULES §10 — do NOT write `rounded-[20px]`.

**Git commit:** `git add components/icons/category/ components/HomePage.tsx && git commit -m "CITY-P3-S3: custom SVG category icons, remove hardcoded counts"`

---

## Step 4 — Discover Preview Section (NEW)

> **Goal:** Add a "Finde deine Inspiration" section promoting the `/discover` page.

#### [MODIFY] `components/HomePage.tsx`

**Add after the category grid section (before Featured Salons):**

```tsx
{/* ── Discover Preview ─────────────────────────────────────── */}
<section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
  <div className="mb-6 text-center">
    <span className="font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber block mb-1">
      {t("discover.eyebrow")}
    </span>
    <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
      style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
      {t("discover.title")}
    </h2>
    <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 font-body mt-2 max-w-md mx-auto">
      {t("discover.subtitle")}
    </p>
  </div>

  {/* Preview cards — fetch 3 discovery items */}
  <DiscoverPreviewCards locale={locale} />

  <div className="text-center mt-8">
    <Link href={`/${locale}/discover`}
      className="inline-flex items-center gap-2 px-8 py-4 rounded-pill bg-s-coral text-white font-heading font-bold text-sm uppercase tracking-[.04em] shadow-coral-glow hover:brightness-[1.06] hover:shadow-coral-glow-hover hover:-translate-y-px active:translate-y-px transition-all duration-150">
      {t("discover.cta")} →
    </Link>
  </div>
</section>
```

#### [NEW] `components/DiscoverPreviewCards.tsx`

A small client component that fetches 3 discovery items and renders preview cards.

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import type { DiscoveryItem } from "@/lib/types";

export default function DiscoverPreviewCards({ locale }: { locale: string }) {
  const [items, setItems] = useState<DiscoveryItem[]>([]);

  useEffect(() => {
    fetch("/api/discovery/feed?limit=3&sort=trending")
      .then((r) => r.ok ? r.json() : null)
      .then((data) => setItems(data?.items ?? []))
      .catch(() => {});
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
      {items.map((item) => (
        <Link key={item.id} href={`/${locale}/discover`}
          className="rounded-card overflow-hidden group hover:-translate-y-[5px] transition-all duration-[250ms]"
          style={{ boxShadow: "var(--sh-sm)" }}>
          {item.image_url && (
            <div className="aspect-[3/2] overflow-hidden">
              <img src={item.image_url} alt={item.alt_text ?? ""}
                className="w-full h-full object-cover transition-transform duration-[400ms] group-hover:scale-[1.05]"
                loading="lazy" />
            </div>
          )}
          <div className="p-4 bg-[--raised] dark:bg-s-dm-surface">
            <p className="font-heading font-bold text-sm text-s-ink dark:text-s-dm-text truncate">
              {item.name ?? item.style_name ?? "Inspiration"}
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 font-body mt-0.5 truncate">
              {item.category}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
```

### ⚠️ BE CAREFUL
- If the discovery feed API returns 0 items, the entire section returns `null` — no empty state shown.
- Images use `aspect-[3/2]` (per UI_RULES §6 — salon card cover photo ratio).
- Translation keys needed: `discover.eyebrow`, `discover.title`, `discover.subtitle`, `discover.cta`.

**Git commit:** `git add components/HomePage.tsx components/DiscoverPreviewCards.tsx && git commit -m "CITY-P3-S4: discover preview section with trending items, CTA to /discover"`

---

## Step 5 — Deals Rebrand

> **Goal:** Rename "Last Minute" → "Deals" across homepage + update translations.

#### [MODIFY] `components/HomePage.tsx`

**In the Last Minute section (~line 434–489):**
- Change eyebrow text key from `lastMinute.eyebrow` → `deals.eyebrow`
- Change title key from `lastMinute.title` → `deals.title`
- Change CTA key from `lastMinute.viewAll` → `deals.viewAll`
- Change route from `/${locale}/last-minute` → `/${locale}/deals` (with a redirect)

#### [MODIFY] `messages/*.json`

**Add `deals` keys and keep `lastMinute` as aliases:**
```json
"deals": {
  "eyebrow": "Angebote",
  "title": "Aktuelle Deals",
  "viewAll": "Alle Deals ansehen",
  "viewOffers": "Deals entdecken",
  "emptyMessage": "Momentan keine aktiven Deals — schau bald wieder vorbei."
}
```

#### [ADD] Redirect in `next.config.js`

```javascript
{ source: "/:locale/last-minute", destination: "/:locale/deals", permanent: true }
```

### ⚠️ BE CAREFUL
- Do NOT rename the `last-minute` API endpoint yet — that's a Phase 5 concern.
- The plum background section, urgency timers, and LastMinuteCard component stay unchanged.
- Only the user-facing text/branding changes in this step.

**Git commit:** `git add components/HomePage.tsx messages/ next.config.js && git commit -m "CITY-P3-S5: deals rebrand — last minute → deals, 301 redirect"`

---

## Step 6 — Map Preview Section (NEW)

> **Goal:** Add an embedded map showing salon pins for the selected city.

#### [NEW] `components/MapPreview.tsx`

A lightweight map preview that shows salon locations. Uses the existing map implementation pattern from the search page.

```tsx
"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { Map as MapIcon } from "lucide-react";
import { getPersistedCity } from "@/lib/city-cookie";

export default function MapPreview() {
  const locale = useLocale();
  const t = useTranslations("map");
  const [hasMapData, setHasMapData] = useState(false);

  useEffect(() => {
    // Only show if we have salons with coordinates
    const city = getPersistedCity();
    const params = new URLSearchParams({ limit: "1" });
    if (city) params.set("city", city);
    fetch(`/api/salons?${params}`)
      .then((r) => r.json())
      .then((data) => setHasMapData((data.items ?? []).length > 0))
      .catch(() => {});
  }, []);

  if (!hasMapData) return null;

  return (
    <section className="max-w-5xl mx-auto px-4 py-16 md:py-24">
      <div className="mb-6">
        <span className="block font-heading font-bold text-[11px] uppercase tracking-[.20em] text-s-amber mb-1">
          {t("eyebrow")}
        </span>
        <h2 className="font-heading font-extrabold text-s-ink dark:text-s-dm-text"
          style={{ fontSize: "clamp(26px, 3.5vw, 44px)", letterSpacing: "-0.02em" }}>
          {t("title")}
        </h2>
      </div>

      {/* Map placeholder — links to full map view */}
      <Link href={`/${locale}/search`}
        className="block rounded-card overflow-hidden bg-s-bg-surface dark:bg-s-dm-surface border border-s-ink/5 dark:border-white/5 hover:-translate-y-[3px] transition-all duration-[250ms]"
        style={{ boxShadow: "var(--sh-sm)", height: "300px" }}>
        <div className="w-full h-full flex items-center justify-center text-s-ink/30 dark:text-s-dm-text/30">
          <div className="text-center">
            <MapIcon size={48} className="mx-auto mb-4" />
            <p className="font-heading font-bold text-sm">{t("cta")}</p>
          </div>
        </div>
      </Link>
    </section>
  );
}
```

### ⚠️ BE CAREFUL
- This is a **preview placeholder** that links to the full `/search` map view.
- The actual interactive map is on the search page (Split View architecture per UI_RULES §5).
- If no salons exist in the selected city, this section returns `null`.
- Future enhancement: embed the actual Leaflet/Mapbox map here. For now, placeholder with CTA.

**Git commit:** `git add components/MapPreview.tsx components/HomePage.tsx && git commit -m "CITY-P3-S6: map preview section on homepage (placeholder → search page)"`

---

## Step 7 — Remove Quartier Section

> **Goal:** Remove the entire Quartier section from the homepage + clean up dead code.

#### [MODIFY] `components/HomePage.tsx`

**Remove:**
1. `QUARTIERS` constant (lines 75–83)
2. `quartierCounts` state (line 103)
3. Quartier fetch in `fetchData` (lines 208–214)
4. Entire Quartier section JSX (lines 596–630)
5. `sections.quartier` reference

**Also remove from `sections` default state:**
```tsx
const [sections, setSections] = useState<Record<string, boolean>>({
  // Remove: quartier: true,
  trending: true, nearby: true, new_salons: true,
  rebook: true, reviews: true, last_minute: true, featured: true,
  social_proof: true, partner_cta: true,
});
```

### ⚠️ BE CAREFUL
- Grep for `quartier` references elsewhere in the codebase before removing.
- The `Quartier` type in `lib/types.ts` stays for now (backward compat) — but mark it as deprecated with a comment.
- Do NOT remove the `quartier` column from the `salons` table — that's a separate DB migration.

**Git commit:** `git add components/HomePage.tsx && git commit -m "CITY-P3-S7: remove quartier section from homepage, clean up dead code"`

---

## Step 8 — Update Payment Methods in Trust Strip

> **Goal:** Remove TWINT mention (not live), show actual payment methods.

#### [MODIFY] `components/HomePage.tsx`

**In the Trust Strip (~line 669–686):**

Update the payment methods item:
```tsx
// FROM:
{ label: t("trust.paymentMethods") }  // "TWINT · Visa · Mastercard"

// TO:
// Update messages/ to show: "Visa · Mastercard · Apple Pay · Google Pay"
```

**Update all 4 locale files** for `trust.paymentMethods`:
- de: `"Kreditkarte · Apple Pay · Google Pay"`
- en: `"Credit Card · Apple Pay · Google Pay"`
- fr: `"Carte de crédit · Apple Pay · Google Pay"`
- it: `"Carta di credito · Apple Pay · Google Pay"`

### ⚠️ BE CAREFUL
- TWINT is removed from ALL user-facing UI until it's actually integrated.
- The trust strip SVG icons stay as-is (they're generic payment icons, not TWINT-specific).

**Git commit:** `git add components/HomePage.tsx messages/ && git commit -m "CITY-P3-S8: payment methods updated — remove TWINT, show CC/Apple/Google Pay"`

---

## Step 9 — Scroll Animation Polish

> **Goal:** Ensure all new sections have proper scroll animations matching the existing pattern.

All new sections (Discover Preview, Map Preview) should use:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  viewport={{ once: true }}
  transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
>
```

Per UI_RULES §4:
- 80ms stagger between children in grids
- 400ms slow reveals for section entrances
- `prefers-reduced-motion` MANDATORY

**Git commit:** `git add components/ && git commit -m "CITY-P3-S9: scroll animation polish on all new sections"`

---

## Smoke Test (Phase 3)

1. ✅ `npm run build` passes
2. ✅ Hero says "BEAUTY.BUCHEN." instead of "BEAUTY.BASEL."
3. ✅ Search bar has 3 fields (Service, City, Date)
4. ✅ City field pre-fills from cookie
5. ✅ Category tiles have SVG icons
6. ✅ Discover preview section shows 3 trending items
7. ✅ "Last Minute" is now "Deals" everywhere
8. ✅ Map preview section links to `/search`
9. ✅ Quartier section is gone
10. ✅ Payment methods show CC/Apple Pay/Google Pay (no TWINT)
11. ✅ All sections have scroll animations
12. ✅ No banned tokens (grep check)
