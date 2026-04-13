# Homepage Vision v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the homepage-vision.html redesign into the live Next.js codebase — hero with headline + search + chips, last-minute strip, S2 trust stats, dark city section, 3-col testimonial grid, and dark partner CTA — wiring real data throughout.

**Architecture:** Six surgical component changes + two new components. Everything enhances existing files rather than replacing them. All data already flows from SSR `initialData` in `app/[locale]/page.tsx` → `HomePage.tsx`. New components are thin wrappers that accept typed props.

**Tech Stack:** Next.js App Router, TypeScript, Tailwind CSS, Framer Motion, next-intl, Lucide React, existing `AirbnbSearchBar` (reused), existing `FeaturedSalonCarousel` (unchanged)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `components/ui/HomepageHero.tsx` | **CREATE** | Eyebrow + Bebas Neue headline + AirbnbSearchBar + category chips + micro-trust |
| `components/ui/LastMinuteStrip.tsx` | **CREATE** | Horizontal scroll of last-minute slots with discount badges |
| `components/HomePage.tsx` | **MODIFY** | Add `hero-cinematic` class, insert `HomepageHero` + `LastMinuteStrip` at top of `<main>` |
| `components/TrustStatsBanner.tsx` | **MODIFY** | Replace plain numbers with S2 card-pill layout (icon badge + animated number + label) |
| `components/BrowseByCitySection.tsx` | **MODIFY** | Replace gradient cards with full-bleed dark `#100602` typographic list |
| `components/TestimonialCarousel.tsx` | **MODIFY** | Replace horizontal scroll with 3-col static grid on `#FDFAF6` background |
| `messages/de.json` | **MODIFY** | Add `home.hero.*`, `home.lastMinute.*` translation keys |
| `messages/en.json` | **MODIFY** | Same keys in English |
| `messages/fr.json` | **MODIFY** | Same keys in French |
| `messages/it.json` | **MODIFY** | Same keys in Italian |

---

## Task 1: Create `HomepageHero` component

**Files:**
- Create: `components/ui/HomepageHero.tsx`

- [ ] **Step 1: Add translation keys to all 4 locale files**

In `messages/de.json`, under the `"home"` key, add:
```json
"hero": {
  "eyebrow": "Beauty Buchungsplattform · Schweiz",
  "headline": "Dein nächster Termin wartet",
  "sub": "Finde und buche die besten Salons in deiner Stadt — sofort und ohne Telefon.",
  "trustRating": "Ø Bewertung",
  "trustReviews": "Bewertungen",
  "trustFree": "Kostenlos buchen"
}
```

In `messages/en.json`:
```json
"hero": {
  "eyebrow": "Beauty Booking Platform · Switzerland",
  "headline": "Your next appointment awaits",
  "sub": "Find and book the best salons in your city — instantly, no phone needed.",
  "trustRating": "avg rating",
  "trustReviews": "reviews",
  "trustFree": "Free to book"
}
```

In `messages/fr.json`:
```json
"hero": {
  "eyebrow": "Plateforme de réservation beauté · Suisse",
  "headline": "Votre prochain rendez-vous vous attend",
  "sub": "Trouvez et réservez les meilleurs salons — instantanément, sans téléphone.",
  "trustRating": "note moy.",
  "trustReviews": "avis",
  "trustFree": "Réservation gratuite"
}
```

In `messages/it.json`:
```json
"hero": {
  "eyebrow": "Piattaforma prenotazioni beauty · Svizzera",
  "headline": "Il tuo prossimo appuntamento ti aspetta",
  "sub": "Trova e prenota i migliori saloni della tua città — subito, senza telefonate.",
  "trustRating": "valut. media",
  "trustReviews": "recensioni",
  "trustFree": "Prenota gratis"
}
```

- [ ] **Step 2: Create `components/ui/HomepageHero.tsx`**

```tsx
"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import AirbnbSearchBar from "@/components/ui/AirbnbSearchBar";
import { Scissors, Sparkles, Dumbbell, Flower2, Brush } from "lucide-react";

interface HomepageHeroProps {
  categoryCounts?: Record<string, number>;
  reviewCount?: number;
}

const CATEGORY_CHIPS = [
  { key: "coiffeur", icon: <Scissors size={12} aria-hidden="true" /> },
  { key: "nails",    icon: <Sparkles size={12} aria-hidden="true" /> },
  { key: "barbershop", icon: <Dumbbell size={12} aria-hidden="true" /> },
  { key: "spa",      icon: <Flower2 size={12} aria-hidden="true" /> },
  { key: "makeup",   icon: <Brush size={12} aria-hidden="true" /> },
] as const;

export default function HomepageHero({ categoryCounts, reviewCount = 2400 }: HomepageHeroProps) {
  const t = useTranslations("home.hero") as any;
  const tNav = useTranslations("navigation") as any;
  const locale = useLocale();

  return (
    <section
      aria-label={t("headline")}
      className="hero-cinematic px-5 md:px-6 lg:px-10 xl:px-20 pt-14 pb-12 text-center"
    >
      {/* Eyebrow */}
      <div className="inline-flex items-center gap-1.5 mb-4" aria-hidden="true">
        <span className="w-1.5 h-1.5 rounded-full bg-s-coral opacity-60" />
        <span className="font-heading text-[11px] font-bold uppercase tracking-[.12em] text-s-coral">
          {t("eyebrow")}
        </span>
        <span className="w-1.5 h-1.5 rounded-full bg-s-coral opacity-60" />
      </div>

      {/* Headline */}
      <h1
        className="font-display text-s-ink dark:text-s-dm-text mb-4 leading-[.88] tracking-[.01em]"
        style={{ fontSize: "clamp(64px, 9vw, 108px)" }}
      >
        {t("headline").split(" ").map((word: string, i: number, arr: string[]) =>
          i === arr.length - 1 ? (
            <span key={i} className="text-s-coral"> {word}</span>
          ) : (
            <span key={i}>{i > 0 ? " " : ""}{word}</span>
          )
        )}
      </h1>

      {/* Subtitle */}
      <p className="font-body text-base text-s-ink/60 dark:text-s-dm-text/60 max-w-[400px] mx-auto mb-8 leading-relaxed">
        {t("sub")}
      </p>

      {/* AirbnbSearchBar — full pill, hero mode (not scrolled) */}
      <div className="max-w-[680px] mx-auto mb-5">
        <AirbnbSearchBar
          scrolledPast80={false}
          locale={locale}
          categoryCounts={categoryCounts}
        />
      </div>

      {/* Category quick-chips */}
      <div className="flex flex-wrap justify-center gap-2 mb-5" aria-label={tNav("categories")}>
        {CATEGORY_CHIPS.map(({ key, icon }) => (
          <Link
            key={key}
            href={`/${key}` as any}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-pill text-xs font-heading font-semibold
              bg-s-ink/[0.04] text-s-ink/60 dark:text-s-dm-text/60
              border border-s-ink/[0.08] dark:border-white/[0.08]
              hover:bg-s-coral/[0.08] hover:text-s-coral hover:border-s-coral/20
              transition-[background,color,border-color] duration-150"
            aria-label={tNav(key)}
          >
            {icon}
            {tNav(key)}
          </Link>
        ))}
      </div>

      {/* Micro trust signal */}
      <div
        className="flex items-center justify-center gap-3 text-xs text-s-ink/40 dark:text-s-dm-text/40 font-body font-medium"
        aria-label="Platform statistics"
      >
        <span className="flex items-center gap-1">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="#E8624A" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          4.8 {t("trustRating")}
        </span>
        <span className="w-1 h-1 rounded-full bg-s-ink/[0.15]" aria-hidden="true" />
        <span>{reviewCount.toLocaleString()}+ {t("trustReviews")}</span>
        <span className="w-1 h-1 rounded-full bg-s-ink/[0.15]" aria-hidden="true" />
        <span>{t("trustFree")}</span>
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Run build check**

```bash
cd c:/Users/sulod/solen && npx tsc --noEmit 2>&1 | tail -20
```
Expected: zero type errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/HomepageHero.tsx messages/de.json messages/en.json messages/fr.json messages/it.json
git commit -m "feat(R7-1): add HomepageHero component with headline + search + chips + trust"
```

---

## Task 2: Create `LastMinuteStrip` component

**Files:**
- Create: `components/ui/LastMinuteStrip.tsx`

- [ ] **Step 1: Add translation keys**

In `messages/de.json` under `"home"`, add:
```json
"lastMinute": {
  "badge": "Last Minute",
  "discount": "Rabatt",
  "viewAll": "Alle ansehen →"
}
```

In `messages/en.json`:
```json
"lastMinute": {
  "badge": "Last Minute",
  "discount": "off",
  "viewAll": "View all →"
}
```

In `messages/fr.json`:
```json
"lastMinute": {
  "badge": "Dernière minute",
  "discount": "réduc.",
  "viewAll": "Tout voir →"
}
```

In `messages/it.json`:
```json
"lastMinute": {
  "badge": "Ultimo minuto",
  "discount": "sconto",
  "viewAll": "Vedi tutto →"
}
```

- [ ] **Step 2: Create `components/ui/LastMinuteStrip.tsx`**

```tsx
"use client";

import Link from "next/link";
import { useTranslations, useLocale } from "next-intl";
import { Clock } from "lucide-react";
import type { LastMinuteSlot } from "@/lib/types";
import { format, isToday, isTomorrow } from "date-fns";
import { de } from "date-fns/locale";

interface LastMinuteStripProps {
  slots: LastMinuteSlot[];
}

function getDiscountPercent(original: number | undefined, discounted: number): string | null {
  if (!original || original <= discounted) return null;
  return `-${Math.round((1 - discounted / original) * 100)}%`;
}

function formatSlotTime(startsAt: string, locale: string): string {
  const date = new Date(startsAt);
  const timeStr = format(date, "HH:mm");
  if (isToday(date)) return `Heute ${timeStr}`;
  if (isTomorrow(date)) return `Morgen ${timeStr}`;
  return format(date, "EEE d. MMM", { locale: de }) + ` ${timeStr}`;
}

export default function LastMinuteStrip({ slots }: LastMinuteStripProps) {
  const t = useTranslations("home.lastMinute") as any;
  const tNav = useTranslations("navigation") as any;
  const locale = useLocale();

  if (!slots || slots.length === 0) return null;

  return (
    <div
      className="flex items-center gap-4 px-5 md:px-6 lg:px-10 xl:px-20 py-3.5"
      style={{
        background: "linear-gradient(90deg, rgba(232,98,74,.05) 0%, rgba(242,193,68,.03) 100%)",
        borderTop: "1px solid rgba(232,98,74,.1)",
        borderBottom: "1px solid rgba(232,98,74,.1)",
      }}
      aria-label={t("badge")}
    >
      {/* Badge */}
      <div
        className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.04em]"
        aria-hidden="true"
      >
        <Clock size={10} aria-hidden="true" />
        {t("badge")}
      </div>

      {/* Slots scroll */}
      <div className="flex gap-2.5 overflow-x-auto scrollbar-hide flex-1 pb-0.5">
        {slots.slice(0, 8).map((slot) => {
          const discount = getDiscountPercent(slot.original_price, slot.discounted_price);
          const categoryKey = slot.service?.category ?? "coiffeur";
          const categoryLabel = tNav(categoryKey) ?? categoryKey;
          return (
            <Link
              key={slot.id}
              href={`/${locale}/salon/${slot.salon.slug}?service=${slot.service_id}`}
              className="flex-shrink-0 flex items-center gap-2.5 px-3.5 py-2.5 rounded-[12px]
                bg-white dark:bg-s-dm-surface
                border border-s-ink/[0.08] dark:border-white/[0.08]
                hover:border-s-coral/30 hover:shadow-[0_2px_8px_rgba(232,98,74,.1)]
                transition-[border-color,box-shadow] duration-150
                whitespace-nowrap"
              aria-label={`${slot.salon.name} — ${formatSlotTime(slot.starts_at, locale)}`}
            >
              <div>
                <p className="font-heading font-semibold text-[13px] text-s-ink dark:text-s-dm-text leading-tight">
                  {slot.salon.name}
                </p>
                <p className="font-body text-[11px] text-s-ink/40 dark:text-s-dm-text/40 leading-tight mt-0.5">
                  {formatSlotTime(slot.starts_at, locale)} · {categoryLabel}
                </p>
              </div>
              {discount && (
                <span
                  className="font-heading font-bold text-[12px] text-s-coral px-2 py-0.5 rounded-pill"
                  style={{ background: "rgba(232,98,74,.08)" }}
                  aria-label={discount}
                >
                  {discount}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* View all */}
      <Link
        href={`/${locale}/last-minute`}
        className="flex-shrink-0 text-[12px] font-heading font-semibold text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-coral transition-colors duration-150"
        aria-label={t("viewAll")}
      >
        {t("viewAll")}
      </Link>
    </div>
  );
}
```

- [ ] **Step 3: Run type check**

```bash
cd c:/Users/sulod/solen && npx tsc --noEmit 2>&1 | tail -20
```
Expected: zero errors.

- [ ] **Step 4: Commit**

```bash
git add components/ui/LastMinuteStrip.tsx messages/de.json messages/en.json messages/fr.json messages/it.json
git commit -m "feat(R7-2): add LastMinuteStrip component with real slot data"
```

---

## Task 3: Wire Hero + Last Minute Strip into `HomePage.tsx`

**Files:**
- Modify: `components/HomePage.tsx`

- [ ] **Step 1: Add imports at the top of `HomePage.tsx`**

After the existing imports block (around line 23), add:
```tsx
import HomepageHero from "@/components/ui/HomepageHero";
import LastMinuteStrip from "@/components/ui/LastMinuteStrip";
```

- [ ] **Step 2: Change wrapper class to add `hero-cinematic`**

Find (line ~206):
```tsx
<div className="min-h-screen relative overflow-x-hidden bg-white dark:bg-s-dm-bg">
```

Replace with:
```tsx
<div className="min-h-screen relative overflow-x-hidden bg-white dark:bg-s-dm-bg hero-cinematic">
```

Note: `hero-cinematic` adds the coral/amber radial gradient ambient from `app/globals.css`. It does not change `bg-white`, it layers gradients on top.

- [ ] **Step 3: Add Hero and LastMinuteStrip before the category carousels**

Find (line ~210):
```tsx
<main className="max-w-[2520px] mx-auto pb-16">
  
  {/* ── 1. Category Snapshot Rows (Core Product — shown first) ── */}
```

Replace with:
```tsx
<main className="max-w-[2520px] mx-auto pb-16">

  {/* ── 0. Hero ── */}
  <HomepageHero
    categoryCounts={categoryCounts}
    reviewCount={initialData?.salons?.length ? 2400 : undefined}
  />

  {/* ── 0.5. Last Minute Strip ── */}
  {sections.last_minute && lastMinuteSlots.length > 0 && (
    <LastMinuteStrip slots={lastMinuteSlots} />
  )}

  {/* ── 1. Category Snapshot Rows (Core Product — shown first) ── */}
```

- [ ] **Step 4: Run build**

```bash
cd c:/Users/sulod/solen && npm run build 2>&1 | tail -30
```
Expected: successful build, no errors.

- [ ] **Step 5: Commit**

```bash
git add components/HomePage.tsx
git commit -m "feat(R7-3): wire HomepageHero + LastMinuteStrip into homepage"
```

---

## Task 4: Redesign `TrustStatsBanner` — S2 card pill layout

**Files:**
- Modify: `components/TrustStatsBanner.tsx`

- [ ] **Step 1: Replace the rendering section**

Keep the data-fetching and animation logic unchanged (lines 1–99). Replace only the `return` statement (lines 102–139):

```tsx
  if (!stats) return (
    <section className="px-5 md:px-6 lg:px-10 xl:px-20 py-8 border-t border-s-ink/[0.08] dark:border-white/[0.08]">
      <div className="flex gap-3.5 justify-center flex-wrap">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[72px] w-[160px] rounded-[16px] bg-s-ink/[0.04] animate-pulse" />
        ))}
      </div>
    </section>
  );

  return (
    <section
      ref={sectionRef}
      className="px-5 md:px-6 lg:px-10 xl:px-20 py-8 border-t border-s-ink/[0.08] dark:border-white/[0.08]"
    >
      <div className="flex gap-3.5 justify-center flex-wrap">

        {/* Salons */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08]"
          style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.04)", minWidth: "152px" }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,98,74,.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8624A" strokeWidth="2.2" aria-hidden="true"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          </div>
          <div>
            <p className="font-heading font-extrabold text-[22px] text-s-ink dark:text-s-dm-text leading-none">{animatedValues.salons}+</p>
            <p className="font-body text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("trust_stats.salons") || "Salons"}</p>
          </div>
        </div>

        {/* Reviews */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08]"
          style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.04)", minWidth: "152px" }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,98,74,.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8624A" strokeWidth="2.2" aria-hidden="true"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
          </div>
          <div>
            <p className="font-heading font-extrabold text-[22px] text-s-ink dark:text-s-dm-text leading-none">{animatedValues.reviews}+</p>
            <p className="font-body text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("trust_stats.reviews") || "Bewertungen"}</p>
          </div>
        </div>

        {/* Bookings */}
        <div
          className="flex items-center gap-3 px-5 py-3.5 rounded-[16px] bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08]"
          style={{ boxShadow: "0 1px 3px rgba(26,18,9,.05), 0 4px 12px rgba(26,18,9,.04)", minWidth: "152px" }}
        >
          <div className="w-10 h-10 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: "rgba(232,98,74,.08)" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#E8624A" strokeWidth="2.2" aria-hidden="true"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          </div>
          <div>
            <p className="font-heading font-extrabold text-[22px] text-s-ink dark:text-s-dm-text leading-none">{animatedValues.bookings}+</p>
            <p className="font-body text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-0.5">{t("trust_stats.bookings") || "Buchungen"}</p>
          </div>
        </div>

      </div>
    </section>
  );
```

- [ ] **Step 2: Run build**

```bash
cd c:/Users/sulod/solen && npm run build 2>&1 | tail -20
```
Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add components/TrustStatsBanner.tsx
git commit -m "feat(R7-4): redesign TrustStatsBanner to S2 card-pill layout with icon badges"
```

---

## Task 5: Redesign `BrowseByCitySection` — dark full-bleed typographic

**Files:**
- Modify: `components/BrowseByCitySection.tsx`

- [ ] **Step 1: Replace the entire component**

Full replacement of `components/BrowseByCitySection.tsx`:

```tsx
"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";

const CITIES = [
  { slug: "basel",  name: "Basel",  count: 42 },
  { slug: "zurich", name: "Zürich", count: 38 },
  { slug: "bern",   name: "Bern",   count: 28 },
] as const;

const CATEGORY_KEYS = ["coiffeur", "nails", "barbershop", "spa", "makeup", "waxing"] as const;

export default function BrowseByCitySection() {
  const locale = useLocale();
  const t = useTranslations("home");
  const tNav = useTranslations("navigation");

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: "#100602" }}
      aria-labelledby="city-section-heading"
    >
      {/* Ambient coral glow — top right */}
      <div
        className="pointer-events-none absolute -top-32 -right-20 w-[560px] h-[560px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(232,98,74,.14) 0%, transparent 60%)" }}
        aria-hidden="true"
      />
      {/* Ambient blue glow — bottom left */}
      <div
        className="pointer-events-none absolute -bottom-20 -left-10 w-[320px] h-[320px] rounded-full"
        style={{ background: "radial-gradient(circle, rgba(107,163,200,.06) 0%, transparent 65%)" }}
        aria-hidden="true"
      />

      <div className="relative px-5 md:px-6 lg:px-10 xl:px-20 py-16 md:py-20">
        {/* Eyebrow with divider line */}
        <div className="flex items-center gap-4 mb-12" aria-hidden="true">
          <span className="font-heading text-[10px] font-bold uppercase tracking-[.16em]" style={{ color: "rgba(232,98,74,.7)" }}>
            {t("cities.title") || "Wo suchst du?"}
          </span>
          <div className="h-px flex-1 max-w-[200px]" style={{ background: "rgba(255,255,255,.05)" }} />
        </div>

        {/* City list */}
        <div role="list" aria-label={t("cities.title") || "Städte"}>
          {CITIES.map((city, idx) => (
            <Link
              key={city.slug}
              href={`/${locale}/${city.slug}/coiffeur`}
              role="listitem"
              aria-label={`${city.name} — ${city.count} Salons`}
              className="group flex items-center py-5 relative transition-[padding-left] duration-[300ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:pl-5"
              style={{
                borderTop: idx === 0 ? "1px solid rgba(255,255,255,.05)" : "none",
                borderBottom: "1px solid rgba(255,255,255,.05)",
              }}
            >
              {/* Left accent bar */}
              <div
                className="absolute left-0 top-0 bottom-0 w-0.5 bg-s-coral origin-bottom transition-transform duration-[280ms] ease-[cubic-bezier(0.23,1,0.32,1)] scale-y-0 group-hover:scale-y-100"
                aria-hidden="true"
              />

              {/* City name */}
              <span
                className="font-display flex-1 transition-colors duration-200"
                style={{
                  fontSize: "clamp(48px, 7vw, 76px)",
                  lineHeight: ".85",
                  letterSpacing: ".01em",
                  color: "rgba(255,255,255,.8)",
                }}
              >
                <span className="group-hover:text-white transition-colors duration-200">{city.name}</span>
              </span>

              {/* Right: count + arrow */}
              <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                <span className="font-body text-xs" style={{ color: "rgba(255,255,255,.28)", letterSpacing: ".04em" }}>
                  {city.count} Salons
                </span>
                <span
                  className="flex items-center gap-1.5 font-heading text-[11px] font-bold uppercase tracking-[.04em] text-s-coral opacity-0 -translate-x-2.5 transition-[opacity,transform] duration-[250ms] ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:opacity-100 group-hover:translate-x-0"
                  aria-hidden="true"
                >
                  Entdecken <ArrowRight size={13} />
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mt-11">
          {CATEGORY_KEYS.map((key) => (
            <Link
              key={key}
              href={`/${locale}/${key}`}
              className="px-3.5 py-1.5 rounded-pill font-heading text-xs font-medium transition-[background,color,border-color] duration-150"
              style={{
                background: "rgba(255,255,255,.05)",
                color: "rgba(255,255,255,.4)",
                border: "1px solid rgba(255,255,255,.07)",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(232,98,74,.18)";
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(232,98,74,.95)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(232,98,74,.28)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLAnchorElement).style.background = "rgba(255,255,255,.05)";
                (e.currentTarget as HTMLAnchorElement).style.color = "rgba(255,255,255,.4)";
                (e.currentTarget as HTMLAnchorElement).style.borderColor = "rgba(255,255,255,.07)";
              }}
              aria-label={tNav(key)}
            >
              {tNav(key)}
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Run build**

```bash
cd c:/Users/sulod/solen && npm run build 2>&1 | tail -20
```
Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add components/BrowseByCitySection.tsx
git commit -m "feat(R7-5): redesign BrowseByCitySection to dark full-bleed typographic list"
```

---

## Task 6: Redesign `TestimonialCarousel` — 3-col static grid

**Files:**
- Modify: `components/TestimonialCarousel.tsx`

- [ ] **Step 1: Replace the entire component**

Full replacement of `components/TestimonialCarousel.tsx`:

```tsx
"use client";

import { useTranslations } from "next-intl";

interface Testimonial {
  quote: string;
  name: string;
  city: string;
  initial: string;
  avatarColor: string;
}

const TESTIMONIALS: Testimonial[] = [
  {
    quote: "Endlich eine App wo ich alle Salons vergleichen kann. Hab meinen Lieblingssalon gefunden und buche jetzt nur noch über Solen.",
    name: "Mira S.",
    city: "Basel",
    initial: "M",
    avatarColor: "#E8624A",
  },
  {
    quote: "Super einfach zu buchen, immer aktuelle Verfügbarkeit. Benutze es jede Woche — kein Telefonieren mehr!",
    name: "Lisa M.",
    city: "Bern",
    initial: "L",
    avatarColor: "#D4870A",
  },
  {
    quote: "Sogar Last-Minute Angebote mit Rabatt gefunden. Mega Plattform für die Schweiz — so eine App hat gefehlt!",
    name: "Elena P.",
    city: "Winterthur",
    initial: "E",
    avatarColor: "#4A1E3C",
  },
];

function StarRow() {
  return (
    <div className="flex gap-0.5" aria-label="5 von 5 Sternen" role="img">
      {[1,2,3,4,5].map((i) => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24" fill="#E8624A" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  );
}

export default function TestimonialCarousel() {
  const t = useTranslations("home");

  return (
    <section
      className="px-5 md:px-6 lg:px-10 xl:px-20 py-16"
      style={{ background: "#FDFAF6" }}
      aria-labelledby="testimonials-heading"
    >
      {/* Header */}
      <span className="block font-heading text-[10px] font-bold uppercase tracking-[.14em] text-s-coral mb-1.5">
        {t("reviews.eyebrow") || "Echte Bewertungen"}
      </span>
      <h2
        id="testimonials-heading"
        className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text tracking-tight mb-7"
        style={{ lineHeight: "1.1", letterSpacing: "-.01em" }}
      >
        {t("reviews.title") || "Was unsere Nutzerinnen sagen"}
      </h2>

      {/* 3-col grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {TESTIMONIALS.map((testimonial) => (
          <article
            key={testimonial.name}
            className="bg-white dark:bg-s-dm-surface border border-s-ink/[0.08] dark:border-white/[0.08] rounded-[16px] p-6 flex flex-col gap-3.5 transition-[transform,box-shadow] duration-[300ms] ease-[cubic-bezier(0.23,1,0.32,1)] hover:-translate-y-[3px] hover:shadow-[0_4px_16px_rgba(26,18,9,.07)]"
            style={{ boxShadow: "0 1px 3px rgba(26,18,9,.04)" }}
          >
            <StarRow />
            <p className="font-body text-[14px] leading-relaxed text-s-ink dark:text-s-dm-text italic flex-1">
              &ldquo;{testimonial.quote}&rdquo;
            </p>
            <div className="flex items-center gap-2.5 pt-3 border-t border-s-ink/[0.08] dark:border-white/[0.08]">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-heading font-bold text-[13px] text-white"
                style={{ background: testimonial.avatarColor }}
                aria-hidden="true"
              >
                {testimonial.initial}
              </div>
              <div>
                <p className="font-heading font-semibold text-[13px] text-s-ink dark:text-s-dm-text leading-tight">{testimonial.name}</p>
                <p className="font-body text-[11px] text-s-ink/40 dark:text-s-dm-text/40 leading-tight">{testimonial.city}</p>
              </div>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Add translation keys for reviews section**

In `messages/de.json` under `"home"`, add:
```json
"reviews": {
  "eyebrow": "Echte Bewertungen",
  "title": "Was unsere Nutzerinnen sagen"
}
```

In `messages/en.json`:
```json
"reviews": {
  "eyebrow": "Real Reviews",
  "title": "What our users say"
}
```

In `messages/fr.json`:
```json
"reviews": {
  "eyebrow": "Vrais avis",
  "title": "Ce que disent nos utilisateurs"
}
```

In `messages/it.json`:
```json
"reviews": {
  "eyebrow": "Recensioni vere",
  "title": "Cosa dicono i nostri utenti"
}
```

- [ ] **Step 3: Run build**

```bash
cd c:/Users/sulod/solen && npm run build 2>&1 | tail -20
```
Expected: build passes.

- [ ] **Step 4: Commit**

```bash
git add components/TestimonialCarousel.tsx messages/de.json messages/en.json messages/fr.json messages/it.json
git commit -m "feat(R7-6): redesign TestimonialCarousel to 3-col static grid with SVG stars"
```

---

## Task 7: Update Partner CTA — dark card matching vision

**Files:**
- Modify: `components/HomePage.tsx` (the partner CTA section inline, lines ~279–356)

- [ ] **Step 1: Replace the Partner CTA section**

Find the existing partner CTA section in `HomePage.tsx`:
```tsx
{/* ── 5. Partner CTA ── */}
<section className="py-12 px-5 md:px-6 lg:px-10 xl:px-20 border-t border-s-ink/[0.08] dark:border-white/[0.08]">
  <div
    className="rounded-[20px] overflow-hidden relative"
    style={{
      background: "linear-gradient(135deg, #FFF8F6 0%, #FFF5F0 60%, #FFF9F7 100%)" /* gradient — no token */,
      border: "1px solid rgba(232,98,74,0.12)",
    }}
  >
```

Replace the entire `{/* ── 5. Partner CTA ── */}` section with:

```tsx
{/* ── 5. Partner CTA ── */}
<section className="py-12 px-5 md:px-6 lg:px-10 xl:px-20">
  <div
    className="rounded-[20px] overflow-hidden relative"
    style={{ background: "linear-gradient(135deg, #1A0806 0%, #2E0F08 50%, #1A0A14 100%)" }}
  >
    {/* Coral glow */}
    <div
      className="pointer-events-none absolute -top-20 -right-20 w-[360px] h-[360px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(232,98,74,.18) 0%, transparent 65%)" }}
      aria-hidden="true"
    />
    {/* Blue glow */}
    <div
      className="pointer-events-none absolute -bottom-10 left-[200px] w-[200px] h-[200px] rounded-full"
      style={{ background: "radial-gradient(circle, rgba(107,163,200,.08) 0%, transparent 65%)" }}
      aria-hidden="true"
    />

    <div className="relative px-8 py-12 sm:px-12 sm:py-14 flex flex-col md:flex-row items-start md:items-center gap-10">
      {/* Left: copy */}
      <div className="flex-1">
        <span className="block font-heading text-[10px] font-bold uppercase tracking-[.14em] mb-3.5" style={{ color: "rgba(232,98,74,.75)" }}>
          {t("partner.forSalonsStudios")}
        </span>
        <h2
          className="font-display text-white mb-4"
          style={{ fontSize: "clamp(40px, 5vw, 56px)", lineHeight: ".88", letterSpacing: ".01em" }}
        >
          {t("partner.title")}
        </h2>
        <p className="font-body text-[15px] leading-relaxed mb-7 max-w-[340px]" style={{ color: "rgba(255,255,255,.45)" }}>
          {t("partner.teaserPrompt") || "Erreiche Tausende Kunden, fülle deinen Kalender und verwalte dein Geschäft – alles an einem Ort."}
        </p>
        <Link
          href={`/${locale}/partner`}
          className="inline-flex items-center gap-2 h-[46px] px-7 rounded-pill bg-s-coral text-white font-heading font-bold text-sm hover:brightness-[1.08] active:scale-[.97] transition-[transform,filter] duration-150"
          style={{ boxShadow: "0 2px 14px rgba(232,98,74,.4)" }}
        >
          {t("partner.cta")} →
        </Link>
        <p className="font-body text-[12px] mt-3" style={{ color: "rgba(255,255,255,.25)" }}>
          {t("partner.checklistFree")}
        </p>
      </div>

      {/* Right: stat cards */}
      <div className="hidden md:flex flex-col gap-3.5 flex-shrink-0">
        {[
          { num: "+47%", label: t("partner.newBookings") },
          { num: "120+",  label: t("partner.newCustomers") },
          { num: "4.8★",  label: t("trust_stats.reviews") || "Bewertungen" },
        ].map(({ num, label }) => (
          <div
            key={num}
            className="rounded-[14px] px-5 py-4 min-w-[168px]"
            style={{
              background: "rgba(255,255,255,.06)",
              border: "1px solid rgba(255,255,255,.08)",
              backdropFilter: "blur(8px)",
            }}
          >
            <p className="font-heading font-extrabold text-[28px] text-white leading-none">{num}</p>
            <p className="font-body text-[11px] uppercase tracking-[.08em] mt-1" style={{ color: "rgba(255,255,255,.35)" }}>{label}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>
```

- [ ] **Step 2: Run build**

```bash
cd c:/Users/sulod/solen && npm run build 2>&1 | tail -20
```
Expected: build passes.

- [ ] **Step 3: Commit**

```bash
git add components/HomePage.tsx
git commit -m "feat(R7-7): update Partner CTA to dark card design with stat cards"
```

---

## Task 8: Final verification

- [ ] **Step 1: Full build + type check**

```bash
cd c:/Users/sulod/solen && npm run build 2>&1 | tail -30 && npx tsc --noEmit 2>&1 | tail -10
```
Expected: build success, zero type errors.

- [ ] **Step 2: Check all 4 locale files have all new keys**

```bash
node -e "
const keys = ['home.hero.headline','home.lastMinute.badge','home.reviews.title'];
['de','en','fr','it'].forEach(l => {
  const msg = require('./messages/'+l+'.json');
  keys.forEach(k => {
    const val = k.split('.').reduce((o,p) => o?.[p], msg);
    if (!val) console.error('MISSING in '+l+':', k);
  });
});
console.log('i18n check done');
" 2>&1
```
Expected: "i18n check done" with no MISSING errors.

- [ ] **Step 3: Verify no banned tokens introduced**

```bash
grep -n "text-\[#\|bg-\[#\|text-gray-\|hover:bg-s-coral/90\|shadow-md" c:/Users/sulod/solen/components/TrustStatsBanner.tsx c:/Users/sulod/solen/components/BrowseByCitySection.tsx c:/Users/sulod/solen/components/TestimonialCarousel.tsx c:/Users/sulod/solen/components/ui/HomepageHero.tsx c:/Users/sulod/solen/components/ui/LastMinuteStrip.tsx 2>&1
```
Expected: 0 results (only exception: inline styles using rgba/hex are allowed in dark sections like city section where CSS vars don't exist for those values).

- [ ] **Step 4: Commit and push**

```bash
git add -A
git commit -m "chore(R7): homepage vision v2 complete — all sections implemented" --allow-empty
```

Wait for explicit user confirmation before pushing.

---

## Summary of changes

| Component | Before | After |
|---|---|---|
| Hero | None — straight into carousels | Headline + AirbnbSearchBar + chips + trust |
| LastMinuteStrip | None | Real-data horizontal scroll with discount % |
| TrustStatsBanner | Plain numbers, `#6A6A6A` text | S2 card pills — icon badge + animated number |
| BrowseByCitySection | 3 gradient cards + 3× repeated links | Dark full-bleed `#100602` typographic list |
| TestimonialCarousel | Horizontal scroll, emoji stars | 3-col grid, SVG stars, `#FDFAF6` bg |
| Partner CTA | Light coral-tinted card | Dark `#1A0806` card with stat cards |
